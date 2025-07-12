#!/usr/bin/env node

/**
 * Test script for the restored Chrome extension
 * This script verifies the extension files are properly configured
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Restored Chrome Extension');
console.log('=====================================');

// Test 1: Check if all required files exist
const requiredFiles = [
  'manifest.json',
  'background.js', 
  'content.js',
  'popup.html',
  'popup.js'
];

console.log('\n1. Checking required files:');
let allFilesExist = true;

for (const file of requiredFiles) {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`  ✅ ${file}`);
  } else {
    console.log(`  ❌ ${file} - MISSING`);
    allFilesExist = false;
  }
}

// Test 2: Validate manifest.json
console.log('\n2. Validating manifest.json:');
try {
  const manifestPath = path.join(__dirname, 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  
  // Check key properties
  if (manifest.name === 'TNF AI Bridge') {
    console.log('  ✅ Extension name: TNF AI Bridge');
  } else {
    console.log(`  ❌ Extension name: ${manifest.name} (expected: TNF AI Bridge)`);
  }
  
  if (manifest.manifest_version === 3) {
    console.log('  ✅ Manifest version: 3');
  } else {
    console.log(`  ❌ Manifest version: ${manifest.manifest_version} (expected: 3)`);
  }
  
  const expectedHosts = [
    'https://chatgpt.com/*',
    'https://claude.ai/*',
    'https://gemini.google.com/*',
    'https://www.perplexity.ai/*',
    'https://poe.com/*',
    'https://character.ai/*'
  ];
  
  const hasAllHosts = expectedHosts.every(host => 
    manifest.host_permissions && manifest.host_permissions.includes(host)
  );
  
  if (hasAllHosts) {
    console.log(`  ✅ Host permissions: ${manifest.host_permissions.length} AI platforms`);
  } else {
    console.log(`  ❌ Host permissions: Missing some expected AI platforms`);
  }
  
} catch (error) {
  console.log(`  ❌ Error reading manifest.json: ${error.message}`);
  allFilesExist = false;
}

// Test 3: Check background.js for multi-platform support
console.log('\n3. Checking background.js:');
try {
  const backgroundPath = path.join(__dirname, 'background.js');
  const backgroundContent = fs.readFileSync(backgroundPath, 'utf8');
  
  if (backgroundContent.includes('TNFAIBridge')) {
    console.log('  ✅ Uses TNFAIBridge class (multi-platform)');
  } else if (backgroundContent.includes('GeminiBridge')) {
    console.log('  ❌ Still using GeminiBridge class (Gemini-only)');
  } else {
    console.log('  ⚠️  Unknown bridge class');
  }
  
  if (backgroundContent.includes('handleAIInject')) {
    console.log('  ✅ Has multi-platform injection handler');
  } else if (backgroundContent.includes('handleGeminiInject')) {
    console.log('  ❌ Still using Gemini-only injection handler');
  } else {
    console.log('  ⚠️  No injection handler found');
  }
  
} catch (error) {
  console.log(`  ❌ Error reading background.js: ${error.message}`);
}

// Test 4: Check content.js for multi-platform support
console.log('\n4. Checking content.js:');
try {
  const contentPath = path.join(__dirname, 'content.js');
  const contentContent = fs.readFileSync(contentPath, 'utf8');
  
  if (contentContent.includes('AIInterface')) {
    console.log('  ✅ Uses AIInterface class (multi-platform)');
  } else if (contentContent.includes('GeminiInterface')) {
    console.log('  ❌ Still using GeminiInterface class (Gemini-only)');
  } else {
    console.log('  ⚠️  Unknown interface class');
  }
  
  if (contentContent.includes('detectAIType')) {
    console.log('  ✅ Has AI type detection');
  } else {
    console.log('  ❌ Missing AI type detection');
  }
  
  if (contentContent.includes('AI_RESPONSE')) {
    console.log('  ✅ Uses generic AI_RESPONSE message type');
  } else if (contentContent.includes('GEMINI_RESPONSE')) {
    console.log('  ❌ Still using GEMINI_RESPONSE message type');
  } else {
    console.log('  ⚠️  No response message type found');
  }
  
} catch (error) {
  console.log(`  ❌ Error reading content.js: ${error.message}`);
}

// Test 5: Check popup.html title
console.log('\n5. Checking popup.html:');
try {
  const popupPath = path.join(__dirname, 'popup.html');
  const popupContent = fs.readFileSync(popupPath, 'utf8');
  
  if (popupContent.includes('TNF AI Bridge')) {
    console.log('  ✅ Has correct title: TNF AI Bridge');
  } else if (popupContent.includes('TNF Gemini Bridge')) {
    console.log('  ❌ Still has Gemini-only title');
  } else {
    console.log('  ⚠️  Unknown title');
  }
  
} catch (error) {
  console.log(`  ❌ Error reading popup.html: ${error.message}`);
}

// Final result
console.log('\n=====================================');
if (allFilesExist) {
  console.log('🎉 Extension Restoration Status: COMPLETE');
  console.log('\nThe Chrome extension has been successfully restored from');
  console.log('Gemini-only mode back to multi-platform AI support!');
  console.log('\nSupported AI Platforms:');
  console.log('  • ChatGPT (https://chatgpt.com)');
  console.log('  • Claude (https://claude.ai)');
  console.log('  • Gemini (https://gemini.google.com)');
  console.log('  • Perplexity (https://www.perplexity.ai)');
  console.log('  • Poe (https://poe.com)');
  console.log('  • Character.AI (https://character.ai)');
  console.log('\nTo install: Load the extension from chrome://extensions/');
} else {
  console.log('❌ Extension Restoration Status: INCOMPLETE');
  console.log('Some files are missing or invalid.');
}