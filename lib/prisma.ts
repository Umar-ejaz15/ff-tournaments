// lib/prisma.ts
import { PrismaClient } from "@prisma/client";

// Use a global cached client to prevent too many instances in serverless environments
const globalForPrisma = globalThis as unknown as {
  _prisma?: PrismaClient;
};

// Create a new client or reuse the cached one
const prisma = globalForPrisma._prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
});

// Cache the client in both development and production (important for serverless)
if (!globalForPrisma._prisma) {
  globalForPrisma._prisma = prisma;
}

// ✅ Explicit static exports (required for Turbopack)
export default prisma;
export { prisma };
