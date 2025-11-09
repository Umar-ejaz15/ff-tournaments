import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isAdmin = token?.role === "admin";
    const isAdminRoute = req.nextUrl.pathname.startsWith("/admin");

    // Prevent redirect loops - if we're already on login, don't redirect again
    if (req.nextUrl.pathname === "/auth/login") {
      return NextResponse.next();
    }

    // If user tries to access admin route but is not admin
    if (isAdminRoute && !isAdmin) {
      return NextResponse.redirect(new URL("/user", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow access to public routes
        const publicRoutes = ["/", "/auth/login", "/auth/signup", "/auth/error"];
        if (publicRoutes.includes(req.nextUrl.pathname)) {
          return true;
        }

        // Require authentication for protected routes
        // But don't redirect if we're already on a public route
        if (!token && !publicRoutes.includes(req.nextUrl.pathname)) {
          return false; // This will trigger redirect to login
        }

        return !!token;
      },
    },
  }
);

export const config = {
  matcher: ["/admin/:path*", "/user/:path*"],
};
