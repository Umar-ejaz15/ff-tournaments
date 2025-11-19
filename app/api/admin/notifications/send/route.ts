import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { broadcastNotificationToUsers } from "@/lib/push";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { userIds, message, type, metadata } = await req.json();
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) return NextResponse.json({ error: "No recipients" }, { status: 400 });

    // Use the push helper which persists the notification and sends web-push.
    // This ensures notifications are delivered even if Prisma `$use` middleware
    // was not registered in the current runtime.
    await broadcastNotificationToUsers(userIds, {
      title: (metadata && metadata.title) || "Admin Notification",
      body: message,
      data: { ...(metadata || {}), type: type || "admin" },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/admin/notifications/send error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
