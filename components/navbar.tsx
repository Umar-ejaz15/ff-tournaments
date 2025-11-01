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

  // Don't show navbar on auth pages
  if (pathname?.startsWith("/auth")) {
    return null;
  }

  if (status === "loading") {
    return (
      <nav className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="text-white">Loading...</div>
          </div>
        </div>
      </nav>
    );
  }

  if (!session) {
    return (
      <nav className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
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
        </div>
      </nav>
    );
  }

  const isAdmin = session.user.role === "admin";

  return (
    <nav className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-8">
            <Link href={isAdmin ? "/admin" : "/user"} className="text-xl font-bold text-yellow-400">
              FF Tournaments
            </Link>

            <div className="hidden md:flex gap-6">
              {isAdmin ? (
                <>
                  <Link
                    href="/admin"
                    className={`px-3 py-2 rounded-lg transition-colors ${
                      pathname === "/admin"
                        ? "bg-gray-800 text-yellow-400"
                        : "text-gray-300 hover:text-white hover:bg-gray-800"
                    }`}
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/admin/users"
                    className={`px-3 py-2 rounded-lg transition-colors ${
                      pathname === "/admin/users"
                        ? "bg-gray-800 text-yellow-400"
                        : "text-gray-300 hover:text-white hover:bg-gray-800"
                    }`}
                  >
                    Users
                  </Link>
                </>
              ) : (
                <Link
                  href="/user"
                  className={`px-3 py-2 rounded-lg transition-colors ${
                    pathname === "/user"
                      ? "bg-gray-800 text-yellow-400"
                      : "text-gray-300 hover:text-white hover:bg-gray-800"
                  }`}
                >
                  Dashboard
                </Link>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-4">
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

            <div className="relative">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden p-2 text-gray-300 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>

              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-lg md:hidden">
                  <div className="p-4 border-b border-gray-700">
                    <p className="text-sm font-medium text-white">{session.user.name}</p>
                    <p className="text-xs text-gray-400">{session.user.email}</p>
                    {isAdmin && (
                      <span className="mt-1 inline-block px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded text-xs">
                        Admin
                      </span>
                    )}
                  </div>
                  <div className="p-2">
                    {isAdmin ? (
                      <>
                        <Link
                          href="/admin"
                          className="block px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 rounded"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          Dashboard
                        </Link>
                        <Link
                          href="/admin/users"
                          className="block px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 rounded"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          Users
                        </Link>
                      </>
                    ) : (
                      <Link
                        href="/user"
                        className="block px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 rounded"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Dashboard
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        handleLogout();
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-gray-700 rounded mt-2"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={handleLogout}
              className="hidden md:flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
      </div>
    </nav>
  );
}

