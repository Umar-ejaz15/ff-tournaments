# 🔧 Fix Google OAuth redirect_uri_mismatch Error

## ❌ Error Message
```
Error 400: redirect_uri_mismatch
You can't sign in because FF Tournaments sent an invalid request.
```

## 🔍 What This Means

The redirect URI that NextAuth is sending to Google doesn't match what's configured in your Google Cloud Console. They must match **exactly**.

## ✅ Step-by-Step Fix

### Step 1: Find Your Actual Redirect URI

NextAuth automatically constructs the redirect URI as:
```
${NEXTAUTH_URL}/api/auth/callback/google
```

**Check your Vercel environment variables:**
1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Find `NEXTAUTH_URL` and note its value

**Example:** If `NEXTAUTH_URL` is `https://ff-tournaments.vercel.app`, then your redirect URI should be:
```
https://ff-tournaments.vercel.app/api/auth/callback/google
```

### Step 2: Update Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to **APIs & Services** → **Credentials**
4. Click on your **OAuth 2.0 Client ID** (the one you're using for FF Tournaments)
5. Scroll down to **Authorized redirect URIs**

### Step 3: Add/Update Redirect URI

**IMPORTANT:** The redirect URI must match **exactly** (case-sensitive, no trailing slashes):

1. Under **Authorized redirect URIs**, click **+ ADD URI**
2. Add your redirect URI:
   ```
   https://ff-tournaments.vercel.app/api/auth/callback/google
   ```
   ⚠️ **Make sure:**
   - Uses `https://` (not `http://`)
   - No trailing slash at the end
   - Matches your `NEXTAUTH_URL` exactly
   - Includes `/api/auth/callback/google` path

3. Also add your **Authorized JavaScript origins**:
   ```
   https://ff-tournaments.vercel.app
   ```
   ⚠️ **Make sure:**
   - Uses `https://` (not `http://`)
   - No trailing slash
   - No path (just the domain)

4. Click **SAVE**

### Step 4: Verify NEXTAUTH_URL in Vercel

1. Go to Vercel → **Settings** → **Environment Variables**
2. Check `NEXTAUTH_URL`:
   - ✅ Should be: `https://ff-tournaments.vercel.app`
   - ❌ Should NOT have trailing slash: `https://ff-tournaments.vercel.app/`
   - ❌ Should NOT be: `http://ff-tournaments.vercel.app` (must be https)

3. If it's incorrect, update it:
   - Click on `NEXTAUTH_URL`
   - Update the value to: `https://ff-tournaments.vercel.app`
   - Make sure it's set for **Production** environment
   - Click **Save**

### Step 5: Wait and Redeploy

1. **Wait 2-5 minutes** after updating Google Console (changes can take time to propagate)
2. **Redeploy on Vercel:**
   - Go to **Deployments**
   - Click **⋯** on the latest deployment
   - Click **Redeploy**
   - OR push a new commit to trigger redeploy

### Step 6: Test

1. Go to `https://ff-tournaments.vercel.app/auth/login`
2. Click "Sign in with Google"
3. Complete the OAuth flow
4. You should be redirected back successfully

## 🔍 Troubleshooting

### Still Getting the Error?

1. **Double-check the exact redirect URI:**
   - Check what NextAuth is sending by looking at the error URL
   - The error page usually shows the redirect URI that was attempted
   - Compare it character-by-character with what's in Google Console

2. **Check for multiple OAuth clients:**
   - Make sure you're using the correct Client ID
   - Verify `GOOGLE_CLIENT_ID` in Vercel matches the one in Google Console

3. **Verify environment variables are set for Production:**
   - In Vercel, when adding environment variables, make sure to select **Production** (not just Preview/Development)
   - Or select **All Environments**

4. **Check for typos:**
   - Common mistakes:
     - `vercel.app` vs `vercel.com`
     - `http://` vs `https://`
     - Trailing slashes
     - Extra spaces

5. **Clear browser cache:**
   - Sometimes cached OAuth responses can cause issues
   - Try incognito/private browsing mode

6. **Check Google Console for errors:**
   - Go to Google Cloud Console → **APIs & Services** → **OAuth consent screen**
   - Make sure the consent screen is published (not just in testing mode)
   - If in testing mode, add your email as a test user

## 📋 Quick Checklist

Before testing, verify:

- [ ] `NEXTAUTH_URL` in Vercel = `https://ff-tournaments.vercel.app` (no trailing slash)
- [ ] Google Console redirect URI = `https://ff-tournaments.vercel.app/api/auth/callback/google` (exact match)
- [ ] Google Console JavaScript origin = `https://ff-tournaments.vercel.app` (no trailing slash)
- [ ] `GOOGLE_CLIENT_ID` in Vercel matches Google Console
- [ ] `GOOGLE_CLIENT_SECRET` in Vercel matches Google Console
- [ ] Waited 2-5 minutes after updating Google Console
- [ ] Redeployed on Vercel after making changes

## 🆘 Still Having Issues?

If the error persists after following all steps:

1. **Check Vercel logs:**
   - Go to Vercel → **Deployments** → Click on latest deployment → **Functions** tab
   - Look for any errors related to NextAuth or OAuth

2. **Verify the actual redirect URI being used:**
   - The error page URL usually contains the redirect URI that was attempted
   - Copy it exactly and add it to Google Console

3. **Try creating a new OAuth client:**
   - Sometimes it's easier to create a fresh OAuth client
   - Update `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in Vercel
   - Redeploy

## 📚 Additional Resources

- [NextAuth.js OAuth Configuration](https://next-auth.js.org/configuration/providers/oauth)
- [Google OAuth Setup Guide](./GOOGLE_OAUTH_SETUP.md)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

