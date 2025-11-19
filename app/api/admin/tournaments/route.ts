// app/api/admin/tournaments/route.ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "admin") return unauthorized();

    const tournaments = await prisma.tournament.findMany({
      include: { _count: { select: { teams: true } } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(tournaments, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("❌ Error fetching tournaments:", error);
    return NextResponse.json({ error: "Failed to fetch tournaments" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "admin") return unauthorized();

    const body = await req.json();

    const {
      title,
      mode,
      gameType,
      entryFee,
      prizePool,
      description,
      startTime,
        maxParticipants,
        lobbyCode,
        lobbyPassword,
    } = body as any;

    if (!title || !mode || !gameType || entryFee === undefined || prizePool === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!["Solo", "Duo", "Squad"].includes(mode)) {
      return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
    }

    if (!["BR", "CS"].includes(gameType)) {
      return NextResponse.json({ error: "Invalid game type" }, { status: 400 });
    }

    // Validate entry fee (should be 50 coins per player as per plan)
    const entryFeeNum = Number(entryFee);
    if (entryFeeNum !== 50) {
      return NextResponse.json({ 
        error: `Entry fee must be 50 coins per player. Current: ${entryFeeNum}` 
      }, { status: 400 });
    }

    // Prize pool is now decided by admin - no validation
    const prizePoolNum = Number(prizePool);
    if (prizePoolNum < 0) {
      return NextResponse.json({ 
        error: `Prize pool must be a positive number` 
      }, { status: 400 });
    }

    const tournament = await prisma.tournament.create({
      data: {
        title,
        mode,
        gameType,
        entryFee: entryFeeNum,
        prizePool: prizePoolNum,
        description: description || "",
        startTime: startTime ? new Date(startTime) : null,
        maxParticipants: maxParticipants ? Number(maxParticipants) : null,
        status: "upcoming",
        lobbyCode: lobbyCode ? String(lobbyCode) : undefined,
        lobbyPassword: lobbyPassword ? String(lobbyPassword) : undefined,
      },
    });

    return NextResponse.json(tournament);
  } catch (error) {
    console.error("❌ Error creating tournament:", error);
    return NextResponse.json({ error: "Failed to create tournament" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "admin") return unauthorized();

    const body = await req.json();
    const { id, status, startTime, ...updateData } = body as any;

    if (!id) return NextResponse.json({ error: "Tournament ID required" }, { status: 400 });

    const prev = await prisma.tournament.findUnique({ where: { id } });

    // Only allow updating known fields to avoid Prisma unknown-arg errors
    const allowed = [
      "title",
      "mode",
      "gameType",
      "entryFee",
      "prizePool",
      "description",
      "maxParticipants",
      "lobbyCode",
      "lobbyPassword",
      "isOpen",
      "status",
    ];

    const dataToUpdate: any = {};
    for (const key of allowed) {
      if (Object.prototype.hasOwnProperty.call(updateData, key)) {
        dataToUpdate[key] = updateData[key];
      }
    }

    // Handle explicit status/startTime passed separately
    if (typeof status !== "undefined") dataToUpdate.status = status;
    if (typeof startTime !== "undefined") dataToUpdate.startTime = startTime ? new Date(startTime) : null;

    if (Object.keys(dataToUpdate).length === 0) {
      console.warn("No valid fields provided for update", { id, updateData });
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    // Normalize lobbyPassword: convert empty string to null to avoid DB issues
    if (Object.prototype.hasOwnProperty.call(dataToUpdate, "lobbyPassword")) {
      const val = dataToUpdate.lobbyPassword;
      if (val === "" || typeof val === "undefined") dataToUpdate.lobbyPassword = null;
      else dataToUpdate.lobbyPassword = String(val);
    }

    console.log("Updating tournament", { id, dataToUpdate });

    let tournament;
    try {
      tournament = await prisma.tournament.update({ where: { id }, data: dataToUpdate });
    } catch (err: any) {
      console.error("Prisma update error for tournament", id, err);
      // Prisma 'not found' error code
      if (err?.code === "P2025") {
        return NextResponse.json({ error: `Tournament not found: ${id}` }, { status: 404 });
      }
      throw err; // rethrow to be handled by outer catch
    }

    // Fire notifications when lobby code is set or status becomes running
    const prevLobbyCode = prev?.lobbyCode || "";
    const newLobbyCode = (dataToUpdate.lobbyCode as string) || "";
    const lobbyCodeChanged = newLobbyCode !== "" && newLobbyCode !== prevLobbyCode;
    const shouldNotifyStart = (dataToUpdate.status && dataToUpdate.status === "running") || lobbyCodeChanged;

    if (shouldNotifyStart) {
      const teams = await prisma.team.findMany({ where: { tournamentId: id }, include: { members: true } });

      // Notify all team members (not just captains)
      const allUserIds = new Set<string>();
      teams.forEach((team) => {
        allUserIds.add(team.captainId);
        team.members.forEach((member) => {
          if (member.userId) allUserIds.add(member.userId);
        });
      });

      const tournamentFull = await prisma.tournament.findUnique({ where: { id } });

      await prisma.$transaction(
        Array.from(allUserIds).map((userId) =>
          prisma.notification.create({
            data: {
              userId,
              type: lobbyCodeChanged ? "start" : "reminder",
              message: lobbyCodeChanged
                ? `Room Code available for "${tournamentFull?.title || "tournament"}": ${newLobbyCode} — Join now!`
                : `Reminder: Your match "${tournamentFull?.title || "tournament"}" starts soon. Get ready!`,
              metadata: {
                tournamentId: id,
                lobbyCode: lobbyCodeChanged ? newLobbyCode : null,
                tournamentTitle: tournamentFull?.title,
              },
            },
          })
        )
      );
    }

    return NextResponse.json(tournament);
  } catch (error: any) {
    console.error("❌ Error updating tournament:", error);
    const msg = error?.message || String(error) || "Failed to update tournament";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "admin") return unauthorized();

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "Tournament ID required" }, { status: 400 });

    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: { _count: { select: { teams: true } } },
    });

    if (tournament && tournament._count.teams > 0) {
      return NextResponse.json(
        { error: "Cannot delete a tournament with registered teams" },
        { status: 400 }
      );
    }

    await prisma.tournament.delete({ where: { id } });

    return NextResponse.json({ message: "Tournament deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting tournament:", error);
    return NextResponse.json({ error: "Failed to delete tournament" }, { status: 500 });
  }
}
