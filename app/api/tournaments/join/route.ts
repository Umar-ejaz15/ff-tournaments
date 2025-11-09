import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { tournamentId, teamName, teamMembers, captain } = await req.json();

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { wallet: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: { teams: true, _count: { select: { teams: true } } },
    });

    if (!tournament) {
      return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
    }

    if (tournament.status !== "upcoming" || !tournament.isOpen) {
      return NextResponse.json({ error: "Tournament is not open for registration" }, { status: 400 });
    }

    if (
      tournament.maxParticipants &&
      tournament._count &&
      (tournament._count as any).teams >= tournament.maxParticipants
    ) {
      return NextResponse.json({ error: "Tournament is full" }, { status: 400 });
    }

    // Determine team size based on mode
    const teamSize = tournament.mode === "Solo" ? 1 : tournament.mode === "Duo" ? 2 : 4;

    // Validate captain data and team member counts
    if (!captain || !captain.playerName || !captain.phone || !captain.gameId) {
      return NextResponse.json(
        { error: "Captain details required: playerName, phone, gameId" },
        { status: 400 }
      );
    }
    const requiredMembers = teamSize - 1; // excluding captain
    const providedMembers = Array.isArray(teamMembers) ? teamMembers.length : 0;
    if (providedMembers !== requiredMembers) {
      return NextResponse.json(
        { error: `Invalid team members. Expected ${requiredMembers} members.` },
        { status: 400 }
      );
    }

    const totalEntry = tournament.entryFee * teamSize;
    const walletBalance = user.wallet?.balance ?? 0;
    if (walletBalance < totalEntry) {
      return NextResponse.json(
        { error: `Insufficient coins. Need ${totalEntry} coins for ${tournament.mode}.` },
        { status: 400 }
      );
    }

    // Check if user already joined this tournament
    const existingTeam = await prisma.team.findFirst({
      where: {
        tournamentId: tournament.id,
        captainId: user.id,
      },
    });

    if (existingTeam) {
      return NextResponse.json({ error: "You have already joined this tournament" }, { status: 400 });
    }

    // Create team and deduct coins
    await prisma.$transaction(async (tx) => {
      // Create team
      const team = await tx.team.create({
        data: {
          name: tournament.mode === "Solo" ? `${user.name}'s Team` : teamName,
          captainId: user.id,
          tournamentId: tournament.id,
          members: {
            create: [
              // Add captain
              {
                userId: user.id,
                role: "captain",
                playerName: captain.playerName,
                phone: captain.phone,
                gameId: captain.gameId,
                email: captain.email,
              },
              // Add team members (for Duo/Squad)
              ...(teamMembers || []).map((member: any) => ({
                playerName: member.playerName,
                phone: member.phone,
                gameId: member.gameId,
                email: member.email,
                role: "member",
              })),
            ],
          },
        },
      });

      // Deduct entry fee from wallet
      await tx.wallet.update({
        where: { userId: user.id },
        data: { balance: { decrement: totalEntry } },
      });

      // Create transaction record
      await tx.transaction.create({
        data: {
          userId: user.id,
          amountCoins: totalEntry,
          amountPKR: totalEntry * 4, // 1 coin = Rs. 4
          method: "SYSTEM",
          type: "entry",
          status: "approved",
        },
      });

      // Notification: Registration Success
      await tx.notification.create({
        data: {
          userId: user.id,
          type: "registration",
          message: `You have joined "${tournament.title}" successfully!`,
          metadata: { tournamentId: tournament.id, teamId: team.id },
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: "Successfully joined tournament!",
    });
  } catch (error: any) {
    console.error("Tournament join error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

