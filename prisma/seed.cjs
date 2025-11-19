// prisma/seed.cjs
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Safety: do not destroy data in production unless explicitly allowed
  if (process.env.NODE_ENV === 'production' && process.env.FORCE_SEED !== 'true') {
    console.log('⚠️  Running in production. Skip destructive seed. Set FORCE_SEED=true to allow.');
    return;
  }

  // Optional destructive: only when ALLOW_SEED_DESTROY=true in env or in non-production
  const allowDestroy = process.env.ALLOW_SEED_DESTROY === 'true' || process.env.NODE_ENV !== 'production';
  if (allowDestroy) {
    await prisma.user.deleteMany();
  }

  // Create admin user only if credentials provided via env to avoid hardcoded defaults
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPasswordPlain = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPasswordPlain) {
    console.log('ℹ️  No ADMIN_EMAIL / ADMIN_PASSWORD provided. Skipping admin creation.');
    console.log('🛠️  To create an admin during seed, set ADMIN_EMAIL and ADMIN_PASSWORD in your environment.');
    console.log('🎉 Seeding complete.');
    return;
  }

  const adminPassword = await bcrypt.hash(adminPasswordPlain, 10);
  await prisma.user.create({
    data: {
      name: 'Admin',
      email: adminEmail,
      password: adminPassword,
      role: 'admin',
      wallet: { create: { balance: 0 } },
    },
  });

  console.log(`✅ Admin user created: ${adminEmail} (password not printed for security)`);
  console.log('🎉 Seeding complete.');
}

main()
  .catch((err) => {
    console.error('❌ Seeding error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
