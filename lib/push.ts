import webpush from "web-push";
import prisma from "@/lib/prisma";

const VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY || process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY || "";
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:support@yourdomain.com";

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);
}

export async function sendWebPush(subscription: any, payload: any) {
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
  } catch (err: any) {
    console.error("web-push error:", err);
    // remove expired subscription
    if (err?.statusCode === 410 || err?.statusCode === 404) {
      try {
        await prisma.pushSubscription.deleteMany({ where: { endpoint: subscription.endpoint } });
      } catch (e) {
        console.warn("Failed to delete expired subscription", e);
      }
    }
  }
}

export async function sendNotificationToUser(userId: string, payload: { title: string; body: string; data?: any }) {
  // persist notification
  // Ensure payload.data has a useful url for service worker clicks
  const dataWithUrl = { ...(payload.data || {}) };
  if (!dataWithUrl.url) {
    const t = dataWithUrl.type || payload.data?.type || "general";
    switch (t) {
      case "tournament_new":
      case "start":
      case "reminder":
        if (dataWithUrl.tournamentId) dataWithUrl.url = `/user/tournaments/${dataWithUrl.tournamentId}`;
        break;
      case "registration":
        if (dataWithUrl.tournamentId) dataWithUrl.url = `/user/tournaments/${dataWithUrl.tournamentId}`;
        break;
      case "prize":
        if (dataWithUrl.tournamentId) dataWithUrl.url = `/user/tournaments/${dataWithUrl.tournamentId}`;
        else dataWithUrl.url = "/user/transactions";
        break;
      case "withdrawal":
      case "deposit":
        dataWithUrl.url = "/user/transactions";
        break;
      case "admin":
      case "announcement":
        dataWithUrl.url = "/user/notifications";
        break;
      default:
        dataWithUrl.url = "/user/notifications";
    }
  }

  await prisma.notification.create({
    data: {
      userId,
      type: dataWithUrl.type || payload.data?.type || "general",
      message: payload.body,
      metadata: dataWithUrl ?? null,
    },
  });

  const subs = await prisma.pushSubscription.findMany({ where: { userId } });
  for (const s of subs) {
    const sub = { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } };
    try {
      await sendWebPush(sub, { title: payload.title, body: payload.body, data: dataWithUrl });
    } catch (e) {
      // sendWebPush already logs; continue
    }
  }
}

export async function broadcastNotificationToUsers(userIds: string[], payload: { title: string; body: string; data?: any }) {
  for (const uid of userIds) {
    await sendNotificationToUser(uid, payload);
  }
}

export default { sendWebPush, sendNotificationToUser, broadcastNotificationToUsers };
