// lib/prisma.ts
import { PrismaClient } from "@prisma/client";

// Use a global cached client to prevent too many instances in serverless environments
const globalForPrisma = globalThis as unknown as {
  _prisma?: PrismaClient;
};

// Build Prisma client options. For Prisma v7+, prefer passing an `adapter` with a direct DB URL
const prismaClientOptions: any = {
  log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
};

if (process.env.DATABASE_URL) {
  // Pass adapter when a direct DB URL is available.
  // Use `any` so this file remains compatible with multiple Prisma versions.
  prismaClientOptions.adapter = {
    provider: "postgres",
    url: process.env.DATABASE_URL,
  };
}

// Create a new client or reuse the cached one
const prisma = globalForPrisma._prisma ?? new (PrismaClient as any)(prismaClientOptions);

// Cache the client in both development and production (important for serverless)
if (!globalForPrisma._prisma) {
  globalForPrisma._prisma = prisma;
}

// Prisma middleware: after creating a Notification, attempt to send web-push
// Only register middleware when Prisma client supports `$use` (some runtimes or versions may not)
if (typeof (prisma as any).$use === "function") {
  (prisma as any).$use(async (params: any, next: any) => {
    // run the DB operation
    const result = await next(params);

    try {
      if (params.model === "Notification" && params.action === "create") {
        // dynamic import to avoid circular dependency with lib/push
        const pushLib = await import("./push");

        // the created notification record
        const notif: any = result;

        // load push subscriptions for the user
        const subs = await prisma.pushSubscription.findMany({ where: { userId: notif.userId } });
        if (subs && subs.length > 0) {
          const payload = {
            title: (notif.metadata && notif.metadata.title) || "Notification",
            body: notif.message || "You have a new notification",
            data: { notificationId: notif.id, ...((notif.metadata as any) || {}) },
          };

          for (const s of subs) {
            const subObj = { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } };
            try {
              await pushLib.sendWebPush(subObj, payload);
            } catch (e: any) {
              // sendWebPush already logs errors; swallow here to not affect DB flows
              console.warn("Error sending push for subscription", s.endpoint, e?.message || e);
            }
          }
        }
      }
    } catch (err) {
      // Don't let push sending break DB operations; just log
      console.warn("Prisma notification push middleware error:", err);
    }

    return result;
  });
} else {
  console.warn("Prisma client does not expose $use; notification -> push middleware not registered.");
}

// ✅ Explicit static exports (required for Turbopack)
export default prisma;
export { prisma };
