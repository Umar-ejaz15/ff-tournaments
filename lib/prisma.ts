// lib/prisma.ts
import { PrismaClient } from "@prisma/client";

// Use a global cached client to prevent too many instances in serverless environments
const globalForPrisma = globalThis as unknown as {
  _prisma?: PrismaClient;
};

// Build PrismaClient options safely. Newer Prisma builds with engine type
// "client" may require either an `adapter` or `accelerateUrl` to be
// provided. Prefer `accelerateUrl` when present; otherwise provide an
// `adapter` object only when `DATABASE_URL` is available.
const prismaClientOptions: any = {
  log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
};

// If an accelerate URL is provided (Prisma Accelerate), use it.
if (process.env.PRISMA_ACCELERATE_URL) {
  prismaClientOptions.accelerateUrl = process.env.PRISMA_ACCELERATE_URL;
}

// Only provide an `adapter` option for Prisma Client v7+ or when explicitly
// requested. Older Prisma Client versions (v6.x) do not expect an adapter
// shape like `{ provider, url }` and may attempt to call adapter.connect,
// which will fail if the adapter is a plain object. We try to read the
// installed `@prisma/client` version at runtime and only attach the adapter
// when the major version is 7 or higher.
if (!prismaClientOptions.accelerateUrl && process.env.DATABASE_URL) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-unsafe-assignment
    const clientPkg = require("@prisma/client/package.json");
    const clientVersion: string | undefined = clientPkg?.version;
    const major = clientVersion ? parseInt(clientVersion.split(".")[0], 10) : NaN;
    if (!Number.isNaN(major) && major >= 7) {
      prismaClientOptions.adapter = {
        provider: "postgresql",
        url: process.env.DATABASE_URL,
      };
    }
  } catch (err) {
    // If we couldn't read the installed client version, err on the side of
    // not providing the adapter to avoid accidental runtime errors.
    // eslint-disable-next-line no-console
    console.warn("Could not determine @prisma/client version; skipping adapter option.", err);
  }
}

// Create a new client or reuse the cached one
let prisma: PrismaClient;
try {
  prisma = globalForPrisma._prisma ?? new PrismaClient(prismaClientOptions);
} catch (e) {
  // Provide a clear, actionable log for the developer
  // Do not crash here silently; rethrow after logging to make the error visible
  // in the dev console.
  // eslint-disable-next-line no-console
  console.error("PrismaClient construction failed. Options:", prismaClientOptions, "Error:", e);
  throw e;
}

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
