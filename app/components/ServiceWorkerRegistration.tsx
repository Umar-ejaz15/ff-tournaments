"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegistration() {
  useEffect(() => {
      if (typeof window !== "undefined" && "serviceWorker" in navigator) {
        // Register service worker with update check
        navigator.serviceWorker
          .register("/sw.js", { scope: "/", updateViaCache: "none" })
          .then((registration) => {
            if (process.env.NODE_ENV === "development") {
              console.log("Service Worker registered:", registration.scope);
            }

            // Force update on page load to get latest version
            registration.update();

            // Check for updates periodically
            setInterval(() => {
              registration.update();
            }, 60 * 60 * 1000); // Check every hour

            // Handle updates
            registration.addEventListener("updatefound", () => {
              const newWorker = registration.installing;
              if (newWorker) {
                newWorker.addEventListener("statechange", () => {
                  if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                    // New service worker available, reload to activate
                    if (confirm("New version available! Reload to update?")) {
                      window.location.reload();
                    }
                  }
                });
              }
            });
          })
          .catch((error) => {
            console.error("Service Worker registration failed:", error);
          });
      }
  }, []);

  return null;
}

