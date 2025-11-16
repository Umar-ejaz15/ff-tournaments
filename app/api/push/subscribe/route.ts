import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import webpush from "web-push";

// Configure web-push with VAPID keys
// These should be set in your environment variables
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || "";
const vapidEmail = process.env.VAPID_EMAIL || "mailto:admin@ff-tournaments.com";

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey);
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { subscription } = body;

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json(
        { error: "Invalid subscription" },
        { status: 400 }
      );
    }

    // Persist subscription as a Notification record (metadata) to avoid schema changes
    try {
      await prisma.notification.create({
        data: {
          userId: session.user.id,
          type: 'push-subscription',
          message: 'Push subscription registered',
          metadata: subscription,
        },
      });
    } catch (dbError) {
      console.error('Failed to save subscription metadata to DB:', dbError);
      return NextResponse.json({ error: 'Failed to save subscription' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Push subscription error:", error);
    return NextResponse.json(
      { error: "Failed to subscribe" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Remove stored push-subscription metadata for this user
    try {
      await prisma.notification.deleteMany({ where: { userId: session.user.id, type: 'push-subscription' } });
      return NextResponse.json({ success: true });
    } catch (dbError) {
      console.error('Failed to delete subscription metadata:', dbError);
      return NextResponse.json({ error: 'Failed to unsubscribe' }, { status: 500 });
    }
  } catch (error) {
    console.error("Push unsubscribe error:", error);
    return NextResponse.json(
      { error: "Failed to unsubscribe" },
      { status: 500 }
    );
  }
}

