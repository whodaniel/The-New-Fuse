#!/usr/bin/env node

/**
 * Debug script to help diagnose extension activation issues
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Debugging The New Fuse Extension Activation...\n');

// Check package.json structure in detail
console.log('📋 Package.json Analysis:');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

console.log(`Name: ${packageJson.name}`);
console.log(`Display Name: ${packageJson.displayName}`);
console.log(`Main: ${packageJson.main}`);
console.log(`Activation Events: ${packageJson.activationEvents.join(', ')}`);

// Check view container structure
if (packageJson.contributes.viewsContainers) {
    console.log('\n🎯 View Containers:');
    if (packageJson.contributes.viewsContainers.activitybar) {
        packageJson.contributes.viewsContainers.activitybar.forEach((container, index) => {
            console.log(`  [${index}] ID: ${container.id}`);
            console.log(`      Title: ${container.title}`);
            console.log(`      Icon: ${container.icon}`);
        });
    }
}

// Check views structure
if (packageJson.contributes.views) {
    console.log('\n👁️ Views:');
    Object.keys(packageJson.contributes.views).forEach(containerKey => {
        console.log(`  Container: ${containerKey}`);
        packageJson.contributes.views[containerKey].forEach((view, index) => {
            console.log(`    [${index}] ID: ${view.id}`);
            console.log(`        Name: ${view.name}`);
            console.log(`        Type: ${view.type}`);
            console.log(`        When: ${view.when || 'always'}`);
        });
    });
}

// Check commands
if (packageJson.contributes.commands) {
    console.log('\n⚡ Commands:');
    packageJson.contributes.commands.forEach((command, index) => {
        console.log(`  [${index}] Command: ${command.command}`);
        console.log(`      Title: ${command.title}`);
    });
}

// Verify critical files
console.log('\n📁 File Verification:');
const criticalFiles = [
    'out/extension.js',
    'src/extension.ts',
    'src/views/TabbedContainerProvider.ts',
    'media/tabbed-container.js',
    'media/tabbed-container.css'
];

criticalFiles.forEach(file => {
    if (fs.existsSync(file)) {
        const stats = fs.statSync(file);
        console.log(`  ✅ ${file} (${stats.size} bytes, modified: ${stats.mtime.toISOString()})`);
    } else {
        console.log(`  ❌ ${file} - MISSING`);
    }
});

// Check for potential issues
console.log('\n🚨 Potential Issues Check:');

// Check if view container ID matches view container reference
const viewContainerIds = packageJson.contributes.viewsContainers?.activitybar?.map(c => c.id) || [];
const viewContainerReferences = Object.keys(packageJson.contributes.views || {});

console.log(`View Container IDs: ${viewContainerIds.join(', ')}`);
console.log(`View Container References: ${viewContainerReferences.join(', ')}`);

const missingReferences = viewContainerIds.filter(id => !viewContainerReferences.includes(id));
const orphanReferences = viewContainerReferences.filter(ref => !viewContainerIds.includes(ref));

if (missingReferences.length > 0) {
    console.log(`❌ Missing view references for containers: ${missingReferences.join(', ')}`);
}

if (orphanReferences.length > 0) {
    console.log(`❌ Orphan view references (no matching container): ${orphanReferences.join(', ')}`);
}

if (missingReferences.length === 0 && orphanReferences.length === 0) {
    console.log('✅ View container and view references match correctly');
}

// Check activation events
if (packageJson.activationEvents.includes('*')) {
    console.log('✅ Extension should activate on VS Code startup');
} else {
    console.log('⚠️ Extension activation might be delayed - not using "*" activation event');
}

console.log('\n🔧 Debug Steps:');
console.log('1. Press F5 to start Extension Development Host');
console.log('2. Open Developer Tools in Extension Host (Help > Toggle Developer Tools)');
console.log('3. Check Console tab for activation messages and errors');
console.log('4. Look for "The New Fuse extension is being activated" message');
console.log('5. Check if any errors occur during view registration');
console.log('6. Verify that the robot icon appears in the Activity Bar');

console.log('\n💡 Troubleshooting Tips:');
console.log('- If no activation message appears, check for syntax errors in TypeScript compilation');
console.log('- If activation succeeds but no UI appears, check WebView registration');
console.log('- If icon is missing, verify built-in icon syntax: $(robot)');
console.log('- Check VS Code Extension Host logs for detailed error messages');
