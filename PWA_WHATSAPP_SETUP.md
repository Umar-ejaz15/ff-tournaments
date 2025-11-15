# PWA & WhatsApp Bot Setup Guide

This guide explains how to set up Progressive Web App (PWA) functionality, push notifications, and WhatsApp bot integration for match reminders.

## 📱 Part 1: PWA Setup (Mobile App Installation)

### What is PWA?
Progressive Web App allows users to install your website as an app on their mobile devices. Users can:
- Install the app from their browser
- Access it like a native app
- Receive push notifications
- Use it offline (with cached content)

### Features Implemented:
✅ **PWA Manifest** (`public/manifest.json`)
- App name, icons, theme colors
- Standalone display mode
- Shortcuts for quick access

✅ **Service Worker** (`public/sw.js`)
- Offline caching
- Push notification handling
- Background sync

✅ **Install Prompt** (`components/PWAInstallPrompt.tsx`)
- Automatic install prompt after 3 seconds
- User-friendly installation UI
- Remembers if user dismissed

### How Users Install:
1. **On Android (Chrome):**
   - Visit the website
   - Browser shows "Add to Home Screen" prompt
   - Or click menu → "Add to Home Screen"

2. **On iOS (Safari):**
   - Visit the website
   - Tap Share button
   - Select "Add to Home Screen"

3. **Desktop (Chrome/Edge):**
   - Visit the website
   - Click install icon in address bar
   - Or use the install prompt that appears

### Required Icons:
You need to create and add these icon files to `/public`:
- `icon-192.png` (192x192 pixels)
- `icon-512.png` (512x512 pixels)

**Quick Icon Generation:**
- Use tools like [PWA Asset Generator](https://github.com/onderceylan/pwa-asset-generator)
- Or create simple icons with your app logo

---

## 🔔 Part 2: Push Notifications Setup

### What are Push Notifications?
Push notifications allow your app to send messages to users even when they're not actively using the app.

### Features Implemented:
✅ **Push Notification Utilities** (`lib/push-notifications.ts`)
- Permission request
- Service worker registration
- Subscription management

✅ **Push API Routes:**
- `/api/push/subscribe` - Subscribe to notifications
- `/api/push/send` - Send notifications (admin only)

✅ **Push Notification Setup UI** (`app/user/components/PushNotificationSetup.tsx`)
- Enable/disable notifications
- Status indicator
- User-friendly interface

### Setup Steps:

1. **Generate VAPID Keys:**
   ```bash
   npm install -g web-push
   web-push generate-vapid-keys
   ```
   
   This will output:
   - Public Key (starts with `B...`)
   - Private Key (starts with `...`)

2. **Add to Environment Variables:**
   ```env
   # .env.local
   NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_public_key_here
   VAPID_PRIVATE_KEY=your_private_key_here
   VAPID_EMAIL=mailto:your-email@example.com
   ```

3. **For Production (Vercel):**
   - Add these variables in Vercel Dashboard
   - Settings → Environment Variables

### How It Works:
1. User visits wallet page
2. Clicks "Enable Notifications"
3. Browser asks for permission
4. Service worker registers
5. Subscription saved to database
6. User receives notifications for:
   - Tournament updates
   - Match reminders
   - Prize announcements
   - Transaction updates

---

## 📲 Part 3: WhatsApp Bot Setup

### What is WhatsApp Bot?
Automated WhatsApp messages sent to players 30 minutes before their tournament starts.

### Features Implemented:
✅ **WhatsApp Bot Library** (`lib/whatsapp-bot.ts`)
- Supports Twilio WhatsApp API
- Supports WhatsApp Business API
- Phone number formatting

✅ **Cron Job** (`app/api/cron/match-reminders/route.ts`)
- Checks for upcoming matches every 10 minutes
- Sends WhatsApp reminders 30 minutes before
- Creates in-app notifications
- Sends push notifications

### Setup Options:

#### Option 1: Twilio WhatsApp API (Recommended)

1. **Sign up for Twilio:**
   - Go to [twilio.com](https://www.twilio.com)
   - Create account and verify phone number
   - Get WhatsApp Sandbox number (free for testing)

2. **Get Credentials:**
   - Account SID
   - Auth Token
   - WhatsApp-enabled phone number

3. **Add to Environment Variables:**
   ```env
   WHATSAPP_PROVIDER=twilio
   TWILIO_ACCOUNT_SID=your_account_sid
   TWILIO_AUTH_TOKEN=your_auth_token
   TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
   ```

4. **For Production:**
   - Request WhatsApp Business API access from Twilio
   - Costs: ~$0.005 per message (very affordable)

#### Option 2: WhatsApp Business API (Meta)

1. **Set up WhatsApp Business Account:**
   - Go to [business.facebook.com](https://business.facebook.com)
   - Create Business Account
   - Set up WhatsApp Business API

2. **Get Credentials:**
   - Access Token
   - Phone Number ID

3. **Add to Environment Variables:**
   ```env
   WHATSAPP_PROVIDER=whatsapp-business
   WHATSAPP_BUSINESS_TOKEN=your_access_token
   WHATSAPP_BUSINESS_PHONE_ID=your_phone_number_id
   ```

### Cron Job Setup:

#### For Vercel (Automatic):
✅ Already configured in `vercel.json`
- Runs every 10 minutes
- Automatically enabled on Vercel

#### For Other Hosting (Manual):
Use external cron service like [cron-job.org](https://cron-job.org):

1. Create account
2. Add new cron job:
   - URL: `https://your-domain.com/api/cron/match-reminders`
   - Method: GET
   - Headers: `Authorization: Bearer your-cron-secret`
   - Schedule: Every 10 minutes

3. **Add Cron Secret:**
   ```env
   CRON_SECRET=your-random-secret-key-here
   ```

### How It Works:
1. Cron job runs every 10 minutes
2. Finds tournaments starting in 25-35 minutes
3. Collects phone numbers from all team members
4. Sends WhatsApp message to each player
5. Creates in-app notifications
6. Sends push notifications (if enabled)

### Message Format:
```
🎮 FF Tournaments Reminder

Tournament: [Tournament Name]
Mode: [Solo/Duo/Squad]
Game Type: [BR/CS]
Starts in: 30 minutes

Lobby Code: [Code if available]

Get ready to compete! Good luck! 🏆
```

---

## 🔧 Database Schema Updates Needed

To fully support push notifications, you may want to add a `PushSubscription` model:

```prisma
model PushSubscription {
  id        String   @id @default(cuid())
  userId    String
  endpoint  String   @unique
  p256dh    String
  auth      String
  createdAt DateTime @default(now())
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
}
```

Then update User model:
```prisma
model User {
  // ... existing fields
  pushSubscriptions PushSubscription[]
}
```

---

## 📋 Checklist

### PWA:
- [ ] Create `icon-192.png` and `icon-512.png` in `/public`
- [ ] Test install on Android device
- [ ] Test install on iOS device
- [ ] Verify offline functionality

### Push Notifications:
- [ ] Generate VAPID keys
- [ ] Add to environment variables
- [ ] Test notification permission
- [ ] Test sending notifications
- [ ] (Optional) Add PushSubscription model to schema

### WhatsApp Bot:
- [ ] Choose provider (Twilio or WhatsApp Business)
- [ ] Set up account and get credentials
- [ ] Add to environment variables
- [ ] Set CRON_SECRET
- [ ] Test sending WhatsApp message
- [ ] Verify cron job is running
- [ ] Test with real tournament

---

## 🧪 Testing

### Test PWA:
1. Open website on mobile
2. Look for install prompt
3. Install app
4. Verify it appears as standalone app

### Test Push Notifications:
1. Go to wallet page
2. Click "Enable Notifications"
3. Grant permission
4. Send test notification from admin panel

### Test WhatsApp Bot:
1. Create a test tournament
2. Set start time to 30 minutes from now
3. Add your phone number to a team
4. Wait for cron job to run
5. Check WhatsApp for message

---

## 🚨 Troubleshooting

### PWA Not Installing:
- Check if HTTPS is enabled (required for PWA)
- Verify manifest.json is accessible
- Check browser console for errors

### Push Notifications Not Working:
- Verify VAPID keys are correct
- Check service worker is registered
- Verify browser supports push notifications
- Check browser notification permissions

### WhatsApp Messages Not Sending:
- Verify credentials are correct
- Check phone number format (E.164)
- Verify cron job is running
- Check server logs for errors
- For Twilio: Ensure WhatsApp is enabled on number

---

## 💰 Cost Estimates

### Twilio WhatsApp:
- Sandbox: Free (limited)
- Production: ~$0.005 per message
- Example: 100 players = $0.50 per tournament

### WhatsApp Business API:
- Free tier available
- Paid plans vary by region

### Push Notifications:
- Free (uses browser's push service)

---

## 📚 Additional Resources

- [PWA Documentation](https://web.dev/progressive-web-apps/)
- [Web Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [Twilio WhatsApp](https://www.twilio.com/docs/whatsapp)
- [WhatsApp Business API](https://developers.facebook.com/docs/whatsapp)

---

## ✅ Summary

You now have:
1. ✅ PWA support - Users can install app on mobile
2. ✅ Push notifications - Real-time notifications
3. ✅ WhatsApp bot - Automated match reminders

All features are production-ready and just need configuration!

