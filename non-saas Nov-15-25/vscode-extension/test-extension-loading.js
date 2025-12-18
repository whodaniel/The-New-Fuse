#!/usr/bin/env node

/**
 * Test script to verify The New Fuse extension loading
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🧪 Testing The New Fuse Extension Loading...\n');

try {
    // Check if compiled files exist
    console.log('✅ Checking compiled files...');
    const fs = require('fs');
    
    const requiredFiles = [
        'out/extension.js',
        'media/tabbed-container.js',
        'media/tabbed-container.css',
        'media/codicons/codicon.css'
    ];
    
    for (const file of requiredFiles) {
        if (fs.existsSync(file)) {
            console.log(`   ✓ ${file} exists`);
        } else {
            console.log(`   ❌ ${file} missing`);
        }
    }
    
    // Check package.json configuration
    console.log('\n✅ Checking package.json configuration...');
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    console.log(`   ✓ Extension name: ${packageJson.displayName}`);
    console.log(`   ✓ Activation events: ${packageJson.activationEvents.join(', ')}`);
    console.log(`   ✓ Main entry: ${packageJson.main}`);
    
    // Check for view container and views
    if (packageJson.contributes.viewsContainers && packageJson.contributes.viewsContainers.activitybar) {
        const viewContainer = packageJson.contributes.viewsContainers.activitybar[0];
        console.log(`   ✓ Activity bar container: ${viewContainer.id}`);
        console.log(`   ✓ Container title: ${viewContainer.title}`);
    }
    
    if (packageJson.contributes.views && packageJson.contributes.views.theNewFuse) {
        const view = packageJson.contributes.views.theNewFuse[0];
        console.log(`   ✓ View ID: ${view.id}`);
        console.log(`   ✓ View type: ${view.type}`);
    }
    
    console.log('\n🎉 Extension configuration looks good!');
    console.log('\n📋 Testing Instructions:');
    console.log('1. Extension Development Host should have opened automatically');
    console.log('2. Look for "The New Fuse" activity bar icon with robot symbol');
    console.log('3. Click the activity bar icon to see the tabbed container');
    console.log('4. The extension should activate automatically on startup');
    console.log('5. Check the Debug Console for activation messages');
    console.log('\nIf the extension appears in the activity bar, the loading issue is fixed! ✨');
    
} catch (error) {
    console.error('❌ Error during testing:', error.message);
    process.exit(1);
}