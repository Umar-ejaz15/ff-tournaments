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
      // Wait for service worker to be ready
      if ('serviceWorker' in navigator) {
        await navigator.serviceWorker.ready;
        
        // Get existing registration
        const registration = await navigator.serviceWorker.getRegistration('/');
        if (registration) {
          const subscription = await getPushSubscription(registration);
          setIsSubscribed(!!subscription);
        }
      }
    } catch (error) {
      console.error("Error checking subscription:", error);
    }
  }

  async function handleSubscribe() {
    setIsLoading(true);
    setMessage(null);

    try {
      // Check VAPID key is available
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) {
        setMessage("Push notifications are not configured. Please contact the administrator.");
        setIsLoading(false);
        return;
      }

      // Request permission first
      const hasPermission = await requestNotificationPermission();
      if (!hasPermission) {
        setMessage("Notification permission denied. Please enable it in your browser settings.");
        setIsLoading(false);
        return;
      }

      // Wait for service worker to be ready (ServiceWorkerRegistration component handles registration)
      if ('serviceWorker' in navigator) {
        await navigator.serviceWorker.ready;
      }

      // Get or register service worker
      const registration = await registerServiceWorker();
      if (!registration) {
        setMessage("Failed to get service worker. Please refresh the page and try again.");
        setIsLoading(false);
        return;
      }

      // Subscribe to push
      const subscription = await subscribeToPush(registration);
      if (!subscription) {
        setMessage("Failed to subscribe to push notifications. Please try again.");
        setIsLoading(false);
        return;
      }

      // Convert subscription to JSON format for server
      // The subscription object needs to be converted to a format the server can use
      let subscriptionJson;
      try {
        const p256dhKey = subscription.getKey('p256dh');
        const authKey = subscription.getKey('auth');

        if (!p256dhKey || !authKey) {
          throw new Error("Subscription keys are missing");
        }

        // Convert ArrayBuffer to base64url format
        const base64UrlEncode = (buffer: ArrayBuffer): string => {
          const bytes = new Uint8Array(buffer);
          let binary = '';
          for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          return btoa(binary)
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=/g, '');
        };

        subscriptionJson = {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: base64UrlEncode(p256dhKey),
            auth: base64UrlEncode(authKey),
          },
        };

        console.log('Subscription prepared for server:', {
          hasEndpoint: !!subscriptionJson.endpoint,
          hasP256dh: !!subscriptionJson.keys.p256dh,
          hasAuth: !!subscriptionJson.keys.auth,
        });
      } catch (conversionError: any) {
        console.error('Failed to convert subscription:', conversionError);
        throw new Error("Failed to prepare subscription data: " + (conversionError.message || "Unknown error"));
      }

      // Send subscription to server
      const response = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: subscriptionJson }),
      });

      const responseData = await response.json().catch(() => ({}));

      if (!response.ok) {
        console.error('Subscription API error:', {
          status: response.status,
          statusText: response.statusText,
          error: responseData,
        });
        throw new Error(responseData.error || responseData.details || "Failed to save subscription");
      }

      setIsSubscribed(true);
      setMessage("Successfully subscribed to push notifications!");
    } catch (error: any) {
      console.error("Subscribe error:", error);
      const errorMessage = error.message || "Failed to enable notifications. Please try again.";
      console.error("Full error details:", {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
      setMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleUnsubscribe() {
    setIsLoading(true);
    setMessage(null);

    try {
      // Wait for service worker to be ready
      if ('serviceWorker' in navigator) {
        await navigator.serviceWorker.ready;
      }

      const registration = await navigator.serviceWorker.getRegistration('/');
      if (!registration) {
        setMessage("Service worker not found. You may already be unsubscribed.");
        setIsSubscribed(false);
        setIsLoading(false);
        return;
      }

      const subscription = await getPushSubscription(registration);

      if (subscription) {
        const unsubscribed = await unsubscribeFromPush(subscription);
        if (!unsubscribed) {
          throw new Error("Failed to unsubscribe from push service");
        }

        // Remove from server
        const response = await fetch("/api/push/subscribe", {
          method: "DELETE",
        });

        if (!response.ok) {
          console.warn("Failed to remove subscription from server, but unsubscribed locally");
        }

        setIsSubscribed(false);
        setMessage("Successfully unsubscribed from push notifications.");
      } else {
        // Already unsubscribed locally, just remove from server
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
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3 sm:p-4">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 shrink-0" />
          <h3 className="font-semibold text-white text-sm sm:text-base truncate">Push Notifications</h3>
        </div>
        {isSubscribed ? (
          <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 shrink-0" />
        ) : (
          <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 shrink-0" />
        )}
      </div>

      <p className="text-gray-400 text-xs sm:text-sm mb-3 sm:mb-4 leading-relaxed">
        {isSubscribed
          ? "You'll receive push notifications for tournament updates, match reminders, and prize announcements."
          : "Enable push notifications to receive instant updates about your tournaments, match reminders, and prizes."}
      </p>

      {message && (
        <div
          className={`mb-3 sm:mb-4 p-2 sm:p-3 rounded-lg text-xs sm:text-sm ${
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
        className={`w-full py-2.5 sm:py-2 px-4 rounded-lg font-semibold text-sm sm:text-base transition-colors flex items-center justify-center gap-2 min-h-[44px] touch-manipulation ${
          isSubscribed
            ? "bg-red-600 hover:bg-red-700 active:bg-red-800 text-white"
            : "bg-yellow-500 hover:bg-yellow-400 active:bg-yellow-300 text-black"
        } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <span className="animate-spin">⏳</span>
            Processing...
          </span>
        ) : isSubscribed ? (
          <>
            <BellOff className="w-4 h-4 shrink-0" />
            <span className="whitespace-nowrap">Disable Notifications</span>
          </>
        ) : (
          <>
            <Bell className="w-4 h-4 shrink-0" />
            <span className="whitespace-nowrap">Enable Notifications</span>
          </>
        )}
      </button>
    </div>
  );
}

