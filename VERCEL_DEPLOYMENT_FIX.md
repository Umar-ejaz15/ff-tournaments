# Vercel Deployment Fixes

This document outlines the fixes applied to resolve Prisma Query Engine errors and Google OAuth issues on Vercel.

## 🔧 Fixes Applied

### 1. Prisma Query Engine Error Fix

**Problem:** Prisma Client could not locate the Query Engine for runtime "rhel-openssl-3.0.x" on Vercel.

**Solutions Applied:**

1. **Created `vercel.json`** - Ensures Prisma generates during build:
   ```json
   {
     "buildCommand": "prisma generate && next build",
     "installCommand": "npm install"
   }
   ```

2. **Updated `lib/prisma.ts`** - Fixed Prisma client caching for serverless environments:
   - Now caches the client in both development and production
   - Prevents connection pool exhaustion in serverless functions

3. **Updated `next.config.ts`** - Optimized for serverless:
   - Added `serverComponentsExternalPackages` for Prisma
   - Ensures proper handling of Prisma in serverless functions

4. **Verified `prisma/schema.prisma`** - Already has correct binary targets:
   ```prisma
   binaryTargets = ["native", "rhel-openssl-3.0.x"]
   ```

### 2. Google OAuth Configuration

**Current Status:** The Google OAuth setup in code is correct. Ensure the following:

1. **Google Cloud Console Configuration:**
   - Authorized JavaScript origins must include:
     - `http://localhost:3000` (for local dev)
     - `https://ff-tournaments.vercel.app` (for production)
   - Authorized redirect URIs must include:
     - `http://localhost:3000/api/auth/callback/google` (for local dev)
     - `https://ff-tournaments.vercel.app/api/auth/callback/google` (for production)

2. **Vercel Environment Variables:**
   Ensure these are set in Vercel → Settings → Environment Variables:
   - `GOOGLE_CLIENT_ID` - Your Google OAuth Client ID
   - `GOOGLE_CLIENT_SECRET` - Your Google OAuth Client Secret
   - `NEXTAUTH_URL` - Must be set to `https://ff-tournaments.vercel.app` (no trailing slash)
   - `NEXTAUTH_SECRET` - Random 32+ character string
   - `DATABASE_URL` - Your Neon PostgreSQL connection string

## 📋 Next Steps

### 1. Verify Vercel Environment Variables

Go to your Vercel project → Settings → Environment Variables and verify:

- [ ] `DATABASE_URL` is set (Neon PostgreSQL connection string)
- [ ] `NEXTAUTH_SECRET` is set (32+ characters)
- [ ] `NEXTAUTH_URL` is set to `https://ff-tournaments.vercel.app` (no trailing slash)
- [ ] `GOOGLE_CLIENT_ID` is set
- [ ] `GOOGLE_CLIENT_SECRET` is set

### 2. Update Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **Credentials**
3. Click on your OAuth 2.0 Client ID
4. Under **Authorized JavaScript origins**, ensure you have:
   - `https://ff-tournaments.vercel.app`
5. Under **Authorized redirect URIs**, ensure you have:
   - `https://ff-tournaments.vercel.app/api/auth/callback/google`
6. Click **Save**

### 3. Redeploy on Vercel

After making the changes:

1. Commit and push the changes to your repository
2. Vercel will automatically redeploy, OR
3. Manually trigger a redeploy from Vercel dashboard:
   - Go to **Deployments**
   - Click **⋯** on the latest deployment
   - Click **Redeploy**

### 4. Test the Deployment

1. **Test Prisma Connection:**
   - Try logging in with credentials
   - Check Vercel logs for any Prisma errors

2. **Test Google OAuth:**
   - Go to `https://ff-tournaments.vercel.app/auth/login`
   - Click "Sign in with Google"
   - Complete the OAuth flow
   - Verify you're redirected back correctly

## 🐛 Troubleshooting

### If Prisma errors persist:

1. **Check build logs** in Vercel to ensure `prisma generate` ran successfully
2. **Verify DATABASE_URL** is correct and accessible from Vercel
3. **Check Neon database** is not paused (free tier may pause after inactivity)
4. **Ensure connection pooling** is enabled if using Neon (use the connection pooler URL)

### If Google OAuth errors persist:

1. **Verify redirect URI** matches exactly (no trailing slashes)
2. **Check NEXTAUTH_URL** matches your production domain
3. **Wait a few minutes** after updating Google Console (changes can take time to propagate)
4. **Check browser console** for detailed error messages
5. **Verify OAuth consent screen** is configured in Google Console

## 📚 Additional Resources

- [Prisma Deployment Guide](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel)
- [NextAuth.js Vercel Deployment](https://next-auth.js.org/deployment)
- [Google OAuth Setup Guide](./GOOGLE_OAUTH_SETUP.md)
- [Production Setup Guide](./PRODUCTION_SETUP.md)

