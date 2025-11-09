#!/usr/bin/env node

/**
 * Post-install script to ensure Prisma Client is generated
 * This is especially important for Vercel deployments
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Generating Prisma Client...');

try {
  // Generate Prisma Client
  execSync('npx prisma generate', {
    stdio: 'inherit',
    cwd: process.cwd(),
    env: { ...process.env },
  });

  // Verify that the binaries were generated
  const prismaClientPath = path.join(
    process.cwd(),
    'node_modules',
    '.prisma',
    'client'
  );

  if (fs.existsSync(prismaClientPath)) {
    console.log('✅ Prisma Client generated successfully');
    
    // Check for the specific binary (non-blocking)
    const binaryPath = path.join(
      prismaClientPath,
      'libquery_engine-rhel-openssl-3.0.x.so.node'
    );
    
    if (fs.existsSync(binaryPath)) {
      console.log('✅ Prisma Query Engine binary found');
    } else {
      // Check for any query engine binary
      const files = fs.readdirSync(prismaClientPath);
      const hasBinary = files.some(file => 
        file.includes('query_engine') || file.includes('libquery_engine')
      );
      if (hasBinary) {
        console.log('✅ Prisma Query Engine binary found (different platform)');
      } else {
        console.warn('⚠️  Prisma Query Engine binary not found');
        console.warn('   This might cause issues on Vercel. Check your binaryTargets in schema.prisma');
      }
    }
  } else {
    console.warn('⚠️  Prisma Client directory not found, but generation may have succeeded');
  }
} catch (error) {
  console.error('❌ Failed to generate Prisma Client:', error.message);
  // Don't exit with error code - let the fallback in package.json handle it
  process.exit(0);
}

