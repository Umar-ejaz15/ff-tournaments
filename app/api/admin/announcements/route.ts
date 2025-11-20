import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { broadcastNotificationToUsers } from "@/lib/push";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // For now, return empty array. Can be expanded to store announcements in database
    return NextResponse.json([]);
  } catch (error) {
    console.error("Error fetching announcements:", error);
    return NextResponse.json({ error: "Failed to fetch announcements" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, message, type, targetAudience } = body;

    if (!title || !message) {
      return NextResponse.json({ error: "Title and message are required" }, { status: 400 });
    }

    // Get target users based on audience
    let targetUsers: string[] = [];
    if (targetAudience === "all") {
      const allUsers = await prisma.user.findMany({ select: { id: true } });
      targetUsers = allUsers.map((u: any) => u.id);
    } else if (targetAudience === "players") {
      const players = await prisma.user.findMany({
        where: { role: "user" },
        select: { id: true },
      });
      targetUsers = players.map((u: any) => u.id);
    } else if (targetAudience === "admins") {
      const admins = await prisma.user.findMany({
        where: { role: "admin" },
        select: { id: true },
      });
      targetUsers = admins.map((u: any) => u.id);
    }

    // Create notifications and send pushes to all target users via helper
    await broadcastNotificationToUsers(targetUsers, {
      title: title,
      body: message,
      data: { announcement: true, type, targetAudience },
    });

    return NextResponse.json({ success: true, notified: targetUsers.length });
  } catch (error) {
    console.error("Error creating announcement:", error);
    return NextResponse.json({ error: "Failed to create announcement" }, { status: 500 });
  }
}

