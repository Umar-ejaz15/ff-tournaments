import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { sendNotificationToUser } from "@/lib/push";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "admin") return unauthorized();

    const url = new URL(req.url);
    const status = url.searchParams.get("status") || "pending";

    const txs = await prisma.transaction.findMany({
      where: { type: "withdraw", status },
      include: { user: { select: { id: true, email: true, name: true } } },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    return NextResponse.json(txs, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("GET /api/admin/withdrawals error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "admin") return unauthorized();

    const { id, action } = await req.json();
    if (!id || !action) return NextResponse.json({ error: "Missing id or action" }, { status: 400 });

    const tx = await prisma.transaction.findUnique({ where: { id } });
    if (!tx) return NextResponse.json({ error: "Transaction not found" }, { status: 404 });

    if (action === "approve") {
      if (tx.status === "approved") return NextResponse.json({ error: "Already approved" }, { status: 400 });

      // Mark as approved/paid
      await prisma.transaction.update({ where: { id }, data: { status: "approved" } });

      // Persist notification and send web-push (do this explicitly instead of relying on Prisma middleware)
      await sendNotificationToUser(tx.userId, {
        title: "Withdrawal Approved",
        body: `Your withdrawal request of ${tx.amountCoins} coins has been approved.`,
        data: { transactionId: id, type: "withdrawal" },
      });

      return NextResponse.json({ success: true });
    }

    if (action === "reject") {
      if (tx.status === "rejected") return NextResponse.json({ error: "Already rejected" }, { status: 400 });

      // When rejecting a withdrawal, refund the user's wallet
      await prisma.$transaction([
        prisma.transaction.update({ where: { id }, data: { status: "rejected" } }),
        prisma.wallet.update({ where: { userId: tx.userId }, data: { balance: { increment: tx.amountCoins } } }),
      ]);

      // Notify user after DB transaction completes
      await sendNotificationToUser(tx.userId, {
        title: "Withdrawal Rejected",
        body: `Your withdrawal of ${tx.amountCoins} coins has been rejected and refunded.`,
        data: { transactionId: id, type: "withdrawal" },
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("POST /api/admin/withdrawals error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
