// lib/prisma.ts
import { PrismaClient } from "@prisma/client";


// Use a global cached client in dev to prevent too many instances
const globalForPrisma = globalThis as unknown as {
  _prisma?: PrismaClient;
};

// Create a new client or reuse the cached one
const prisma = globalForPrisma._prisma ?? new PrismaClient({
  log: ["error", "warn"],
});

// Cache the client only in development
if (process.env.NODE_ENV !== "production") {
  globalForPrisma._prisma = prisma;
}

// ✅ Explicit static exports (required for Turbopack)
export default prisma;
export { prisma };
