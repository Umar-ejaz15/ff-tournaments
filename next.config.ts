import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Optimize for serverless environments
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client"],
  },
};

export default nextConfig;
