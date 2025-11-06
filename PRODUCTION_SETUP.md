# Production Setup Guide

This guide will help you set up your FF Tournaments app for production deployment on Vercel.

## 📋 Prerequisites

- A Vercel account
- A PostgreSQL database (Vercel Postgres, Supabase, or any PostgreSQL provider)
- A Google Cloud Console account (for OAuth)

---

## 🗄️ Step 1: Database Setup

### Option A: Vercel Postgres (Recommended)

1. Go to your Vercel project dashboard
2. Navigate to **Storage** → **Create Database** → **Postgres**
3. Create a new Postgres database
4. Copy the `DATABASE_URL` connection string (it will be automatically added to your environment variables)

### Option B: Supabase (Free Tier Available)

1. Go to [Supabase](https://supabase.com) and create a project
2. Go to **Settings** → **Database**
3. Copy the **Connection string** under "Connection pooling" (use the `postgresql://` format)
4. This will be your `DATABASE_URL`

### Option C: Other PostgreSQL Provider

Use any PostgreSQL provider (AWS RDS, Railway, Neon, etc.) and get your connection string.

### Run Database Migrations

After setting up your database, run migrations:

```bash
# Install dependencies if not already done
npm install

# Run Prisma migrations
npx prisma migrate deploy

# (Optional) Generate Prisma Client
npx prisma generate
```

**For Vercel:** Migrations will run automatically during build if you add this to your `package.json`:

```json
{
  "scripts": {
    "postinstall": "prisma generate && prisma migrate deploy"
  }
}
```

---

## 🔐 Step 2: Google OAuth Setup

### 2.1 Create OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable **Google+ API**:
   - Go to **APIs & Services** → **Library**
   - Search for "Google+ API" and enable it
4. Create OAuth 2.0 credentials:
   - Go to **APIs & Services** → **Credentials**
   - Click **Create Credentials** → **OAuth client ID**
   - Choose **Web application**
   - Configure:
     - **Name**: FF Tournaments (or your app name)
     - **Authorized JavaScript origins**:
       - `http://localhost:3000` (for local development)
       - `https://your-production-domain.vercel.app` (for production)
     - **Authorized redirect URIs**:
       - `http://localhost:3000/api/auth/callback/google` (for local development)
       - `https://your-production-domain.vercel.app/api/auth/callback/google` (for production)
5. Copy the **Client ID** and **Client Secret**

### 2.2 Add to Environment Variables

Add these to your Vercel project:
- `GOOGLE_CLIENT_ID`: Your Google Client ID
- `GOOGLE_CLIENT_SECRET`: Your Google Client Secret

---

## 🔑 Step 3: NextAuth Configuration

### 3.1 Generate NEXTAUTH_SECRET

Generate a secure random secret (minimum 32 characters):

**Option 1: Using OpenSSL**
```bash
openssl rand -base64 32
```

**Option 2: Online Generator**
Visit: https://generate-secret.vercel.app/32

### 3.2 Set NEXTAUTH_URL

For production, set `NEXTAUTH_URL` to your production domain:
```
NEXTAUTH_URL=https://your-production-domain.vercel.app
```

**Important:** 
- For local development: `http://localhost:3000`
- For production: `https://your-actual-domain.com` (no trailing slash)

---

## ⚙️ Step 4: Vercel Environment Variables

Add all environment variables to your Vercel project:

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `NEXTAUTH_SECRET` | Random secret for NextAuth | `your-generated-secret-here` |
| `NEXTAUTH_URL` | Your production URL | `https://your-app.vercel.app` |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | `xxx.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret | `GOCSPX-xxx` |
| `NODE_ENV` | Environment (auto-set by Vercel) | `production` |

**Important:** 
- Make sure to set these for **Production**, **Preview**, and **Development** environments as needed
- After adding variables, **redeploy** your application

---

## 🚀 Step 5: Deploy to Vercel

### 5.1 Connect Repository

1. Push your code to GitHub/GitLab/Bitbucket
2. Import your repository to Vercel
3. Vercel will auto-detect Next.js

### 5.2 Configure Build Settings

Vercel should auto-detect, but verify:
- **Framework Preset**: Next.js
- **Build Command**: `npm run build` (default)
- **Output Directory**: `.next` (default)
- **Install Command**: `npm install` (default)

### 5.3 Add Build Script (Optional but Recommended)

Add this to your `package.json` to ensure Prisma runs during build:

```json
{
  "scripts": {
    "postinstall": "prisma generate",
    "build": "prisma generate && next build"
  }
}
```

### 5.4 Deploy

1. Click **Deploy**
2. Wait for the build to complete
3. Check build logs for any errors

---

## ✅ Step 6: Verify Production Setup

### 6.1 Test Database Connection

1. Visit your deployed app
2. Try to sign up or log in
3. Check Vercel function logs for any database errors

### 6.2 Test Google OAuth

1. Go to your login page
2. Click "Sign in with Google"
3. Complete the OAuth flow
4. Verify you're redirected back to your app

### 6.3 Test Credentials Login

1. Create a test account via signup
2. Log in with email/password
3. Verify session works correctly

---

## 🔧 Troubleshooting

### Database Connection Issues

**Error:** `Can't reach database server`

**Solutions:**
- Verify `DATABASE_URL` is correct in Vercel environment variables
- Check if your database allows connections from Vercel IPs
- For Supabase: Use connection pooling URL
- Ensure database is not paused (free tiers may pause)

### Google OAuth Not Working

**Error:** `redirect_uri_mismatch`

**Solutions:**
- Verify redirect URI in Google Console matches exactly: `https://your-domain.vercel.app/api/auth/callback/google`
- Check `NEXTAUTH_URL` matches your production domain
- Ensure no trailing slashes in URLs
- Wait a few minutes after updating Google Console settings

### NextAuth Errors

**Error:** `NEXTAUTH_SECRET is missing`

**Solutions:**
- Ensure `NEXTAUTH_SECRET` is set in Vercel environment variables
- Secret must be at least 32 characters
- Redeploy after adding the secret

### Build Failures

**Error:** Prisma client not generated

**Solutions:**
- Add `prisma generate` to your build script
- Check that `DATABASE_URL` is available during build
- Verify Prisma schema is valid: `npx prisma validate`

---

## 📝 Environment Variables Checklist

Before deploying, ensure you have:

- [ ] `DATABASE_URL` - PostgreSQL connection string
- [ ] `NEXTAUTH_SECRET` - Random 32+ character string
- [ ] `NEXTAUTH_URL` - Your production domain (no trailing slash)
- [ ] `GOOGLE_CLIENT_ID` - From Google Cloud Console
- [ ] `GOOGLE_CLIENT_SECRET` - From Google Cloud Console

---

## 🔄 Updating Environment Variables

After updating environment variables in Vercel:

1. Go to **Settings** → **Environment Variables**
2. Update the variable
3. Go to **Deployments**
4. Click **⋯** on the latest deployment → **Redeploy**

Or trigger a new deployment by pushing to your repository.

---

## 📚 Additional Resources

- [Vercel Postgres Documentation](https://vercel.com/docs/storage/vercel-postgres)
- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Prisma Deployment Guide](https://www.prisma.io/docs/guides/deployment)
- [Google OAuth Setup](https://developers.google.com/identity/protocols/oauth2)

---

## 🆘 Need Help?

If you encounter issues:

1. Check Vercel function logs: **Deployments** → **Functions** → **View Logs**
2. Check browser console for client-side errors
3. Verify all environment variables are set correctly
4. Ensure database migrations have run successfully

