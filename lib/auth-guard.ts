import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";

/**
 * Server-side role-based access check
 * Use this in server components and page files to enforce access control
 */
export async function checkAuth(requiredRole?: "admin" | "user") {
  const session = await getServerSession(authOptions);

  // If not authenticated, redirect to login
  if (!session?.user?.email) {
    redirect("/auth/login");
  }

  // Fetch user with minimal fields for role check
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
    },
  });

  // User not found in DB (shouldn't happen but be safe)
  if (!user) {
    redirect("/auth/signup");
  }

  // Enforce role if required
  if (requiredRole === "admin" && user.role !== "admin") {
    redirect("/user/player/dashboard");
  }

  if (requiredRole === "user" && user.role === "admin") {
    redirect("/admin");
  }

  return user;
}

/**
 * Get current user with session check
 * Returns null if not authenticated, otherwise returns user data
 */
export async function getCurrentUser() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return null;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        image: true,
      },
    });

    return user;
  } catch (error) {
    console.error("Error fetching current user:", error);
    return null;
  }
}

/**
 * Require admin access with error handling
 * Use in API routes or server components
 */
export async function requireAdmin() {
  return checkAuth("admin");
}

/**
 * Require user (non-admin) access
 * Use in API routes or server components
 */
export async function requireUser() {
  return checkAuth("user");
}
