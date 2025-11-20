// Minimal ESM Prisma config fallback
try {
	// dotenv supports ESM via an import; require fallback isn't available here, so
	// use dynamic import of dotenv/config to load environment variables.
	await import('dotenv/config');
} catch (_) {}

export default { datasource: { url: process.env.DATABASE_URL } };
