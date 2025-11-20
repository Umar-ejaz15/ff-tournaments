// Minimal Prisma config (CommonJS .cjs)
// Load local `.env` so `DATABASE_URL` is available during `prisma generate`.
try {
  require('dotenv').config();
} catch (_) {}

module.exports = {
  datasource: {
    provider: 'postgres',
    url: process.env.DATABASE_URL,
  },
};
