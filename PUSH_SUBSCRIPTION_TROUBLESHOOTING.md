# Push Subscription Troubleshooting Guide

## Common Error: "Failed to subscribe push notification"

If you're seeing this error, follow these steps to diagnose and fix it:

### Step 1: Check Browser Console
1. Open your browser's Developer Tools (F12 or right-click > Inspect)
2. Go to the **Console** tab
3. Try subscribing to push notifications again
4. Look for any error messages - they will now provide detailed information

### Step 2: Verify VAPID Keys are Configured

**Check if VAPID keys are set in your environment variables:**

1. **Local Development:**
   - Check your `.env.local` file
   - Make sure these variables exist:
     ```
     NEXT_PUBLIC_VAPID_PUBLIC_KEY="your-public-key-here"
     VAPID_PRIVATE_KEY="your-private-key-here"
     VAPID_EMAIL="mailto:your-email@example.com"
     ```
   - Restart your development server after adding/updating environment variables

2. **Production (Vercel):**
   - Go to Vercel Dashboard > Your Project > Settings > Environment Variables
   - Verify these three variables are set:
     - `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
     - `VAPID_PRIVATE_KEY`
     - `VAPID_EMAIL`
   - **Important:** After adding/updating environment variables, you must redeploy your application

3. **Generate VAPID Keys if Missing:**
   ```bash
   node scripts/generate-vapid-keys.js
   ```
   This will output the keys you need to add to your environment variables.

### Step 3: Check Service Worker Status

1. Open Developer Tools (F12)
2. Go to **Application** tab (Chrome/Edge) or **Storage** tab (Firefox)
3. Click on **Service Workers** in the left sidebar
4. Verify:
   - Service worker is registered for your site
   - Status shows "activated and is running"
   - No errors in the service worker status

### Step 4: Verify Notification Permission

1. Click the lock icon (🔒) in your browser's address bar
2. Check **Notifications** permission:
   - Should be set to **Allow** (not Block or Ask)
3. If blocked, click "Reset permissions" and try again

### Step 5: Check Common Issues

#### Issue: "VAPID public key is missing"
**Solution:**
- Make sure `NEXT_PUBLIC_VAPID_PUBLIC_KEY` is set in environment variables
- **Important:** The variable name must start with `NEXT_PUBLIC_` to be available on the client-side
- Restart your dev server or redeploy after adding the variable

#### Issue: "Invalid VAPID public key format"
**Solution:**
- Verify the key was copied completely (VAPID keys are very long)
- Make sure there are no extra spaces or line breaks
- Regenerate keys if needed: `node scripts/generate-vapid-keys.js`

#### Issue: "Notification permission denied"
**Solution:**
- Check browser settings for your site
- Reset notification permissions if needed
- Make sure you're on HTTPS (required for push notifications)

#### Issue: "Service worker may not be ready"
**Solution:**
- Wait a few seconds and try again
- Hard refresh the page (Ctrl+Shift+R or Cmd+Shift+R)
- Check service worker status in DevTools > Application > Service Workers

#### Issue: "Failed to save subscription" (Database error)
**Solution:**
- Check your database connection
- Verify Prisma schema includes the Notification model
- Check server logs for database errors

### Step 6: Debug with Enhanced Logging

The updated code now includes detailed logging. Check:

1. **Browser Console:**
   - Look for logs starting with "Attempting push subscription"
   - Check for "Subscription prepared for server"
   - Look for any error messages with details

2. **Server Logs (Vercel):**
   - Go to Vercel Dashboard > Your Project > Logs
   - Look for logs starting with "Received subscription request"
   - Check for any error messages

### Step 7: Test Subscription Flow

1. Open browser console
2. Clear console (optional)
3. Click "Enable Notifications"
4. Watch the console for:
   ```
   Attempting push subscription with VAPID key: { hasKey: true, keyLength: ... }
   VAPID key converted successfully
   Subscribing to push manager...
   Successfully subscribed to push notifications
   Subscription prepared for server: { hasEndpoint: true, ... }
   ```

### Quick Checklist

- [ ] VAPID keys are generated and in environment variables
- [ ] Environment variables are set with correct names (NEXT_PUBLIC_ prefix)
- [ ] Development server restarted or production redeployed
- [ ] Service worker is registered and active
- [ ] Notification permission is granted
- [ ] Using HTTPS (or localhost for development)
- [ ] Browser supports push notifications (Chrome, Firefox, Edge, Safari iOS 16.4+)

### Still Having Issues?

1. **Check the exact error message** in browser console
2. **Verify environment variables** are actually loaded:
   - In browser console, type: `console.log(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY)`
   - Should show your VAPID public key (not undefined)
3. **Test in different browser** to rule out browser-specific issues
4. **Check Vercel deployment logs** if deployed

### Environment Variable Setup Example

```bash
# Generate keys first
node scripts/generate-vapid-keys.js

# Output will be something like:
# NEXT_PUBLIC_VAPID_PUBLIC_KEY=BGKxZ...
# VAPID_PRIVATE_KEY=XyZ123...
# VAPID_EMAIL=mailto:admin@example.com

# Add to .env.local (for local dev):
NEXT_PUBLIC_VAPID_PUBLIC_KEY="BGKxZ..."
VAPID_PRIVATE_KEY="XyZ123..."
VAPID_EMAIL="mailto:admin@example.com"
```

**Remember:**
- Keys are long strings - copy them completely
- No quotes needed in .env.local file
- But in Vercel dashboard, you can use quotes or not
- Redeploy after changing environment variables in production

