import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "admin") return unauthorized();

    const url = new URL(req.url);
    const status = url.searchParams.get("status");

    const where: any = { type: "deposit" };
    if (status) where.status = status;

    const transactions = await prisma.transaction.findMany({
      where,
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    return NextResponse.json(transactions, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("GET /api/admin/transactions error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "admin") return unauthorized();

    const body = await req.json();
    const { id, action } = body as { id?: string; action?: string };
    if (!id || !action) return NextResponse.json({ error: "Missing id or action" }, { status: 400 });

    const tx = await prisma.transaction.findUnique({ where: { id } });
    if (!tx) return NextResponse.json({ error: "Transaction not found" }, { status: 404 });

    if (action === "approve") {
      if (tx.status === "approved") return NextResponse.json({ error: "Already approved" }, { status: 400 });

      await prisma.$transaction(async (txdb) => {
        // mark transaction approved
        await txdb.transaction.update({ where: { id }, data: { status: "approved" } });

        // credit user's wallet
        await txdb.wallet.update({ where: { userId: tx.userId }, data: { balance: { increment: tx.amountCoins } } });

        // create notification
        await txdb.notification.create({
          data: {
            userId: tx.userId,
            type: "deposit",
            message: `Your deposit of ${tx.amountCoins} coins has been approved.`,
            metadata: { transactionId: id },
          },
        });
      });

      return NextResponse.json({ success: true });
    }

    if (action === "reject") {
      if (tx.status === "rejected") return NextResponse.json({ error: "Already rejected" }, { status: 400 });

      await prisma.transaction.update({ where: { id }, data: { status: "rejected" } });
      await prisma.notification.create({
        data: {
          userId: tx.userId,
          type: "deposit",
          message: `Your deposit of ${tx.amountCoins} coins has been rejected. Please contact support.`,
          metadata: { transactionId: id },
        },
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("POST /api/admin/transactions error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "admin") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "pending";
    const type = searchParams.get("type") || undefined;

    const where: any = { status };
    if (type) where.type = type;

    const results = await prisma.transaction.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            wallet: {
              select: {
                balance: true,
              },
            },
          },
        },
      },
      take: 200,
    });

    // ✅ Always return an array (even if empty)
    return NextResponse.json(results ?? [], {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Admin transactions API error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
