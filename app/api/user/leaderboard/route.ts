import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

// Cache leaderboard for 30 seconds, allow stale for 2 minutes
export const revalidate = 30;

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all users with their win counts and related data
    const users = await prisma.user.findMany({
      where: {
        wins: { gt: 0 }, // Only users with at least 1 win
      },
      include: {
        wallet: true,
        teams: {
          include: {
            team: {
              include: {
                tournament: true,
              },
            },
          },
        },
      },
      orderBy: {
        wins: "desc",
      },
      take: 100, // Top 100
    });

    // Calculate additional stats
    const leaderboard = users.map((user) => {
      // Count unique tournaments the user has participated in
      const uniqueTournaments = new Set(
        user.teams
          .map((teamMember) => teamMember.team?.tournament?.id)
          .filter((id): id is string => !!id)
      );
      const tournamentsPlayed = uniqueTournaments.size;
      const totalCoins = user.wallet?.balance || 0;
      
      return {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          wins: user.wins,
          starEligible: user.starEligible,
        },
        totalWins: user.wins,
        totalCoins,
        tournamentsPlayed,
      };
    });

    // Cache for 30 seconds (Hobby plan compatible)
    return NextResponse.json(leaderboard, {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120"
      }
    });
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 });
  }
}

