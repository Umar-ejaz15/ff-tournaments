"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function SessionGuard({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  // If authenticated, enforce role-based routing to avoid mixing admin/user areas
  // NOTE: this hook must always be called (do not place it after an early return)
  useEffect(() => {
    if (status !== "authenticated" || !session?.user) return;

    const role = session.user.role;

    if (role === "admin" && pathname?.startsWith("/user")) {
      router.replace("/admin");
      return;
    }

    if (role === "user" && pathname?.startsWith("/admin")) {
      router.replace("/user/player/dashboard");
      return;
    }
    
    // Redirect authenticated users from /user to their dashboard
    if (role === "user" && pathname === "/user") {
      router.replace("/user/player/dashboard");
      return;
    }
  }, [status, session, pathname, router]);

  // While NextAuth is loading, block render with a full-screen loading UI
  if (status === "loading") {
    return <LoadingSpinner message="Verifying your account and loading data..." />;
  }

  // Render children when not loading. Unauthenticated users are allowed to see public pages.
  return <>{children}</>;
}
