/**
 * Push Notification Utilities
 * Handles Web Push API for mobile notifications
 */

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

/**
 * Request notification permission
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission === 'denied') {
    console.warn('Notification permission denied');
    return false;
  }

  const permission = await Notification.requestPermission();
  return permission === 'granted';
}

/**
 * Get service worker registration (uses existing or waits for ready)
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service workers are not supported');
    return null;
  }

  try {
    // Check if service worker is already registered
    let registration = await navigator.serviceWorker.getRegistration('/');
    
    // If not registered, wait for it to be ready (ServiceWorkerRegistration component handles registration)
    if (!registration) {
      // Wait a bit for the ServiceWorkerRegistration component to register it
      await new Promise(resolve => setTimeout(resolve, 500));
      registration = await navigator.serviceWorker.getRegistration('/');
      
      // If still not registered, try registering ourselves
      if (!registration) {
        registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
          updateViaCache: 'none'
        });
      }
    }

    // Wait for service worker to be ready
    if (registration) {
      await navigator.serviceWorker.ready;
      console.log('Service Worker ready:', registration.scope);
      return registration;
    }

    return null;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    return null;
  }
}

/**
 * Subscribe to push notifications
 */
export async function subscribeToPush(
  registration: ServiceWorkerRegistration
): Promise<PushSubscription | null> {
  try {
    // Get VAPID public key from environment
    // In Next.js, NEXT_PUBLIC_ variables are available at build time and client-side
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
    
    console.log('Attempting push subscription with VAPID key:', {
      hasKey: !!vapidPublicKey,
      keyLength: vapidPublicKey.length,
      keyPrefix: vapidPublicKey.substring(0, 20) + '...',
    });
    
    if (!vapidPublicKey) {
      console.error('VAPID public key is not configured.');
      throw new Error('VAPID public key is missing. Please configure push notifications in environment variables.');
    }

    // Validate VAPID key format (should be base64url)
    if (vapidPublicKey.length < 50) {
      console.error('VAPID key seems too short:', vapidPublicKey.length);
      throw new Error('Invalid VAPID public key format. Please check your environment variables.');
    }

    // Check if already subscribed
    let existingSubscription: PushSubscription | null = null;
    try {
      existingSubscription = await registration.pushManager.getSubscription();
      if (existingSubscription) {
        console.log('Already subscribed to push notifications');
        return existingSubscription;
      }
    } catch (getSubError) {
      console.warn('Could not check existing subscription:', getSubError);
      // Continue to try subscribing
    }

    // Convert VAPID key and subscribe
    let applicationServerKey: Uint8Array;
    try {
      applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);
      console.log('VAPID key converted successfully, length:', applicationServerKey.length);
    } catch (conversionError: any) {
      console.error('Failed to convert VAPID key:', conversionError);
      throw new Error('Invalid VAPID public key format. Please check your environment variables.');
    }

    console.log('Subscribing to push manager...');
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: applicationServerKey as BufferSource
    });
    
    if (!subscription) {
      throw new Error('Subscription returned null');
    }
    
    console.log('Successfully subscribed to push notifications:', {
      endpoint: subscription.endpoint.substring(0, 50) + '...',
      hasKeys: !!subscription.getKey('p256dh') && !!subscription.getKey('auth'),
    });
    return subscription;
  } catch (error: any) {
    console.error('Push subscription failed:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });
    
    if (error.name === 'NotAllowedError') {
      throw new Error('Notification permission denied. Please enable notifications in your browser settings.');
    } else if (error.name === 'InvalidStateError') {
      // Try to get existing subscription
      try {
        const existing = await registration.pushManager.getSubscription();
        if (existing) {
          console.log('Found existing subscription after InvalidStateError');
          return existing;
        }
      } catch {
        // Ignore
      }
      throw new Error('Failed to subscribe to push notifications. Service worker may not be ready. Please refresh and try again.');
    } else if (error.name === 'AbortError') {
      throw new Error('Subscription was aborted. Please try again.');
    } else if (error.message) {
      throw error; // Re-throw with existing message
    } else {
      throw new Error('Failed to subscribe to push notifications. Please check your browser console for details.');
    }
  }
}

/**
 * Convert VAPID key from base64 URL to Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Get existing push subscription
 */
export async function getPushSubscription(
  registration: ServiceWorkerRegistration
): Promise<PushSubscription | null> {
  try {
    return await registration.pushManager.getSubscription();
  } catch (error) {
    console.error('Failed to get push subscription:', error);
    return null;
  }
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPush(
  subscription: PushSubscription
): Promise<boolean> {
  try {
    await subscription.unsubscribe();
    return true;
  } catch (error) {
    console.error('Failed to unsubscribe:', error);
    return false;
  }
}

