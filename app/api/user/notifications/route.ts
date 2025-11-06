import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const notes = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json(notes);
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { ids, read } = await req.json();
  if (!Array.isArray(ids) || typeof read !== "boolean") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  await prisma.notification.updateMany({ where: { id: { in: ids }, userId: session.user.id }, data: { read } });
  return NextResponse.json({ success: true });
}


