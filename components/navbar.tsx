"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

export default function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
            FF Tournaments
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

  const isAdmin = session.user.role === "admin";

  const navItem = (href: string, label: string) => (
    <Link
      href={href}
      className={`block px-3 py-2 rounded-lg transition-colors ${
        pathname?.startsWith(href)
          ? "bg-gray-800 text-yellow-400"
          : "text-gray-300 hover:text-white hover:bg-gray-800"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <nav className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Left Section */}
          <div className="flex items-center gap-8">
            <Link
              href={isAdmin ? "/admin" : "/user"}
              className="text-xl font-bold text-yellow-400"
            >
              FF Tournaments
            </Link>

            {/* Desktop Menu */}
            <div className="hidden md:flex gap-6">
              {isAdmin ? (
                <>
                  {navItem("/admin", "Dashboard")}
                  {navItem("/admin/users", "Users")}
                  {navItem("/admin/transactions", "Transactions")}
                  {navItem("/admin/tournaments", "Tournaments")}
                  {navItem("/admin/withdrawals", "Withdrawals")}
                </>
              ) : (
                <>
                  {navItem("/user", "Dashboard")}
                  {navItem("/user/tournaments", "Tournaments")}
                  <div className="relative group">
                    <button className="px-3 py-2 rounded-lg transition-colors text-gray-300 hover:text-white hover:bg-gray-800 flex items-center gap-1">
                      Wallet
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>
                    <div className="absolute top-full left-0 mt-1 w-56 bg-gray-800 border border-gray-700 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                      {navItem("/user/wallet", "💰 My Wallet")}
                      {navItem("/user/withdrawals", "💸 Withdrawals")} {/* ✅ Added */}
                      {navItem("/user/transactions", "📊 Transactions")}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm text-gray-300">{session.user.name}</p>
                <p className="text-xs text-gray-500">{session.user.email}</p>
              </div>
              {isAdmin && (
                <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded text-xs font-medium">
                  Admin
                </span>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-gray-300 hover:text-white"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>

            {/* Logout (Desktop) */}
            <button
              onClick={handleLogout}
              className="hidden md:flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              Logout
            </button>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {isMenuOpen && (
          <div className="md:hidden mt-2 bg-gray-800 border border-gray-700 rounded-lg p-2">
            {isAdmin ? (
              <>
                {navItem("/admin", "Dashboard")}
                {navItem("/admin/users", "Users")}
                {navItem("/admin/transactions", "Transactions")}
                {navItem("/admin/tournaments", "Tournaments")}
                {navItem("/admin/withdrawals", "Withdrawals")}
              </>
            ) : (
              <>
                {navItem("/user", "Dashboard")}
                {navItem("/user/tournaments", "Tournaments")}
                {navItem("/user/wallet", "My Wallet")}
                {navItem("/user/withdrawals", "Withdrawals")} {/* ✅ Added */}
                {navItem("/user/transactions", "Transactions")}
              </>
            )}
            <button
              onClick={handleLogout}
              className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-gray-700 rounded mt-2"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
