import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const prisma = new PrismaClient();

// This route now creates a pending transaction that requires manual proof upload
// Admin will approve it manually after verifying the payment proof
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { amountPKR, method, proofUrl } = await req.json();
    if (!amountPKR || amountPKR < 100)
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });

    if (!proofUrl)
      return NextResponse.json({ error: "Payment proof is required" }, { status: 400 });

    // Convert PKR → Coins (50 coins = 200 PKR, so 1 coin = 4 PKR)
    const amountCoins = Math.floor((amountPKR / 200) * 50);

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    if (!user)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Create pending transaction with proof
    const transaction = await prisma.transaction.create({
      data: {
        userId: user.id,
        amountPKR,
        amountCoins,
        method,
        type: "deposit",
        status: "pending",
        proofUrl,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Transaction submitted. Admin will verify and approve it.",
      transaction: {
        id: transaction.id,
        amountCoins,
        amountPKR,
        status: transaction.status,
      },
    });
  } catch (error) {
    console.error("Payment Init Error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
