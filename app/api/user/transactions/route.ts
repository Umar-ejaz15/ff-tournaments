import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { getAllPaymentMethods } from "@/lib/payment-config";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { amountCoins, method, account } = await req.json();
    if (!amountCoins || amountCoins <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }
    if (amountCoins < 1200) {
      return NextResponse.json({ error: "Minimum withdrawal amount is 1200 coins" }, { status: 400 });
    }
    const allowed = getAllPaymentMethods().map((m) => m.method);
    if (!method || !allowed.includes(method)) {
      return NextResponse.json({ error: "Invalid method" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email }, include: { wallet: true } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const balance = user.wallet?.balance ?? 0;
    if (balance < amountCoins) {
      return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      // Deduct immediately to prevent double spending
      await tx.wallet.update({ where: { userId: user.id }, data: { balance: { decrement: amountCoins } } });

      await tx.transaction.create({
        data: {
          userId: user.id,
          amountCoins,
          amountPKR: amountCoins * 4,
          method,
          type: "withdraw",
          status: "pending",
          proofUrl: account ?? undefined,
        },
      });
    });

    // Persisted notification + web-push for the user (outside transaction)
    try {
      const { sendNotificationToUser } = await import("@/lib/push");
      await sendNotificationToUser(user.id, {
        title: "Withdrawal Request Submitted",
        body: `Withdrawal request submitted: Rs. ${amountCoins * 4} via ${method}`,
        data: { amountCoins, method, type: "withdrawal" },
      });
    } catch (err) {
      console.warn("Failed to send withdrawal notification:", err);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Withdrawal request error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "withdraw";
    const status = searchParams.get("status"); // optional

    const transactions = await prisma.transaction.findMany({
      where: {
        userId: user.id,
        type,
        ...(status ? { status } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json(transactions, { headers: { "Cache-Control": "no-store" } });
  } catch (error: any) {
    console.error("User transactions fetch error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}


