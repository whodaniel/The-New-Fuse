#!/usr/bin/env node

// Manual Extension Test Script
// This script helps verify that the extension package.json and structure are correct

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing The New Fuse Extension Configuration');
console.log('================================================');

// Test 1: Check package.json exists and is valid
try {
    const packagePath = path.join(__dirname, 'package.json');
    const packageContent = fs.readFileSync(packagePath, 'utf8');
    const packageJson = JSON.parse(packageContent);
    
    console.log('✅ package.json is valid JSON');
    console.log(`📦 Extension name: ${packageJson.name}`);
    console.log(`🏷️  Display name: ${packageJson.displayName}`);
    console.log(`📝 Description: ${packageJson.description}`);
    console.log(`🔢 Version: ${packageJson.version}`);
    
    // Check activation events
    if (packageJson.activationEvents && packageJson.activationEvents.includes('*')) {
        console.log('✅ Activation events include "*" - will activate on startup');
    } else {
        console.log('⚠️  Activation events might be restrictive');
    }
    
    // Check view containers
    if (packageJson.contributes && packageJson.contributes.viewsContainers) {
        const activitybar = packageJson.contributes.viewsContainers.activitybar;
        if (activitybar && activitybar.find(vc => vc.id === 'theNewFuse')) {
            console.log('✅ Activity bar view container "theNewFuse" configured');
            console.log(`🤖 Icon: ${activitybar.find(vc => vc.id === 'theNewFuse').icon}`);
        } else {
            console.log('❌ Activity bar view container "theNewFuse" NOT found');
        }
    }
    
    // Check views
    if (packageJson.contributes && packageJson.contributes.views && packageJson.contributes.views.theNewFuse) {
        const views = packageJson.contributes.views.theNewFuse;
        console.log(`✅ Found ${views.length} views in theNewFuse container:`);
        views.forEach(view => {
            console.log(`   - ${view.id}: ${view.name} (type: ${view.type})`);
        });
    }
    
    // Check commands
    if (packageJson.contributes && packageJson.contributes.commands) {
        console.log(`✅ Found ${packageJson.contributes.commands.length} commands`);
    }
    
} catch (error) {
    console.log('❌ Error reading package.json:', error.message);
    process.exit(1);
}

// Test 2: Check main entry point exists
try {
    const mainPath = path.join(__dirname, 'out', 'extension.js');
    if (fs.existsSync(mainPath)) {
        console.log('✅ Main entry point exists: out/extension.js');
    } else {
        console.log('❌ Main entry point missing: out/extension.js');
        console.log('   Run "pnpm run compile" to build the extension');
    }
} catch (error) {
    console.log('❌ Error checking main entry point:', error.message);
}

// Test 3: Check view providers exist
const viewProviders = [
    'ChatViewProvider.js',
    'CommunicationHubProvider.js', 
    'DashboardProvider.js',
    'SettingsViewProvider.js',
    'TabbedContainerProvider.js'
];

let allViewsExist = true;
viewProviders.forEach(provider => {
    const viewPath = path.join(__dirname, 'out', 'views', provider);
    if (fs.existsSync(viewPath)) {
        console.log(`✅ View provider exists: ${provider}`);
    } else {
        console.log(`❌ View provider missing: ${provider}`);
        allViewsExist = false;
    }
});

if (allViewsExist) {
    console.log('✅ All view providers are compiled');
} else {
    console.log('⚠️  Some view providers are missing');
}

console.log('\n🎯 Test Complete!');
console.log('\n📋 Next Steps:');
console.log('1. Press F5 in VS Code to launch Extension Development Host');
console.log('2. In the new window, look for "The New Fuse" robot icon in Activity Bar');
console.log('3. Click the icon to open the extension sidebar');
console.log('4. Check Developer Console (Help > Toggle Developer Tools) for any errors');
