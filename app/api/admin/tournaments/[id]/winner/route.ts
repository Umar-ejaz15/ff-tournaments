// app/api/admin/tournaments/[id]/winner/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { calculatePrizeReward, type Placement } from "@/lib/prize-calculator";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    // ✅ Parse params
    const { id } = await context.params;
    const tournamentId = id || new URL(request.url).pathname.split("/").at(-2);
    const body = await request.json();
    const { teamId, placement = 1 } = body;
    // Optional manual override (admin may provide exact coin amount)
    const overrideCoinsRaw = body?.rewardCoins;

    // ✅ Validate IDs
    if (!tournamentId) {
      return NextResponse.json({ error: "Missing tournament ID" }, { status: 400 });
    }
    if (!teamId) {
      return NextResponse.json({ error: "Missing team ID" }, { status: 400 });
    }
    if (![1, 2, 3].includes(placement)) {
      return NextResponse.json({ error: "Invalid placement. Must be 1, 2, or 3" }, { status: 400 });
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

    // Check if this placement is already taken
    const existingPlacement = tournament.winners.find((w: any) => w.placement === placement);
    if (existingPlacement) {
      return NextResponse.json(
        { error: `Placement ${placement} is already taken` },
        { status: 400 }
      );
    }

    // Calculate reward based on actual prize pool and placement
    // Uses dynamic percentage-based distribution (Top 1: 55%, Top 2: 30%, Top 3: 15%)
    let rewardCoins = calculatePrizeReward(
      tournament.prizePool,
      placement as Placement
    );

    // If admin provided a manual override, validate and use it
    if (overrideCoinsRaw !== undefined && overrideCoinsRaw !== null) {
      const parsed = Number(overrideCoinsRaw);
      if (Number.isNaN(parsed) || !Number.isFinite(parsed) || parsed < 0) {
        return NextResponse.json({ error: "Invalid rewardCoins override" }, { status: 400 });
      }
      rewardCoins = Math.floor(parsed);
    }

    if (rewardCoins === 0) {
      return NextResponse.json(
        { error: "Invalid prize calculation. Check tournament mode and game type." },
        { status: 400 }
      );
    }

    const tid = tournamentId as string;

    // ✅ Transaction — record winner, update tournament, credit wallet, track wins, check bonuses, and notify
    await prisma.$transaction(async (tx) => {
      // Record winner
      await tx.winner.create({
        data: {
          tournamentId: tid,
          teamId,
          placement,
          rewardCoins,
        },
      });

      // Update tournament status if all 3 placements are filled
      const winnersCount = tournament.winners.length + 1;
      if (winnersCount >= 3) {
        await tx.tournament.update({
          where: { id: tid },
          data: { status: "ended", isOpen: false },
        });
      }

      // Credit wallet (only to captain as per plan)
      await tx.wallet.upsert({
        where: { userId: team.captainId },
        update: { balance: { increment: rewardCoins } },
        create: { userId: team.captainId, balance: rewardCoins },
      });

      // Track wins (only for Top 1 placement)
      if (placement === 1) {
        const captain = await tx.user.findUnique({
          where: { id: team.captainId },
        });

        if (captain) {
          const newWins = captain.wins + 1;
          
          // Update wins count
          await tx.user.update({
            where: { id: team.captainId },
            data: { wins: newWins },
          });

          // Check for bonus tasks
          // Bonus Task #1: 5 wins = +250 coins
          if (newWins === 5) {
            await tx.wallet.update({
              where: { userId: team.captainId },
              data: { balance: { increment: 250 } },
            });
            await tx.notification.create({
              data: {
                userId: team.captainId,
                type: "bonus",
                message: "🔥 You've won 5 tournaments! +250 bonus coins added.",
              },
            });
          }

          // Bonus Task #2: 15 wins = Star Friend V-Badge eligibility
          if (newWins === 15) {
            await tx.user.update({
              where: { id: team.captainId },
              data: { starEligible: true },
            });
                 await tx.notification.create({
                   data: {
                     userId: team.captainId,
                     type: "bonus",
                     message: "Congratulations! You've won 15 tournaments! You're now eligible for Star Friend V-Badge Prizepool!",
                   },
                 });
          }
        }
      }

      // Send prize notification
      const placementText = placement === 1 ? "1st" : placement === 2 ? "2nd" : "3rd";
      await tx.notification.create({
        data: {
          userId: team.captainId,
          type: "prize",
          message: `Congratulations! You placed ${placementText} and won ${rewardCoins} coins in "${tournament.title}"!`,
        },
      });
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("❌ Error in winner route:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
