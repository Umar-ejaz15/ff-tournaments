// app/api/admin/tournaments/route.ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTotalPrizePool } from "@/lib/prize-calculator";

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

    // Validate prize pool matches plan structure
    const expectedPrizePool = getTotalPrizePool(
      mode as "Solo" | "Duo" | "Squad",
      gameType as "BR" | "CS"
    );
    const prizePoolNum = Number(prizePool);
    
    if (expectedPrizePool > 0 && prizePoolNum !== expectedPrizePool) {
      // Get individual prize amounts for better error message
      const prizes = {
        "BR-Solo": { top1: 2500, top2: 1500, top3: 1000 },
        "BR-Duo": { top1: 3200, top2: 1800, top3: 1200 },
        "BR-Squad": { top1: 3500, top2: 2000, top3: 1500 },
        "CS-Solo": { top1: 2500, top2: 1500, top3: 1000 },
        "CS-Duo": { top1: 3200, top2: 1800, top3: 1200 },
        "CS-Squad": { top1: 3500, top2: 2000, top3: 1500 },
      };
      const key = `${gameType}-${mode}`;
      const prizeInfo = prizes[key as keyof typeof prizes];
      return NextResponse.json({ 
        error: `Prize pool for ${gameType} ${mode} should be ${expectedPrizePool} coins total (Top 1: ${prizeInfo.top1}, Top 2: ${prizeInfo.top2}, Top 3: ${prizeInfo.top3}). Current: ${prizePoolNum}` 
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
    const tournament = await prisma.tournament.update({
      where: { id },
      data: {
        ...updateData,
        status: status ?? undefined,
        startTime: startTime ? new Date(startTime) : undefined,
      },
    });

    // Fire notifications when lobby code is set or status becomes running
    const shouldNotifyStart = (status && status === "running") || (!!updateData.lobbyCode && updateData.lobbyCode !== "");
    if (shouldNotifyStart) {
      const teams = await prisma.team.findMany({ where: { tournamentId: id } });
      // Notify captains
      await prisma.$transaction(
        teams.map((t) =>
          prisma.notification.create({
            data: {
              userId: t.captainId,
              type: updateData.lobbyCode ? "start" : "reminder",
              message: updateData.lobbyCode
                ? "🎮 Room Code available — join your Battle Royale match now!"
                : "⚔️ Reminder: Your match starts soon. Get ready!",
              metadata: { tournamentId: id, lobbyCode: (updateData as any).lobbyCode ?? null },
            },
          })
        )
      );
    }

    return NextResponse.json(tournament);
  } catch (error) {
    console.error("❌ Error updating tournament:", error);
    return NextResponse.json({ error: "Failed to update tournament" }, { status: 500 });
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
