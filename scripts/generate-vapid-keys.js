/**
 * Script to generate VAPID keys for push notifications
 * Run: node scripts/generate-vapid-keys.js
 */

const webpush = require('web-push');

console.log('Generating VAPID keys...\n');

const vapidKeys = webpush.generateVAPIDKeys();

console.log('✅ VAPID Keys Generated!\n');
console.log('Add these to your .env.local file:\n');
console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
console.log(`VAPID_EMAIL=mailto:your-email@example.com\n`);
console.log('⚠️  Keep the private key SECRET! Never commit it to git.\n');

