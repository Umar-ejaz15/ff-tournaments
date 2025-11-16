"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import useSWR from "swr";
import { Bell, Check, CheckCheck, ArrowLeft, Trophy, Wallet, Receipt, Calendar, X } from "lucide-react";
import Link from "next/link";
import LoadingSpinner from "@/components/LoadingSpinner";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface Notification {
  id: string;
  type: string;
  message: string;
  read: boolean;
  createdAt: string;
  metadata?: any;
}

export default function NotificationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/login");
    if (status === "authenticated" && session?.user?.role === "admin") router.push("/admin");
  }, [status, session, router]);

  const shouldFetch = status === "authenticated" && session?.user?.role === "user";
  const { data: notifications = [], mutate, isLoading } = useSWR<Notification[]>(
    shouldFetch ? "/api/user/notifications" : null,
    fetcher,
    { refreshInterval: 3000, revalidateOnFocus: true, revalidateOnReconnect: true }
  );

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/login");
  }, [status, router]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  async function markAsRead(ids: string[]) {
    try {
      await fetch("/api/user/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, read: true }),
      });
      mutate();
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  }

  async function markAllAsRead() {
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
    if (unreadIds.length > 0) {
      await markAsRead(unreadIds);
    }
  }

  function getNotificationIcon(type: string) {
    switch (type) {
      case "prize":
        return <Trophy className="w-5 h-5 text-yellow-400" />;
      case "bonus":
        return <Wallet className="w-5 h-5 text-green-400" />;
      case "withdrawal":
        return <Receipt className="w-5 h-5 text-blue-400" />;
      case "start":
        return <Calendar className="w-5 h-5 text-purple-400" />;
      case "reminder":
        return <Bell className="w-5 h-5 text-orange-400" />;
      default:
        return <Bell className="w-5 h-5 text-gray-400" />;
    }
  }

  if (status === "loading") {
    return <LoadingSpinner message="Loading user data..." />;
  }

  if (isLoading && notifications.length === 0) {
    return <LoadingSpinner message="Loading notifications..." />;
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-gray-900 via-black to-gray-900 text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <Link
            href="/user"
            className="flex items-center gap-2 text-blue-400 hover:text-blue-300 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <div className="flex items-center justify-between">
            <h1 className="text-4xl font-bold mb-2 text-yellow-400 flex items-center gap-3">
              <Bell className="w-8 h-8" />
              Notifications
            </h1>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-sm"
              >
                <CheckCheck className="w-4 h-4" />
                Mark All Read
              </button>
            )}
          </div>
          <p className="text-gray-400">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}` : "All caught up!"}
          </p>
        </div>

        <div className="space-y-3">
          {notifications.length === 0 ? (
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-12 text-center">
              <Bell className="w-16 h-16 mx-auto mb-4 text-gray-600 opacity-50" />
              <p className="text-gray-400 text-lg mb-2">No notifications yet</p>
              <p className="text-gray-500 text-sm">You'll see updates about tournaments, prizes, and more here</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                className={`bg-gray-900/50 border rounded-xl p-6 transition-all ${
                  notif.read
                    ? "border-gray-800"
                    : "border-blue-500/50 bg-blue-500/5 shadow-lg shadow-blue-500/10"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="mt-1">{getNotificationIcon(notif.type)}</div>
                  <div className="flex-1">
                    <p className={`text-base mb-2 ${notif.read ? "text-gray-300" : "text-white font-medium"}`}>
                      {notif.message}
                    </p>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-500">
                        {new Date(notif.createdAt).toLocaleString()}
                      </p>
                      {!notif.read && (
                        <button
                          onClick={() => markAsRead([notif.id])}
                          className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          <Check className="w-3 h-3" />
                          Mark as read
                        </button>
                      )}
                    </div>
                    {notif.metadata?.tournamentId && (
                      <Link
                        href={`/user/tournaments/${notif.metadata.tournamentId}`}
                        className="mt-3 inline-block text-sm text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        View Tournament →
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

