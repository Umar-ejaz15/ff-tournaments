import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensure Prisma binaries are included in ALL serverless functions (API routes AND server components)
  // This tells Next.js to include these files in the serverless bundle
  outputFileTracingIncludes: {
    "/api/**": [
      "./node_modules/.prisma/client/**/*",
      "./node_modules/@prisma/client/**/*",
    ],
    "/user/**": [
      "./node_modules/.prisma/client/**/*",
      "./node_modules/@prisma/client/**/*",
    ],
    "/admin/**": [
      "./node_modules/.prisma/client/**/*",
      "./node_modules/@prisma/client/**/*",
    ],
  },
};

export default nextConfig;
