"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { 
  LayoutDashboard, 
  Users, 
  Receipt, 
  Trophy, 
  Wallet, 
  ArrowDownUp, 
  History,
  ChevronDown,
  Menu,
  LogOut,
  User as UserIcon,
  BarChart3
} from "lucide-react";
import { MessageSquare } from "lucide-react";
import NotificationBell from "./NotificationBell";
import SupportBadge from "./SupportBadge";

export default function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Ensure role-based route consistency: redirect away from mismatched areas
  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "admin" && pathname?.startsWith("/user")) {
      router.push("/admin");
    }
    if (status === "authenticated" && session?.user?.role === "user" && pathname?.startsWith("/admin")) {
      router.push("/user/player/dashboard");
    }
  }, [status, session, pathname, router]);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/");
    router.refresh();
  };

  // Hide navbar on auth pages
  if (pathname?.startsWith("/auth")) return null;

  // Loading state
  if (status === "loading") {
    return (
      <nav className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center text-white">
          Loading...
        </div>
      </nav>
    );
  }

  // Logged out navbar
  if (!session) {
    return (
      <nav className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 flex justify-between h-16 items-center">
          <Link href="/" className="text-xl font-bold text-yellow-400">
            ZP Battle Zone
          </Link>
          <div className="flex gap-4">
            <Link
              href="/auth/login"
              className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
            >
              Login
            </Link>
            <Link
              href="/auth/signup"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </nav>
    );
  }

  // Determine current route area
  const userOnUserPath = pathname?.startsWith("/user");
  const userOnAdminPath = pathname?.startsWith("/admin");

  // Only trust session role after authentication completes
  const isAdmin = status === "authenticated" && session?.user?.role === "admin";

  // Transient mismatch when auth is done but the role doesn't match the current area
  const roleMismatch =
    status === "authenticated" &&
    ((userOnUserPath && session?.user?.role !== "user") || (userOnAdminPath && session?.user?.role !== "admin"));

  // Only display name/email/admin badge when authentication is complete and
  // the session role matches the current route area (or the route is neutral)
  const canShowSessionInfo =
    status === "authenticated" &&
    ((userOnUserPath && session?.user?.role === "user") || (userOnAdminPath && session?.user?.role === "admin") || (!userOnUserPath && !userOnAdminPath));

  const navItem = (href: string, label: string, icon?: React.ReactNode) => (
    <Link
      href={href}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
        pathname?.startsWith(href)
          ? "bg-gray-800 text-yellow-400"
          : "text-gray-300 hover:text-white hover:bg-gray-800"
      }`}
    >
      {icon && <span className="w-4 h-4">{icon}</span>}
      {label}
    </Link>
  );

  const mobileNavItem = (href: string, label: string, icon?: React.ReactNode) => (
    <Link
      href={href}
      className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
        pathname?.startsWith(href)
          ? "bg-gray-800 text-yellow-400"
          : "text-gray-300 hover:text-white hover:bg-gray-800"
      }`}
      onClick={() => setIsMenuOpen(false)}
    >
      {icon && <span className="w-4 h-4">{icon}</span>}
      {label}
    </Link>
  );

  return (
    <nav className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center gap-4">
          {/* Left Section */}
          <div className="flex items-center gap-4 sm:gap-8 min-w-0">
            <Link
              href={isAdmin ? "/admin" : "/user/player/dashboard"}
              className="text-lg sm:text-xl font-bold text-yellow-400 truncate"
            >
              ZP Battle Zone
            </Link>

            {/* Desktop Menu */}
            <div className="hidden lg:flex gap-2 xl:gap-6">
              {isAdmin ? (
                <>
                  {navItem("/admin", "Dashboard", <LayoutDashboard className="w-4 h-4" />)}
                  {navItem("/admin/users", "Users", <Users className="w-4 h-4" />)}
                  {navItem("/admin/transactions", "Transactions", <Receipt className="w-4 h-4" />)}
                  {navItem("/admin/tournaments", "Tournaments", <Trophy className="w-4 h-4" />)}
                      {navItem("/admin/support/requests", "Support", <MessageSquare className="w-4 h-4" />)}
                  {navItem("/admin/statistics", "Statistics", <BarChart3 className="w-4 h-4" />)}
                  {navItem("/admin/withdrawals", "Withdrawals", <ArrowDownUp className="w-4 h-4" />)}
                </>
              ) : (
                <>
                  {navItem("/user/player/dashboard", "Dashboard", <LayoutDashboard className="w-4 h-4" />)}
                  {navItem("/user/tournaments", "Tournaments", <Trophy className="w-4 h-4" />)}
                  {navItem("/user/leaderboard", "Leaderboard", <Trophy className="w-4 h-4" />)}
                  {navItem("/user/support", "Support", <MessageSquare className="w-4 h-4" />)}
                  <div className="relative group">
                    <button className="px-3 py-2 rounded-lg transition-colors text-gray-300 hover:text-white hover:bg-gray-800 flex items-center gap-1">
                      <Wallet className="w-4 h-4" />
                      Wallet
                      <ChevronDown className="w-3 h-3" />
                    </button>
                    <div className="absolute top-full left-0 mt-1 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                      {navItem("/user/wallet", "My Wallet", <Wallet className="w-4 h-4" />)}
                      {navItem("/user/withdrawals", "Withdrawals", <ArrowDownUp className="w-4 h-4" />)}
                      {navItem("/user/transactions", "Transactions", <History className="w-4 h-4" />)}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
            {/* Notification Bell */}
            <NotificationBell />
            {/* Admin support new count badge */}
            {isAdmin && (
              <SupportBadge />
            )}

            {/* User Info (Desktop) */}
            <div className="hidden sm:flex items-center gap-2 lg:gap-3">
              {roleMismatch || !canShowSessionInfo ? (
                <div className="text-right text-xs lg:text-sm">
                  <p className="text-gray-400">Verifying...</p>
                </div>
              ) : (
                <>
                  <UserIcon className="w-4 h-4 lg:w-5 lg:h-5 text-gray-400 shrink-0" />
                  <div className="text-right hidden md:block">
                    <p className="text-xs lg:text-sm text-gray-300 truncate max-w-[150px]">{session?.user?.name}</p>
                    <p className="text-xs text-gray-500 truncate max-w-[150px]">{session?.user?.email}</p>
                  </div>
                  {isAdmin && (
                    <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded text-xs font-medium shrink-0">
                      Admin
                    </span>
                  )}
                </>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 text-gray-300 hover:text-white transition-colors shrink-0"
              aria-label="Toggle menu"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Logout (Desktop) */}
            <button
              onClick={handleLogout}
              className="hidden sm:flex items-center gap-2 px-3 lg:px-4 py-2 text-xs lg:text-sm text-red-400 hover:text-red-300 hover:bg-gray-800 rounded-lg transition-colors shrink-0"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden md:inline">Logout</span>
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {isMenuOpen && (
          <div className="lg:hidden border-t border-gray-700 bg-gray-900 py-2 space-y-1 max-h-[calc(100vh-4rem)] overflow-y-auto">
            {/* Mobile User Info */}
            <div className="px-3 py-2 text-sm">
              <p className="text-gray-300 font-medium truncate">{session?.user?.name || "User"}</p>
              <p className="text-xs text-gray-500 truncate">{session?.user?.email || ""}</p>
              {isAdmin && (
                <span className="inline-block mt-1 px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded text-xs font-medium">
                  Admin
                </span>
              )}
            </div>

            <div className="border-t border-gray-700 my-2"></div>

            {/* Mobile Navigation */}
            {isAdmin ? (
              <>
                {mobileNavItem("/admin", "Dashboard", <LayoutDashboard className="w-4 h-4" />)}
                {mobileNavItem("/admin/users", "Users", <Users className="w-4 h-4" />)}
                {mobileNavItem("/admin/transactions", "Transactions", <Receipt className="w-4 h-4" />)}
                {mobileNavItem("/admin/tournaments", "Tournaments", <Trophy className="w-4 h-4" />)}
                {mobileNavItem("/admin/statistics", "Statistics", <BarChart3 className="w-4 h-4" />)}
                {mobileNavItem("/admin/withdrawals", "Withdrawals", <ArrowDownUp className="w-4 h-4" />)}
                {mobileNavItem("/admin/support/requests", "Support Requests", <MessageSquare className="w-4 h-4" />)}
              </>
            ) : (
              <>
                {mobileNavItem("/user/player/dashboard", "Dashboard", <LayoutDashboard className="w-4 h-4" />)}
                {mobileNavItem("/user/tournaments", "Tournaments", <Trophy className="w-4 h-4" />)}
                {mobileNavItem("/user/leaderboard", "Leaderboard", <Trophy className="w-4 h-4" />)}
                {mobileNavItem("/user/wallet", "My Wallet", <Wallet className="w-4 h-4" />)}
                {mobileNavItem("/user/withdrawals", "Withdrawals", <ArrowDownUp className="w-4 h-4" />)}
                {mobileNavItem("/user/transactions", "Transactions", <History className="w-4 h-4" />)}
                {mobileNavItem("/user/support", "Support", <MessageSquare className="w-4 h-4" />)}
              </>
            )}

            <div className="border-t border-gray-700 my-2"></div>

            {/* Mobile Logout */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 text-left px-3 py-2 text-sm text-red-400 hover:bg-gray-800 rounded transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
