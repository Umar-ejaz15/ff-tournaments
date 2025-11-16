import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { userIds, message, type, metadata } = await req.json();
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) return NextResponse.json({ error: "No recipients" }, { status: 400 });

    const creations = userIds.map((userId: string) =>
      prisma.notification.create({ data: { userId, message, type: type || "admin", metadata: metadata || {} } })
    );

    await prisma.$transaction(creations);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/admin/notifications/send error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
