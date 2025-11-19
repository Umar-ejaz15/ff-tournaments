import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

const MAX_ENDPOINT_LENGTH = 3000;
const MAX_KEY_LENGTH = 2000;

function isValidString(v: any) {
  return typeof v === "string" && v.trim().length > 0;
}

// POST: Save or update a push subscription for the authenticated user
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const subscription = body.subscription ?? body;
    const endpoint = subscription?.endpoint?.trim();
    const p256dh = subscription?.keys?.p256dh?.trim();
    const auth = subscription?.keys?.auth?.trim();

    if (!isValidString(endpoint) || !isValidString(p256dh) || !isValidString(auth)) {
      return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
    }

    if (endpoint.length > MAX_ENDPOINT_LENGTH || p256dh.length > MAX_KEY_LENGTH || auth.length > MAX_KEY_LENGTH) {
      return NextResponse.json({ error: "Subscription fields too long" }, { status: 400 });
    }

    await prisma.pushSubscription.upsert({
      where: { endpoint },
      create: { endpoint, p256dh, auth, userId: session.user.id },
      update: { p256dh, auth, userId: session.user.id },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Subscribe error:", err);
    return NextResponse.json({ error: "Internal" }, { status: 500 });
  }
}

// DELETE: Remove a subscription by endpoint (if provided) or all subscriptions for the authenticated user
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const endpoint = body?.endpoint ?? body?.subscription?.endpoint;

    if (endpoint && typeof endpoint === "string") {
      // Delete only the matching subscription for this user
      await prisma.pushSubscription.deleteMany({ where: { endpoint, userId: session.user.id } });
      return NextResponse.json({ ok: true });
    }

    // No endpoint provided: delete all subscriptions for this user
    await prisma.pushSubscription.deleteMany({ where: { userId: session.user.id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Unsubscribe error:", err);
    return NextResponse.json({ error: "Internal" }, { status: 500 });
  }
}