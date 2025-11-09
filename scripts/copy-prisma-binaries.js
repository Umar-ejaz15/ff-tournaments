#!/usr/bin/env node

/**
 * Script to ensure Prisma binaries are accessible
 * This runs after prisma generate to verify binaries exist
 */

const fs = require('fs');
const path = require('path');

const prismaClientPath = path.join(
  process.cwd(),
  'node_modules',
  '.prisma',
  'client'
);

console.log('🔍 Checking Prisma binaries...');

if (!fs.existsSync(prismaClientPath)) {
  console.error('❌ Prisma Client directory not found!');
  console.error('   Run: npx prisma generate');
  process.exit(1);
}

// Check for binaries
const files = fs.readdirSync(prismaClientPath);
const binaries = files.filter(file => 
  file.includes('query_engine') || 
  file.includes('libquery_engine') ||
  file.includes('.so.node') ||
  file.includes('.node')
);

if (binaries.length === 0) {
  console.error('❌ No Prisma Query Engine binaries found!');
  console.error('   Expected binaries in:', prismaClientPath);
  console.error('   Files found:', files.slice(0, 10).join(', '));
  process.exit(1);
}

console.log('✅ Found Prisma binaries:');
binaries.forEach(binary => {
  const binaryPath = path.join(prismaClientPath, binary);
  const stats = fs.statSync(binaryPath);
  console.log(`   - ${binary} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
});

console.log('✅ Prisma binaries are ready for deployment');

