// app/api/admin/tournaments/[id]/winner/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    // ✅ Parse params
    const { id } = await context.params;
    const tournamentId = id || new URL(request.url).pathname.split("/").at(-2);
    const { teamId } = await request.json();

    // ✅ Validate IDs
    if (!tournamentId) {
      return NextResponse.json({ error: "Missing tournament ID" }, { status: 400 });
    }
    if (!teamId) {
      return NextResponse.json({ error: "Missing team ID" }, { status: 400 });
    }

    // ✅ Fetch tournament & team
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: { winners: true },
    });
    if (!tournament) {
      return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
    }

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: { captain: true },
    });
    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    if (tournament.winners.length > 0) {
      return NextResponse.json({ error: "Winner already declared" }, { status: 400 });
    }

    const rewardCoins = tournament.prizePool;
    const tid = tournamentId as string; // ✅ ensure correct Prisma type

    // ✅ Transaction — record winner, update tournament, credit wallet, and notify
    await prisma.$transaction(async (tx) => {
      await tx.winner.create({
        data: {
          tournamentId: tid,
          teamId,
          placement: 1,
          rewardCoins,
        },
      });

      await tx.tournament.update({
        where: { id: tid },
        data: { status: "ended", isOpen: false },
      });

      await tx.wallet.upsert({
        where: { userId: team.captainId },
        update: { balance: { increment: rewardCoins } },
        create: { userId: team.captainId, balance: rewardCoins },
      });

      await tx.notification.create({
        data: {
          userId: team.captainId,
          type: "prize",
          message: `🏆 Congratulations! You won ${rewardCoins} coins in ${tournament.title}!`,
        },
      });
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("❌ Error in winner route:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
