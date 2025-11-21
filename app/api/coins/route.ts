// app/api/coins/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { amountPKR, amountCoins, method, proofUrl } = body as {
      amountPKR: number;
      amountCoins: number;
      method: string;
      proofUrl?: string;
    };

    if (!amountPKR || !amountCoins || amountCoins <= 0) {
      return NextResponse.json({ message: "Invalid amounts" }, { status: 400 });
    }

    // Require payment proof for deposits
    if (!proofUrl) {
      return NextResponse.json({ message: "Payment proof (proofUrl) is required" }, { status: 400 });
    }

    // create pending transaction
    const user = await prisma.user.findUnique({ where: { email: session.user.email }});
    if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 });

    const tx = await prisma.transaction.create({
      data: {
        userId: user.id,
        amountCoins,
        amountPKR,
        method,
        type: "deposit",
        status: "pending",
        proofUrl: proofUrl ?? null,
      },
    });

    return NextResponse.json({ ok: true, transaction: tx });
  } catch (err) {
    console.error("create-transaction error:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
