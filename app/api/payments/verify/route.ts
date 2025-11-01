import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  const formData = await req.formData();
  const responseCode = formData.get("pp_ResponseCode");
  const txnRefNo = formData.get("pp_TxnRefNo")?.toString();

  const txnId = txnRefNo?.replace("T", "");
  if (!txnId) return NextResponse.json({ error: "Invalid Txn Ref" }, { status: 400 });

  const transaction = await prisma.transaction.findUnique({
    where: { id: txnId },
  });
  if (!transaction)
    return NextResponse.json({ error: "Transaction not found" }, { status: 404 });

  // ✅ If success, add coins to the same user
  if (responseCode === "000") {
    await prisma.$transaction([
      prisma.wallet.upsert({
        where: { userId: transaction.userId },
        update: { balance: { increment: transaction.amountCoins } },
        create: {
          userId: transaction.userId,
          balance: transaction.amountCoins,
        },
      }),
      prisma.transaction.update({
        where: { id: txnId },
        data: { status: "approved" },
      }),
    ]);

    return NextResponse.redirect("https://your-domain.com/user?success=coins_added");
  }

  // ❌ Failed payment
  await prisma.transaction.update({
    where: { id: txnId },
    data: { status: "rejected" },
  });

  return NextResponse.redirect("https://your-domain.com/user?error=payment_failed");
}
