import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    // ✅ Step 1: Get logged-in user
    const session = await getServerSession(authOptions);
    if (!session?.user?.email)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { amountPKR, method } = await req.json();
    if (!amountPKR || amountPKR < 100)
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });

    // ✅ Step 2: Convert PKR → Coins (50 coins = 200 PKR)
    const amountCoins = Math.floor((amountPKR / 200) * 50);

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    if (!user)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    // ✅ Step 3: Create transaction record
    const transaction = await prisma.transaction.create({
      data: {
        userId: user.id,
        amountPKR,
        amountCoins,
        method,
        type: "deposit",
        status: "pending",
      },
    });

    // ✅ Step 4: Prepare JazzCash payment
    if (method === "JazzCash") {
      const {
        JAZZCASH_MERCHANT_ID,
        JAZZCASH_PASSWORD,
        JAZZCASH_INTEGRITY_SALT,
        JAZZCASH_RETURN_URL,
        JAZZCASH_BASE_URL,
      } = process.env;

      const pp_TxnDateTime = new Date()
        .toISOString()
        .replace(/[-:.TZ]/g, "")
        .slice(0, 14);
      const pp_TxnRefNo = `T${transaction.id}`;
      const pp_Amount = (amountPKR * 100).toString(); // JazzCash expects paisa (PKR * 100)

      const params: Record<string, string> = {
        pp_Version: "1.1",
        pp_TxnType: "MWALLET",
        pp_Language: "EN",
        pp_MerchantID: JAZZCASH_MERCHANT_ID!,
        pp_Password: JAZZCASH_PASSWORD!,
        pp_TxnRefNo,
        pp_Amount,
        pp_TxnCurrency: "PKR",
        pp_TxnDateTime,
        pp_BillReference: "COIN_PURCHASE",
        pp_Description: `Buy ${amountCoins} coins`,
        pp_ReturnURL: JAZZCASH_RETURN_URL!,
        pp_SecureHash: "",
      };

      // ✅ Step 5: Generate Secure Hash
      const sorted = Object.entries(params)
        .filter(([_, v]) => v !== "")
        .map(([k, v]) => `${k}=${v}`)
        .join("&");

      const hashString = `${JAZZCASH_INTEGRITY_SALT}&${sorted}`;
      const secureHash = crypto
        .createHash("sha256")
        .update(hashString)
        .digest("hex")
        .toUpperCase();

      params.pp_SecureHash = secureHash;

      const formUrl = `${JAZZCASH_BASE_URL}?${new URLSearchParams(params).toString()}`;
      return NextResponse.json({ redirectUrl: formUrl });
    }

    return NextResponse.json({ message: "Payment method not supported yet" });
  } catch (error) {
    console.error("Payment Init Error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
