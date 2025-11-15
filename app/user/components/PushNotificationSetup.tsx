"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff, CheckCircle, XCircle } from "lucide-react";
import {
  requestNotificationPermission,
  registerServiceWorker,
  subscribeToPush,
  getPushSubscription,
  unsubscribeFromPush,
} from "@/lib/push-notifications";

export default function PushNotificationSetup() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    // Check if browser supports notifications and service workers
    const supported =
      "Notification" in window &&
      "serviceWorker" in navigator &&
      "PushManager" in window;
    setIsSupported(supported);

    if (supported) {
      checkSubscriptionStatus();
    }
  }, []);

  async function checkSubscriptionStatus() {
    try {
      const registration = await registerServiceWorker();
      if (registration) {
        const subscription = await getPushSubscription(registration);
        setIsSubscribed(!!subscription);
      }
    } catch (error) {
      console.error("Error checking subscription:", error);
    }
  }

  async function handleSubscribe() {
    setIsLoading(true);
    setMessage(null);

    try {
      // Request permission
      const hasPermission = await requestNotificationPermission();
      if (!hasPermission) {
        setMessage("Notification permission denied. Please enable it in your browser settings.");
        setIsLoading(false);
        return;
      }

      // Register service worker
      const registration = await registerServiceWorker();
      if (!registration) {
        setMessage("Failed to register service worker.");
        setIsLoading(false);
        return;
      }

      // Subscribe to push
      const subscription = await subscribeToPush(registration);
      if (!subscription) {
        setMessage("Failed to subscribe to push notifications.");
        setIsLoading(false);
        return;
      }

      // Send subscription to server
      const response = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription }),
      });

      if (!response.ok) {
        throw new Error("Failed to save subscription");
      }

      setIsSubscribed(true);
      setMessage("Successfully subscribed to push notifications!");
    } catch (error: any) {
      console.error("Subscribe error:", error);
      setMessage(error.message || "Failed to enable notifications.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleUnsubscribe() {
    setIsLoading(true);
    setMessage(null);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await getPushSubscription(registration);

      if (subscription) {
        await unsubscribeFromPush(subscription);

        // Remove from server
        await fetch("/api/push/subscribe", {
          method: "DELETE",
        });

        setIsSubscribed(false);
        setMessage("Successfully unsubscribed from push notifications.");
      }
    } catch (error: any) {
      console.error("Unsubscribe error:", error);
      setMessage(error.message || "Failed to disable notifications.");
    } finally {
      setIsLoading(false);
    }
  }

  if (!isSupported) {
    return (
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
        <p className="text-gray-400 text-sm">
          Push notifications are not supported in your browser.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-yellow-400" />
          <h3 className="font-semibold text-white">Push Notifications</h3>
        </div>
        {isSubscribed ? (
          <CheckCircle className="w-5 h-5 text-green-400" />
        ) : (
          <XCircle className="w-5 h-5 text-gray-500" />
        )}
      </div>

      <p className="text-gray-400 text-sm mb-4">
        {isSubscribed
          ? "You'll receive push notifications for tournament updates, match reminders, and prize announcements."
          : "Enable push notifications to receive instant updates about your tournaments, match reminders, and prizes."}
      </p>

      {message && (
        <div
          className={`mb-4 p-3 rounded-lg text-sm ${
            message.includes("Successfully")
              ? "bg-green-500/20 text-green-400"
              : "bg-red-500/20 text-red-400"
          }`}
        >
          {message}
        </div>
      )}

      <button
        onClick={isSubscribed ? handleUnsubscribe : handleSubscribe}
        disabled={isLoading}
        className={`w-full py-2 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 ${
          isSubscribed
            ? "bg-red-600 hover:bg-red-700 text-white"
            : "bg-yellow-500 hover:bg-yellow-400 text-black"
        } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        {isLoading ? (
          "Processing..."
        ) : isSubscribed ? (
          <>
            <BellOff className="w-4 h-4" />
            Disable Notifications
          </>
        ) : (
          <>
            <Bell className="w-4 h-4" />
            Enable Notifications
          </>
        )}
      </button>
    </div>
  );
}

