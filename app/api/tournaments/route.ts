import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Cache tournaments for 10 seconds, allow stale for 60 seconds
export const dynamic = "force-dynamic";
export const revalidate = 10;

export async function GET(req: Request) {
  try {
    const tournaments = await prisma.tournament.findMany({
      where: { status: "upcoming" },
      include: {
        _count: {
          select: { teams: true },
        },
        teams: {
          include: {
            members: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Calculate total participants for each tournament
    const tournamentsWithParticipants = tournaments.map((tournament) => {
      const totalParticipants = tournament.teams.reduce((sum, team) => {
        return sum + (team.members?.length || 0);
      }, 0);
      
      return {
        ...tournament,
        totalParticipants,
        teams: undefined, // Remove teams array from response to keep it clean
      };
    });

    // Cache for 10 seconds on edge, allow stale for 60 seconds
    return NextResponse.json(tournamentsWithParticipants, { 
      headers: { 
        "Cache-Control": "public, s-maxage=10, stale-while-revalidate=60",
        "CDN-Cache-Control": "public, s-maxage=10",
        "Vercel-CDN-Cache-Control": "public, s-maxage=10"
      } 
    });
  } catch (error) {
    console.error("Tournaments fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

