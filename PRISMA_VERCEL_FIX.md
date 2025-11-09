# 🔧 Complete Prisma Vercel Fix Guide

## ❌ The Problem

You're seeing this error on Vercel:
```
Prisma Client could not locate the Query Engine for runtime "rhel-openssl-3.0.x"
```

This happens because Vercel's serverless functions don't automatically include Prisma's native binaries.

## ✅ The Solution

I've implemented a comprehensive fix with multiple layers of protection:

### 1. Updated Configuration Files

**`next.config.ts`** - Explicitly includes Prisma binaries in the output:
```typescript
outputFileTracingIncludes: {
  "/api/**": [
    "./node_modules/.prisma/client/libquery_engine-rhel-openssl-3.0.x.so.node",
    "./node_modules/.prisma/client/**/*",
    "./node_modules/@prisma/client/**/*",
  ],
}
```

**`vercel.json`** - Uses custom build command:
```json
{
  "buildCommand": "npm run vercel-build"
}
```

**`package.json`** - Added `vercel-build` script:
```json
{
  "scripts": {
    "vercel-build": "prisma generate && prisma migrate deploy && next build"
  }
}
```

**`prisma/schema.prisma`** - Already configured correctly:
```prisma
generator client {
  provider = "prisma-client-js"
  binaryTargets = ["native", "rhel-openssl-3.0.x"]
}
```

### 2. Post-Install Script

Created `scripts/postinstall-prisma.js` to ensure Prisma generates during install.

## 🚀 Deployment Steps

### Step 1: Commit All Changes

```bash
git add .
git commit -m "Fix Prisma Query Engine for Vercel deployment"
git push
```

### Step 2: Verify Vercel Environment Variables

Go to Vercel → Settings → Environment Variables and ensure:

- ✅ `DATABASE_URL` is set (your Neon/PostgreSQL connection string)
- ✅ `NEXTAUTH_SECRET` is set (32+ characters)
- ✅ `NEXTAUTH_URL` is set to `https://ff-tournaments.vercel.app` (no trailing slash)
- ✅ `GOOGLE_CLIENT_ID` is set
- ✅ `GOOGLE_CLIENT_SECRET` is set

### Step 3: Check Vercel Build Settings

1. Go to Vercel → Settings → General
2. Verify:
   - **Build Command**: Should be `npm run vercel-build` (or leave empty to use vercel.json)
   - **Output Directory**: `.next` (default)
   - **Install Command**: `npm install` (default)

### Step 4: Redeploy

**Option A: Automatic (Recommended)**
- Push your changes to GitHub
- Vercel will automatically redeploy

**Option B: Manual**
1. Go to Vercel → Deployments
2. Click **⋯** on the latest deployment
3. Click **Redeploy**

### Step 5: Monitor Build Logs

During deployment, check the build logs in Vercel:

1. Go to **Deployments** → Click on the deployment
2. Check the **Build Logs** tab
3. Look for:
   - ✅ `prisma generate` running successfully
   - ✅ `Prisma Client generated successfully`
   - ✅ No errors about missing binaries

## 🔍 Troubleshooting

### If the error persists after redeploy:

#### 1. Check Build Logs

Look for these in the build logs:
```
✅ Generating Prisma Client...
✅ Prisma Client generated successfully
✅ Prisma Query Engine binary found
```

If you see errors, note them down.

#### 2. Verify Prisma Generation

The build logs should show:
```
> prisma generate
```

If it's not running, check:
- `vercel.json` has `"buildCommand": "npm run vercel-build"`
- `package.json` has the `vercel-build` script

#### 3. Check Binary Targets

Verify `prisma/schema.prisma` has:
```prisma
binaryTargets = ["native", "rhel-openssl-3.0.x"]
```

#### 4. Try Alternative Binary Target

If `rhel-openssl-3.0.x` doesn't work, try:
```prisma
binaryTargets = ["native", "linux-musl-openssl-3.0.x"]
```

Then:
1. Update `next.config.ts` to reference the new binary:
   ```typescript
   "./node_modules/.prisma/client/libquery_engine-linux-musl-openssl-3.0.x.so.node"
   ```
2. Regenerate: `npx prisma generate`
3. Commit and redeploy

#### 5. Clear Vercel Cache

1. Go to Vercel → Settings → General
2. Scroll to **Danger Zone**
3. Click **Clear Build Cache**
4. Redeploy

#### 6. Check Node.js Version

Vercel should use Node.js 18+ by default. Verify in:
- Vercel → Settings → General → Node.js Version

#### 7. Manual Binary Check

If you have access to the Vercel build environment, you can check if binaries exist:

```bash
ls -la node_modules/.prisma/client/
```

You should see files like:
- `libquery_engine-rhel-openssl-3.0.x.so.node`
- `query-engine-rhel-openssl-3.0.x`
- Other Prisma files

## 📋 Verification Checklist

After redeploying, verify:

- [ ] Build completes successfully
- [ ] No Prisma errors in build logs
- [ ] Can access the app at `https://ff-tournaments.vercel.app`
- [ ] Can sign up with credentials (tests Prisma connection)
- [ ] Can sign in with Google OAuth (tests Prisma connection)
- [ ] No Prisma errors in Vercel function logs

## 🆘 Still Having Issues?

If the problem persists:

1. **Check Vercel Function Logs:**
   - Go to Vercel → Deployments → Click deployment → Functions tab
   - Look for runtime errors

2. **Try a Fresh Deployment:**
   - Delete `.next` folder locally (if exists)
   - Delete `node_modules/.prisma` folder locally
   - Run `npm install` locally
   - Run `npx prisma generate` locally
   - Verify binaries exist: `ls node_modules/.prisma/client/`
   - Commit and push

3. **Contact Support:**
   - Vercel Support: https://vercel.com/support
   - Prisma Discord: https://pris.ly/discord

## 📚 Additional Resources

- [Prisma Vercel Deployment Guide](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel)
- [Next.js Output File Tracing](https://nextjs.org/docs/app/api-reference/next-config-js/output#caveats)
- [Vercel Build Configuration](https://vercel.com/docs/build-step)

