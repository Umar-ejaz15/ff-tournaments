# ZP Battle Zone

A tournament management platform (ZP Battle Zone) built with Next.js, NextAuth, Prisma, and PostgreSQL.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- npm, yarn, pnpm, or bun

### Installation

1. Clone the repository
```bash
git clone <your-repo-url>
cd zp-battle-zone
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables

Create a `.env` file in the root directory with the following variables:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/ff_tournaments?schema=public"

# NextAuth
NEXTAUTH_SECRET="your-secret-key-here-minimum-32-characters"
NEXTAUTH_URL="http://localhost:3000"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Node Environment
NODE_ENV="development"
```

4. Set up the database
```bash
# Run migrations
npx prisma migrate dev

# (Optional) Seed the database
npm run prisma:seed
```

5. Run the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## 📦 Production Deployment

**For detailed production setup instructions, see [PRODUCTION_SETUP.md](./PRODUCTION_SETUP.md)**

### Quick Production Checklist

- [ ] Set up PostgreSQL database (Vercel Postgres, Supabase, etc.)
- [ ] Configure Google OAuth credentials
- [ ] Generate `NEXTAUTH_SECRET` (32+ characters)
- [ ] Set `NEXTAUTH_URL` to your production domain
- [ ] Add all environment variables to Vercel
- [ ] Run database migrations: `npx prisma migrate deploy`
- [ ] Deploy to Vercel

### Required Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Random secret for NextAuth (min 32 chars) |
| `NEXTAUTH_URL` | Your production URL |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret |

## 🛠️ Tech Stack

- **Framework:** Next.js 16
- **Authentication:** NextAuth.js
- **Database:** PostgreSQL with Prisma ORM
- **Styling:** Tailwind CSS
- **UI Components:** Radix UI

## 📚 Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Vercel Deployment Guide](https://vercel.com/docs)

## 📝 License

This project is private and proprietary.
