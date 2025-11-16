"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, Check, X, BellOff } from "lucide-react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import useSWR from "swr";

interface Notification {
  id: string;
  type: string;
  message: string;
  read: boolean;
  createdAt: string;
  metadata?: any;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function NotificationBell() {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  // Only fetch user notifications when on user routes and session role is 'user'
  const shouldFetch = status === "authenticated" && pathname?.startsWith("/user") && session?.user?.role === "user";
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const { data: notifications = [], mutate } = useSWR<Notification[]>(
    shouldFetch ? "/api/user/notifications" : null,
    fetcher,
    { refreshInterval: 3000, revalidateOnFocus: true }
  );

  const unreadCount = notifications.filter((n) => !n.read).length;

  const [isPushSupported, setIsPushSupported] = useState(false);
  const [isPushEnabled, setIsPushEnabled] = useState(false);
  useEffect(() => {
    const supported = typeof window !== "undefined" && "Notification" in window && "serviceWorker" in navigator;
    setIsPushSupported(supported);
    if (supported) {
      setIsPushEnabled(Notification.permission === "granted");
    }
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

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

  // If not authenticated, or we're not on a user route for a user role, hide the bell.
  if (!shouldFetch || status !== "authenticated" || !session) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
        {!isPushEnabled && isPushSupported && (
          <span className="absolute -bottom-1 -right-1 bg-yellow-500 text-black rounded-full w-4 h-4 flex items-center justify-center text-[10px]" title="Push disabled">
            !
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-gray-900 border border-gray-800 rounded-xl shadow-2xl z-50 max-h-[600px] overflow-hidden flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-gray-800">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Bell className="w-5 h-5 text-yellow-400" />
              Notifications
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No notifications</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-800">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-4 hover:bg-gray-800/50 transition-colors ${
                      !notif.read ? "bg-blue-500/5" : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <p className={`text-sm ${notif.read ? "text-gray-400" : "text-white"}`}>
                          {notif.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(notif.createdAt).toLocaleString()}
                        </p>
                      </div>
                      {!notif.read && (
                        <button
                          onClick={() => markAsRead([notif.id])}
                          className="p-1 hover:bg-gray-700 rounded transition-colors"
                          title="Mark as read"
                        >
                          <Check className="w-4 h-4 text-gray-400 hover:text-green-400" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-3 border-t border-gray-800">
            <Link
              href="/user/notifications"
              className="block w-full text-center text-sm text-blue-400 hover:text-blue-300 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              View All Notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

