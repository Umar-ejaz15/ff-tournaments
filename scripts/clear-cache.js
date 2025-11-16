#!/usr/bin/env node

/**
 * Clear Next.js build cache and node_modules cache
 * Run this script when experiencing chunk loading errors or cache issues
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🧹 Clearing Next.js cache...\n');

const projectRoot = path.resolve(__dirname, '..');
const dirsToRemove = [
  path.join(projectRoot, '.next'),
  path.join(projectRoot, 'node_modules/.cache'),
];

let cleared = 0;

dirsToRemove.forEach((dir) => {
  if (fs.existsSync(dir)) {
    try {
      console.log(`   Removing: ${path.relative(projectRoot, dir)}`);
      fs.rmSync(dir, { recursive: true, force: true });
      cleared++;
    } catch (error) {
      console.error(`   ❌ Error removing ${dir}:`, error.message);
    }
  } else {
    console.log(`   ✓ Already clean: ${path.relative(projectRoot, dir)}`);
  }
});

// Also clear npm cache if needed
try {
  console.log('\n   Clearing npm cache...');
  execSync('npm cache clean --force', { stdio: 'inherit', cwd: projectRoot });
  console.log('   ✓ npm cache cleared');
} catch (error) {
  console.warn('   ⚠ Could not clear npm cache:', error.message);
}

console.log(`\n✅ Cache clearing complete! ${cleared} directories removed.`);
console.log('\n💡 Next steps:');
console.log('   1. Run: npm run build');
console.log('   2. Or run: npm run dev');

