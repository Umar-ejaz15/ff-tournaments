import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { transactionId, action } = await req.json(); // action: "approve" | "reject"

    if (!transactionId || !action || !["approve", "reject"].includes(action)) { 
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { user: true },
    });

    if (!transaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    if (transaction.status !== "pending") {
      return NextResponse.json(
        { error: "Transaction is not pending" },
        { status: 400 }
      );
    }

    if (action === "approve") {
      if (transaction.type === "deposit") {
        // Approve deposit and add coins
        await prisma.$transaction([
          prisma.transaction.update({ where: { id: transactionId }, data: { status: "approved" } }),
          prisma.wallet.upsert({
            where: { userId: transaction.userId },
            update: { balance: { increment: transaction.amountCoins } },
            create: { userId: transaction.userId, balance: transaction.amountCoins },
          }),
          prisma.notification.create({
            data: {
              userId: transaction.userId,
              type: "deposit",
              message: `Deposit approved: ${transaction.amountCoins} coins added`,
            },
          }),
        ]);
        return NextResponse.json({ success: true, message: "Deposit approved and coins added" });
      }

      if (transaction.type === "withdraw") {
        // Approve withdrawal (coins already deducted on request)
        await prisma.$transaction([
          prisma.transaction.update({ where: { id: transactionId }, data: { status: "approved" } }),
          prisma.notification.create({
            data: {
              userId: transaction.userId,
              type: "withdrawal",
              message: `Your withdrawal of Rs. ${transaction.amountPKR} has been sent.`,
            },
          }),
        ]);
        return NextResponse.json({ success: true, message: "Withdrawal marked as paid" });
      }

      // Fallback
      await prisma.transaction.update({ where: { id: transactionId }, data: { status: "approved" } });
      return NextResponse.json({ success: true, message: "Transaction approved" });
    } else {
      if (transaction.type === "withdraw") {
        // Refund wallet on withdrawal rejection
        await prisma.$transaction([
          prisma.transaction.update({ where: { id: transactionId }, data: { status: "rejected" } }),
          prisma.wallet.upsert({
            where: { userId: transaction.userId },
            update: { balance: { increment: transaction.amountCoins } },
            create: { userId: transaction.userId, balance: transaction.amountCoins },
          }),
          prisma.notification.create({
            data: {
              userId: transaction.userId,
              type: "withdrawal",
              message: `❌ Withdrawal rejected. ${transaction.amountCoins} coins refunded to wallet.`,
            },
          }),
        ]);
        return NextResponse.json({ success: true, message: "Withdrawal rejected and refunded" });
      }

      // Reject other transactions
      await prisma.transaction.update({ where: { id: transactionId }, data: { status: "rejected" } });
      return NextResponse.json({ success: true, message: "Transaction rejected" });
    }
  } catch (error) {
    console.error("Transaction approval error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

