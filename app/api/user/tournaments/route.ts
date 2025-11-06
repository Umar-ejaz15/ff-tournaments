
// app/api/user/tournaments/route.ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";


// GET - Fetch all available tournaments for users
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tournaments = await prisma.tournament.findMany({
      where: {
        status: {
          in: ["upcoming", "running"],
        },
      },
      include: {
        _count: {
          select: {
            teams: true,
          },
        },
      },
      orderBy: {
        startTime: "asc",
      },
    });

    return NextResponse.json(tournaments);
  } catch (error) {
    console.error("Error fetching tournaments:", error);
    return NextResponse.json({ error: "Failed to fetch tournaments" }, { status: 500 });
  }
}

// app/api/user/tournaments/register/route.ts
// POST - Register team for tournament
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { tournamentId, teamName, members } = body;

    // Validation
    if (!tournamentId || !teamName || !members || !Array.isArray(members)) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Get tournament details
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        _count: {
          select: { teams: true },
        },
      },
    });

    if (!tournament) {
      return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
    }

    if (tournament.status !== "upcoming") {
      return NextResponse.json({ error: "Tournament is not open for registration" }, { status: 400 });
    }

    // Check max participants
    if (tournament.maxParticipants && tournament._count.teams >= tournament.maxParticipants) {
      return NextResponse.json({ error: "Tournament is full" }, { status: 400 });
    }

    // Validate team size based on mode
    const requiredSize = {
      Solo: 1,
      Duo: 2,
      Squad: 4,
    }[tournament.mode];

    if (members.length !== requiredSize) {
      return NextResponse.json({ 
        error: `${tournament.mode} requires exactly ${requiredSize} member(s)` 
      }, { status: 400 });
    }

    // Check user wallet balance
    const wallet = await prisma.wallet.findUnique({
      where: { userId: session.user.id },
    });

    if (!wallet || wallet.balance < tournament.entryFee) {
      return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
    }

    // Check if user already registered
    const existingTeam = await prisma.team.findFirst({
      where: {
        tournamentId,
        captainId: session.user.id,
      },
    });

    if (existingTeam) {
      return NextResponse.json({ error: "You have already registered for this tournament" }, { status: 400 });
    }

    // Create team and register for tournament in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Deduct entry fee
      await tx.wallet.update({
        where: { userId: session.user.id },
        data: {
          balance: {
            decrement: tournament.entryFee,
          },
        },
      });

      // Create transaction record
      await tx.transaction.create({
        data: {
          userId: session.user.id,
          amountCoins: tournament.entryFee,
          amountPKR: 0,
          method: "wallet",
          type: "entry",
          status: "approved",
        },
      });

      // Create team
      const team = await tx.team.create({
        data: {
          name: teamName,
          captainId: session.user.id,
          tournamentId,
          members: {
            create: members.map((member: any, index: number) => ({
              userId: member.isRegistered ? member.userId : null,
              role: index === 0 ? "captain" : "member",
              playerName: member.playerName,
              phone: member.phone,
              gameId: member.gameId,
              email: member.email,
            })),
          },
        },
        include: {
          members: true,
        },
      });

      return team;
    });

    return NextResponse.json({ 
      message: "Successfully registered for tournament",
      team: result 
    });
  } catch (error) {
    console.error("Error registering for tournament:", error);
    return NextResponse.json({ error: "Failed to register for tournament" }, { status: 500 });
  }
}