import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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

    return NextResponse.json(tournamentsWithParticipants, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Tournaments fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

