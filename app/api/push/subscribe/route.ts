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

    console.log('Received subscription request:', {
      userId: session.user.id,
      hasSubscription: !!subscription,
      hasEndpoint: !!subscription?.endpoint,
      hasKeys: !!subscription?.keys,
    });

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json(
        { error: "Invalid subscription: missing endpoint", details: "Subscription object is missing required endpoint field" },
        { status: 400 }
      );
    }

    // Validate subscription keys
    if (!subscription.keys || !subscription.keys.p256dh || !subscription.keys.auth) {
      return NextResponse.json(
        { error: "Invalid subscription: missing keys", details: "Subscription object is missing required encryption keys" },
        { status: 400 }
      );
    }

    // Check for duplicate subscriptions and remove old ones first
    try {
      const existingSubscriptions = await prisma.notification.findMany({
        where: {
          userId: session.user.id,
          type: 'push-subscription',
        },
      });

      // Remove old subscriptions to avoid duplicates
      if (existingSubscriptions.length > 0) {
        await prisma.notification.deleteMany({
          where: {
            userId: session.user.id,
            type: 'push-subscription',
          },
        });
        console.log(`Removed ${existingSubscriptions.length} old subscription(s) for user ${session.user.id}`);
      }
    } catch (cleanupError) {
      console.warn('Failed to cleanup old subscriptions:', cleanupError);
      // Continue anyway
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
      console.log(`Successfully saved subscription for user ${session.user.id}`);
    } catch (dbError: any) {
      console.error('Failed to save subscription metadata to DB:', dbError);
      return NextResponse.json({ 
        error: 'Failed to save subscription',
        details: dbError.message || 'Database error',
      }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Push subscription error:", error);
    return NextResponse.json(
      { 
        error: "Failed to subscribe",
        details: error.message || 'Unknown error',
      },
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

