"use client";

import React, { useState, useEffect } from "react";
import PushNotificationSetup from "@/app/user/components/PushNotificationSetup";
import PopupBox from "@/components/PopupBox";
import { registerServiceWorker, getPushSubscription } from "@/lib/push-notifications";

export default function DashboardClient() {
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") return;

    // Only prompt once per session
    const alreadyShown = sessionStorage.getItem("pushPromptShown");
    async function checkPush() {
      try {
        if (!("Notification" in window) || !("serviceWorker" in navigator)) return;

        // If permission already granted, no need to prompt
        if (Notification.permission === "granted") return;

        // Register service worker and check existing subscription
        const reg = await registerServiceWorker();
        if (!reg) return;
        const sub = await getPushSubscription(reg);

        // If not subscribed and we've not shown prompt in this session, open popup
        if (!sub && !alreadyShown) {
          setShowPopup(true);
          sessionStorage.setItem("pushPromptShown", "1");
        }
      } catch (error) {
        console.error("Push check error:", error);
      }
    }

    checkPush();
  }, []);

  return (
    <div className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
          <h2 className="text-lg sm:text-xl font-semibold">Welcome back!</h2>
          <p className="text-xs sm:text-sm text-gray-400">Quick actions</p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => setShowPopup(true)}
            className="w-full sm:w-auto px-4 py-2.5 sm:py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg text-sm sm:text-base min-h-[44px] touch-manipulation transition-colors"
          >
            Open Help Box
          </button>

          <div className="w-full sm:w-48">
            <PushNotificationSetup />
          </div>
        </div>
      </div>

      {showPopup && (
        <PopupBox title="Enable Push Notifications" onClose={() => setShowPopup(false)}>
          <div className="space-y-4">
            <p className="mb-2 text-sm text-gray-300">
              We noticed push notifications are not enabled. Enable them to receive instant tournament
              updates and match reminders.
            </p>
            <div>
              <PushNotificationSetup />
            </div>
          </div>
        </PopupBox>
      )}
    </div>
  );
}
