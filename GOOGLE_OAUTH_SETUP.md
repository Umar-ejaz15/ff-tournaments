# Google OAuth Setup Guide

Step-by-step guide to configure Google OAuth for your FF Tournaments app.

## 📋 Prerequisites

- A Google account
- Access to [Google Cloud Console](https://console.cloud.google.com/)

---

## 🔧 Step-by-Step Setup

### Step 1: Create or Select a Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click the project dropdown at the top
3. Click **New Project** (or select an existing one)
4. Enter project name: `FF Tournaments` (or your preferred name)
5. Click **Create**

### Step 2: Configure OAuth Consent Screen

1. In the left sidebar, go to **APIs & Services** → **OAuth consent screen**
2. Select **External** (unless you have a Google Workspace)
3. Click **Create**
4. Fill in the required information:
   - **App name**: `FF Tournaments` (or your app name)
   - **User support email**: Your email
   - **Developer contact information**: Your email
5. Click **Save and Continue**
6. On **Scopes** page, click **Save and Continue** (no scopes needed for basic OAuth)
7. On **Test users** page, click **Save and Continue** (skip for now)
8. Review and click **Back to Dashboard**

### Step 3: Create OAuth 2.0 Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **+ Create Credentials** → **OAuth client ID**
3. If prompted, configure the consent screen (you already did this in Step 2)
4. Select **Web application** as the application type
5. Fill in the details:

   **Name**: `FF Tournaments Web Client` (or any name)

   **Authorized JavaScript origins**:
   ```
   http://localhost:3000
   https://your-production-domain.vercel.app
   ```
   *(Replace `your-production-domain.vercel.app` with your actual Vercel domain)*

   **Authorized redirect URIs**:
   ```
   http://localhost:3000/api/auth/callback/google
   https://your-production-domain.vercel.app/api/auth/callback/google
   ```
   *(Replace `your-production-domain.vercel.app` with your actual Vercel domain)*

6. Click **Create**

### Step 4: Copy Your Credentials

After creating, you'll see a popup with:
- **Your Client ID**: `xxxxx.apps.googleusercontent.com`
- **Your Client Secret**: `GOCSPX-xxxxx`

**Important:** Copy these immediately - you won't be able to see the secret again!

### Step 5: Add to Environment Variables

Add these to your `.env` file for local development:

```env
GOOGLE_CLIENT_ID="xxxxx.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-xxxxx"
```

And add them to Vercel environment variables for production:
1. Go to your Vercel project → **Settings** → **Environment Variables**
2. Add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
3. Redeploy your application

---

## 🔄 Adding Additional Domains

If you need to add more domains (staging, preview, etc.):

1. Go to **APIs & Services** → **Credentials**
2. Click on your OAuth 2.0 Client ID
3. Under **Authorized JavaScript origins**, click **+ Add URI**
4. Add your new domain: `https://your-new-domain.com`
5. Under **Authorized redirect URIs**, click **+ Add URI**
6. Add: `https://your-new-domain.com/api/auth/callback/google`
7. Click **Save**

---

## ✅ Testing

### Local Testing

1. Start your dev server: `npm run dev`
2. Go to `http://localhost:3000/auth/login`
3. Click "Sign in with Google"
4. Complete the OAuth flow
5. You should be redirected back to your app

### Production Testing

1. Deploy to Vercel
2. Visit your production URL: `https://your-domain.vercel.app/auth/login`
3. Click "Sign in with Google"
4. Complete the OAuth flow
5. Verify you're redirected back correctly

---

## 🚨 Common Issues

### Issue: "redirect_uri_mismatch" Error

**Cause:** The redirect URI in your request doesn't match what's configured in Google Console.

**Solution:**
- Verify the redirect URI in Google Console matches exactly: `https://your-domain.com/api/auth/callback/google`
- Check `NEXTAUTH_URL` environment variable matches your domain
- Ensure no trailing slashes in URLs
- Wait a few minutes after updating Google Console (changes can take time to propagate)

### Issue: "Error 400: invalid_client"

**Cause:** Client ID or Client Secret is incorrect.

**Solution:**
- Double-check `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in your environment variables
- Ensure there are no extra spaces or quotes
- Verify you're using the correct credentials for the right environment

### Issue: OAuth Consent Screen Not Configured

**Cause:** OAuth consent screen wasn't set up properly.

**Solution:**
- Go back to **OAuth consent screen** in Google Console
- Complete all required fields
- Make sure you've saved all steps

### Issue: "Access blocked: This app's request is invalid"

**Cause:** App is in testing mode and user is not added as a test user.

**Solution:**
- Go to **OAuth consent screen** → **Test users**
- Add the email addresses that should be able to sign in
- Or publish your app (requires verification if using sensitive scopes)

---

## 🔒 Security Best Practices

1. **Never commit credentials to Git**
   - Keep `.env` in `.gitignore`
   - Use environment variables in production

2. **Use different credentials for dev/prod**
   - Create separate OAuth clients for development and production
   - Or use the same client but ensure redirect URIs include both

3. **Rotate secrets regularly**
   - If a secret is compromised, create a new OAuth client
   - Update environment variables immediately

4. **Limit redirect URIs**
   - Only add domains you actually use
   - Remove old/unused domains

---

## 📚 Additional Resources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [NextAuth.js Google Provider](https://next-auth.js.org/providers/google)
- [Google Cloud Console](https://console.cloud.google.com/)

---

## 🆘 Need Help?

If you're still having issues:

1. Check Google Cloud Console for any error messages
2. Verify all environment variables are set correctly
3. Check browser console and network tab for detailed errors
4. Review NextAuth logs in your application

