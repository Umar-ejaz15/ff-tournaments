import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { JWT } from "next-auth/jwt";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token as JWT & { role?: string } | null;
    const pathname = req.nextUrl.pathname;
    
    // Extract role safely
    const userRole = token?.role?.toLowerCase() || "user";
    const isAdmin = userRole === "admin";
    const isAdminRoute = pathname.startsWith("/admin");
    const isUserRoute = pathname.startsWith("/user");

    // ✅ Enforce admin-only routes
    if (isAdminRoute && !isAdmin) {
      return NextResponse.redirect(new URL("/user/player/dashboard", req.url));
    }

    // ✅ Redirect admins trying to access regular user routes (except /user/admin/dashboard which redirects)
    if (isUserRoute && isAdmin) {
      // Allow /user/admin/dashboard to redirect internally, but block other /user/* routes
      if (pathname !== "/user/admin/dashboard") {
        return NextResponse.redirect(new URL("/admin", req.url));
      }
    }
    
    // ✅ Redirect regular users from /user to /user/player/dashboard
    if (pathname === "/user" && userRole === "user") {
      return NextResponse.redirect(new URL("/user/player/dashboard", req.url));
    }

    // ✅ Allow the request
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Public routes that don't require authentication
        const publicRoutes = [
          "/",
          "/auth/login",
          "/auth/signup",
          "/auth/error",
          "/auth/callback/google",
        ];

        // Allow API routes and Next.js internals so client fetches (session/csrf)
        // are not redirected to HTML pages when unauthenticated. This prevents
        // `next-auth` client requests from receiving an HTML login page which
        // causes the `Unexpected token '<' ... is not valid JSON` error.
        const pathname = req.nextUrl.pathname;
        if (pathname.startsWith("/api")) return true;
        if (pathname.startsWith("/_next")) return true;

        // If route is public, allow access
        if (publicRoutes.includes(req.nextUrl.pathname)) {
          return true;
        }

        // Protected routes require valid token
        if (!token) {
          return false;
        }

        return true;
      },
    },
  }
);

export const config = {
  matcher: [
    "/admin/:path*",
    "/user/:path*",
  ],
};
