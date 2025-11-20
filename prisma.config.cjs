// Minimal Prisma config (CommonJS .cjs)
// Load local `.env` so `DATABASE_URL` is available during `prisma generate`.
try {
  require('dotenv').config();
} catch (_) {}

module.exports = {
  datasource: {
    url: process.env.DATABASE_URL,
  },
};
// Prisma config file for Prisma v7+ environments (CommonJS)
// This provides the datasource URL for the CLI (migrate/generate) and local dev.
// The CLI will load this file when running `prisma` commands.

module.exports = {
  datasources: {
    db: {
      provider: 'postgresql',
      // Read connection string from env; ensure this is set in your environment
      url: process.env.DATABASE_URL,
    },
  },
};
