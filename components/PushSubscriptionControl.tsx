"use client";

import React from "react";

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function PushSubscriptionControl() {
  const [isSupported, setIsSupported] = React.useState(false);
  const [isSubscribed, setIsSubscribed] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    const supported = typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    setIsSupported(supported);
    if (supported) {
      navigator.serviceWorker.ready.then(async (reg) => {
        try {
          const sub = await reg.pushManager.getSubscription();
          setIsSubscribed(!!sub);
        } catch (err) {
          console.error('Error checking subscription', err);
        }
      });
    }
  }, []);

  async function handleSubscribe() {
    setIsLoading(true);
    setMessage(null);
    try {
      if (Notification.permission === 'denied') {
        setMessage('Notification permission is denied in your browser settings.');
        setIsLoading(false);
        return;
      }

      if (Notification.permission !== 'granted') {
        const perm = await Notification.requestPermission();
        if (perm !== 'granted') {
          setMessage('Permission not granted');
          setIsLoading(false);
          return;
        }
      }

      const registration = await navigator.serviceWorker.ready;
      const vapidKey = (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY as string) || (window as any).__NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      const applicationServerKey = vapidKey ? urlBase64ToUint8Array(vapidKey) : undefined;

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      } as any);

      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription }),
      });
      if (!res.ok) throw new Error(await res.text());
      setIsSubscribed(true);
      setMessage('Successfully subscribed to push notifications');
    } catch (err: any) {
      console.error('Subscribe error:', err);
      setMessage(err?.message || 'Failed to subscribe');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleUnsubscribe() {
    setIsLoading(true);
    setMessage(null);
    try {
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.getSubscription();
      if (sub) {
        await sub.unsubscribe();
      }
      await fetch('/api/push/subscribe', { method: 'DELETE' });
      setIsSubscribed(false);
      setMessage('Unsubscribed from push notifications');
    } catch (err: any) {
      console.error('Unsubscribe error:', err);
      setMessage(err?.message || 'Failed to unsubscribe');
    } finally {
      setIsLoading(false);
    }
  }

  if (!isSupported) {
    return <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3"><p className="text-gray-400 text-sm">Push not supported</p></div>;
  }

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 mb-4">
      <p className="text-sm text-gray-300 mb-2">Mobile push notifications</p>
      {message && <p className="text-xs text-gray-400 mb-2">{message}</p>}
      <button
        onClick={isSubscribed ? handleUnsubscribe : handleSubscribe}
        disabled={isLoading}
        className={`w-full py-2 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 ${isSubscribed ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-yellow-500 hover:bg-yellow-400 text-black'} ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {isLoading ? 'Processing...' : isSubscribed ? 'Disable Notifications' : 'Enable Notifications'}
      </button>
    </div>
  );
}
