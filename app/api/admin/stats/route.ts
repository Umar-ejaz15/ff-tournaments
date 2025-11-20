import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const [usersCount, tournamentsCount, pendingDeposits, pendingWithdrawals, totalBalance] = await Promise.all([
      prisma.user.count(),
      prisma.tournament.count(),
      prisma.transaction.count({ where: { type: "deposit", status: "pending" } }),
      prisma.transaction.count({ where: { type: "withdraw", status: "pending" } }),
      prisma.wallet.aggregate({ _sum: { balance: true } }).then((r: any) => r._sum.balance ?? 0),
    ]);

    return NextResponse.json({ usersCount, tournamentsCount, pendingDeposits, pendingWithdrawals, totalBalance });
  } catch (error) {
    console.error("GET /api/admin/stats error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
