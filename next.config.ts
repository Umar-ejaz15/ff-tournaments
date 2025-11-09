import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensure Prisma binaries are included in serverless functions
  outputFileTracingIncludes: {
    "/api/**": [
      "./node_modules/.prisma/client/libquery_engine-rhel-openssl-3.0.x.so.node",
      "./node_modules/.prisma/client/query-engine-rhel-openssl-3.0.x",
      "./node_modules/.prisma/client/**/*",
      "./node_modules/@prisma/client/**/*",
    ],
  },
};

export default nextConfig;
