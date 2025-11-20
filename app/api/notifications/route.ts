import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const items = await prisma.notification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json(items.map((i: any) => ({
      ...i,
      createdAt: i.createdAt.toISOString()
    })));
  } catch (err) {
    console.error("Notifications GET error:", err);
    return NextResponse.json({ error: "Internal" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json();
    const { id } = body;
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    await prisma.notification.updateMany({ where: { id, userId: session.user.id }, data: { read: true } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Notifications PATCH error:", err);
    return NextResponse.json({ error: "Internal" }, { status: 500 });
  }
}
