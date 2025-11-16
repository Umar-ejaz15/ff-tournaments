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
  // Comprehensive caching for Vercel Hobby plan
  async headers() {
    return [
      // Next.js static assets - Cache for 1 year (immutable)
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
        ],
      },
      {
        source: "/_next/static/chunks/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      // Public assets - Cache for 1 year
      {
        source: "/(.*\\.(jpg|jpeg|png|gif|webp|svg|ico|woff|woff2|ttf|eot))",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      // Manifest and service worker - Cache for 1 hour
      {
        source: "/(manifest\\.json|sw\\.js)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=3600, must-revalidate",
          },
        ],
      },
      // API routes - Short cache for dynamic data (Hobby plan compatible)
      {
        source: "/api/tournaments",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=10, stale-while-revalidate=60",
          },
        ],
      },
    ];
  },
  // Experimental features for better performance
  experimental: {
    optimizePackageImports: ["lucide-react", "@radix-ui/react-dialog"],
  },
};

export default nextConfig;
