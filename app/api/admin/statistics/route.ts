import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [
      totalUsers,
      totalTournaments,
      totalTransactions,
      activeTournaments,
      completedTournaments,
      pendingWithdrawals,
      wallets,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.tournament.count(),
      prisma.transaction.count(),
      prisma.tournament.count({ where: { status: "running" } }),
      prisma.tournament.count({ where: { status: "ended" } }),
      prisma.transaction.count({ where: { type: "withdraw", status: "pending" } }),
      prisma.wallet.findMany({ select: { balance: true } }),
    ]);

    // Calculate total revenue (from approved transactions)
    const approvedTransactions = await prisma.transaction.findMany({
      where: { status: "approved", type: { not: "withdraw" } },
      select: { amountPKR: true },
    });

    const totalRevenue = approvedTransactions.reduce((sum: number, tx: any) => sum + tx.amountPKR, 0);
    const totalCoinsInCirculation = wallets.reduce((sum: number, w: any) => sum + w.balance, 0);

    return NextResponse.json({
      totalUsers,
      totalTournaments,
      totalTransactions,
      totalRevenue,
      activeTournaments,
      completedTournaments,
      pendingWithdrawals,
      totalCoinsInCirculation,
      recentActivity: [], // Can be expanded later
    });
  } catch (error) {
    console.error("Error fetching statistics:", error);
    return NextResponse.json({ error: "Failed to fetch statistics" }, { status: 500 });
  }
}

