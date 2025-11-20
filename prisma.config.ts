// Prisma config (TypeScript)
// Prisma will load this file if ts-node is available in the project.

export default {
  datasources: {
    db: {
      provider: 'postgresql',
      // Read connection string from env; ensure this is set in your environment
      url: process.env.DATABASE_URL,
    },
  },
};
