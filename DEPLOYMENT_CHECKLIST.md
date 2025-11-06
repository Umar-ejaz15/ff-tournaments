# 🚀 Production Deployment Checklist

Use this checklist to ensure your app is ready for production deployment.

## 📋 Pre-Deployment Checklist

### Database Setup
- [ ] PostgreSQL database created (Vercel Postgres, Supabase, or other)
- [ ] Database connection string obtained
- [ ] Database migrations tested locally
- [ ] `DATABASE_URL` added to Vercel environment variables

### Google OAuth Setup
- [ ] Google Cloud Console project created
- [ ] OAuth consent screen configured
- [ ] OAuth 2.0 credentials created
- [ ] Authorized JavaScript origins added:
  - [ ] `http://localhost:3000` (for local dev)
  - [ ] `https://your-production-domain.vercel.app` (for production)
- [ ] Authorized redirect URIs added:
  - [ ] `http://localhost:3000/api/auth/callback/google` (for local dev)
  - [ ] `https://your-production-domain.vercel.app/api/auth/callback/google` (for production)
- [ ] `GOOGLE_CLIENT_ID` added to Vercel environment variables
- [ ] `GOOGLE_CLIENT_SECRET` added to Vercel environment variables

### NextAuth Configuration
- [ ] `NEXTAUTH_SECRET` generated (32+ characters)
  - Generate with: `openssl rand -base64 32`
  - Or use: https://generate-secret.vercel.app/32
- [ ] `NEXTAUTH_SECRET` added to Vercel environment variables
- [ ] `NEXTAUTH_URL` set to production domain (no trailing slash)
  - Example: `https://your-app.vercel.app`
- [ ] `NEXTAUTH_URL` added to Vercel environment variables

### Code & Build
- [ ] All code changes committed to Git
- [ ] Repository pushed to GitHub/GitLab/Bitbucket
- [ ] `package.json` includes Prisma build scripts
- [ ] No TypeScript errors
- [ ] No linter errors
- [ ] Local build successful: `npm run build`

### Environment Variables in Vercel
Verify all these are set in Vercel → Settings → Environment Variables:

- [ ] `DATABASE_URL` (PostgreSQL connection string)
- [ ] `NEXTAUTH_SECRET` (32+ character random string)
- [ ] `NEXTAUTH_URL` (your production domain)
- [ ] `GOOGLE_CLIENT_ID` (from Google Console)
- [ ] `GOOGLE_CLIENT_SECRET` (from Google Console)
- [ ] `NODE_ENV` (automatically set to `production` by Vercel)

### Vercel Deployment
- [ ] Project imported/connected to Vercel
- [ ] Build settings verified (Next.js auto-detected)
- [ ] Environment variables added for Production environment
- [ ] Initial deployment triggered
- [ ] Build completed successfully
- [ ] No build errors in logs

### Post-Deployment Verification
- [ ] Production URL accessible
- [ ] Database connection working (try to sign up/login)
- [ ] Google OAuth login working
- [ ] Email/password login working
- [ ] Database migrations applied (check if tables exist)
- [ ] No console errors in browser
- [ ] No errors in Vercel function logs

### Testing
- [ ] Test user registration
- [ ] Test email/password login
- [ ] Test Google OAuth login
- [ ] Test admin routes (if applicable)
- [ ] Test user dashboard
- [ ] Test tournament features
- [ ] Test wallet/transactions (if applicable)

---

## 🔧 Quick Commands Reference

### Generate NEXTAUTH_SECRET
```bash
openssl rand -base64 32
```

### Test Database Connection
```bash
npx prisma db pull
```

### Run Migrations Locally
```bash
npx prisma migrate dev
```

### Run Migrations in Production
```bash
npx prisma migrate deploy
```

### Generate Prisma Client
```bash
npx prisma generate
```

### Test Build Locally
```bash
npm run build
```

---

## 📝 Environment Variables Template

Copy this template and fill in your values:

```env
DATABASE_URL="postgresql://user:password@host:5432/database?schema=public"
NEXTAUTH_SECRET="your-generated-secret-here"
NEXTAUTH_URL="https://your-production-domain.vercel.app"
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-your-client-secret"
```

---

## 🆘 Troubleshooting Quick Reference

| Issue | Solution |
|-------|----------|
| Build fails | Check Vercel build logs, verify all env vars are set |
| Database connection error | Verify `DATABASE_URL` is correct, check database is accessible |
| OAuth redirect error | Verify redirect URI in Google Console matches exactly |
| NextAuth errors | Check `NEXTAUTH_SECRET` and `NEXTAUTH_URL` are set correctly |
| Prisma errors | Ensure `prisma generate` runs during build |

---

## 📚 Detailed Guides

- **Full Production Setup**: See [PRODUCTION_SETUP.md](./PRODUCTION_SETUP.md)
- **Google OAuth Setup**: See [GOOGLE_OAUTH_SETUP.md](./GOOGLE_OAUTH_SETUP.md)
- **Environment Variables**: See [ENV_TEMPLATE.txt](./ENV_TEMPLATE.txt)

---

## ✅ Final Steps

Once everything is checked:

1. [ ] All checklist items completed
2. [ ] Production URL tested and working
3. [ ] All features tested in production
4. [ ] Monitor Vercel logs for any errors
5. [ ] Set up monitoring/alerts (optional)

**Your app is now ready for production! 🎉**

