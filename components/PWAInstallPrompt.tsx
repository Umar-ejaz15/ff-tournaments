"use client";

import { useEffect, useState } from "react";
import { Download, X, Share, Plus } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") return;

    // Check if dismissed in session storage
    const dismissed = sessionStorage.getItem("pwa-prompt-dismissed");
    if (dismissed === "true") {
      setIsDismissed(true);
    }

    // Check if app is already installed
    if (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    // Detect mobile device
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
      const isIOSDevice = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
      
      setIsMobile(isMobileDevice);
      setIsIOS(isIOSDevice);
    };

    checkMobile();

    // Listen for the beforeinstallprompt event (Android Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    // If native prompt is available (Android Chrome), use it
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === "accepted") {
        console.log("User accepted the install prompt");
        setIsInstalled(true);
      }

      setDeferredPrompt(null);
    } else {
      // Show instructions for iOS or other browsers
      setShowInstructions(true);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("pwa-prompt-dismissed", "true");
    }
  };

  // Don't show if already installed or dismissed
  if (isInstalled || isDismissed) {
    return null;
  }

  // Only show on mobile devices
  if (!isMobile) {
    return null;
  }

  return (
    <>
      <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-md z-50 animate-in slide-in-from-bottom-4">
        <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black rounded-lg shadow-2xl p-4 border-2 border-yellow-400">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <Download className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg mb-1">Install FF Tournaments</h3>
              <p className="text-sm text-black/80 mb-3">
                Add to your home screen for quick access!
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleInstallClick}
                  className="flex-1 bg-black text-yellow-400 font-semibold py-2 px-4 rounded-lg hover:bg-gray-900 transition-colors"
                >
                  {deferredPrompt ? "Install Now" : "Show Instructions"}
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleDismiss();
                  }}
                  className="bg-black/20 text-black font-semibold py-2 px-3 rounded-lg hover:bg-black/30 active:bg-black/40 transition-colors touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
                  aria-label="Close"
                  type="button"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Installation Instructions Modal */}
      {showInstructions && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4" onClick={() => setShowInstructions(false)}>
          <div className="bg-gray-900 rounded-xl shadow-2xl max-w-md w-full p-6 border border-gray-800" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Install App</h3>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowInstructions(false);
                }}
                className="text-gray-400 hover:text-white active:text-gray-300 transition-colors touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
                type="button"
                aria-label="Close instructions"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {isIOS ? (
              <div className="space-y-4">
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <p className="text-gray-300 text-sm mb-3">
                    To install this app on your iPhone or iPad:
                  </p>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-gray-300">
                    <li>Tap the <Share className="w-4 h-4 inline mx-1" /> Share button at the bottom of your screen</li>
                    <li>Scroll down and tap <strong className="text-white">"Add to Home Screen"</strong></li>
                    <li>Tap <strong className="text-white">"Add"</strong> in the top right corner</li>
                  </ol>
                </div>
                <div className="flex items-center gap-2 text-yellow-400 text-sm">
                  <Share className="w-5 h-5" />
                  <span>Look for the Share icon in Safari's bottom toolbar</span>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <p className="text-gray-300 text-sm mb-3">
                    To install this app on your Android device:
                  </p>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-gray-300">
                    <li>Tap the <strong className="text-white">menu icon</strong> (three dots) in your browser</li>
                    <li>Select <strong className="text-white">"Install app"</strong> or <strong className="text-white">"Add to Home screen"</strong></li>
                    <li>Confirm the installation</li>
                  </ol>
                </div>
                <div className="flex items-center gap-2 text-yellow-400 text-sm">
                  <Plus className="w-5 h-5" />
                  <span>Or look for an "Install" banner at the top of your browser</span>
                </div>
              </div>
            )}

            <button
              onClick={() => setShowInstructions(false)}
              className="mt-6 w-full bg-yellow-500 hover:bg-yellow-400 text-black font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </>
  );
}

