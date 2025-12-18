#!/usr/bin/env node

/**
 * Test script for minimal extension
 */

console.log('🧪 Testing Minimal Extension...\n');

const fs = require('fs');

// Check if minimal compiled file exists
if (fs.existsSync('out/extension-minimal.js')) {
    console.log('✅ Minimal extension compiled successfully');
    
    const stats = fs.statSync('out/extension-minimal.js');
    console.log(`   Size: ${stats.size} bytes`);
    console.log(`   Modified: ${stats.mtime.toISOString()}`);
} else {
    console.log('❌ Minimal extension compilation failed');
    process.exit(1);
}

// Check package.json is pointing to minimal extension
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
if (packageJson.main === './out/extension-minimal.js') {
    console.log('✅ Package.json configured for minimal extension');
} else {
    console.log('❌ Package.json not configured for minimal extension');
    console.log(`   Current main: ${packageJson.main}`);
    console.log('   Expected: ./out/extension-minimal.js');
}

console.log('\n📋 Testing Steps:');
console.log('1. Press F5 to launch Extension Development Host');
console.log('2. Look for "The New Fuse" robot icon in the Activity Bar');
console.log('3. Click the icon to see if the minimal test view appears');
console.log('4. Check Developer Console for activation messages');
console.log('5. Look for: "🚀 MINIMAL DEBUG: Starting extension activation..."');
console.log('\n✨ If you see the minimal test view, basic extension loading works!');
console.log('   This means the issue is in the full extension code, not the configuration.');
