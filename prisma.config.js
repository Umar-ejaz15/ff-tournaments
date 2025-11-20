// Minimal CommonJS Prisma config fallback
try {
	require('dotenv').config();
} catch (_) {}

module.exports = { datasource: { url: process.env.DATABASE_URL } };
