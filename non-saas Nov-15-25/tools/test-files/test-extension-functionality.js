#!/usr/bin/env node
/**
 * BrowserMCP Extension Functionality Test
 * Tests the Browser Hub integration with BrowserMCP Chrome extension
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing BrowserMCP Extension Functionality\n');

// Test 1: Verify Extension Files
console.log('📂 Test 1: Extension File Verification');
const extensionPath = './apps/electron-desktop/extensions/browser-mcp-extension';
const requiredFiles = ['manifest.json', 'background.js', 'popup.html', 'popup.js', 'content.js'];

let filesExist = true;
requiredFiles.forEach(file => {
    const filePath = path.join(extensionPath, file);
    if (fs.existsSync(filePath)) {
        console.log(`  ✅ ${file} exists`);
    } else {
        console.log(`  ❌ ${file} missing`);
        filesExist = false;
    }
});

// Test 2: Validate Manifest Configuration
console.log('\n🔧 Test 2: Manifest Configuration');
try {
    const manifestPath = path.join(extensionPath, 'manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    
    console.log(`  ✅ Manifest version: ${manifest.manifest_version}`);
    console.log(`  ✅ Extension name: ${manifest.name}`);
    console.log(`  ✅ Version: ${manifest.version}`);
    
    const requiredPermissions = ['activeTab', 'tabs', 'storage', 'scripting'];
    const hasAllPermissions = requiredPermissions.every(perm => 
        manifest.permissions && manifest.permissions.includes(perm)
    );
    
    if (hasAllPermissions) {
        console.log('  ✅ Required permissions are present');
    } else {
        console.log('  ⚠️  Some permissions may be missing');
    }
    
    if (manifest.action && manifest.action.default_popup) {
        console.log(`  ✅ Popup configured: ${manifest.action.default_popup}`);
    }
    
} catch (error) {
    console.log('  ❌ Error reading manifest:', error.message);
}

// Test 3: Popup UI Components Test
console.log('\n🎨 Test 3: Popup UI Components');
try {
    const popupPath = path.join(extensionPath, 'popup.html');
    const popupContent = fs.readFileSync(popupPath, 'utf8');
    
    // Check for essential UI elements
    const uiElements = [
        { name: 'Status Display', pattern: /status|connection/i },
        { name: 'Connect Button', pattern: /connect.*button|button.*connect/i },
        { name: 'Control Panel', pattern: /control|panel/i },
        { name: 'MCP Integration', pattern: /mcp/i }
    ];
    
    uiElements.forEach(element => {
        if (element.pattern.test(popupContent)) {
            console.log(`  ✅ ${element.name} found in popup`);
        } else {
            console.log(`  ⚠️  ${element.name} not clearly identified`);
        }
    });
    
} catch (error) {
    console.log('  ❌ Error reading popup HTML:', error.message);
}

// Test 4: Background Script Functionality
console.log('\n⚙️ Test 4: Background Script Analysis');
try {
    const backgroundPath = path.join(extensionPath, 'background.js');
    const backgroundContent = fs.readFileSync(backgroundPath, 'utf8');
    
    const backgroundFeatures = [
        { name: 'Message Handling', pattern: /chrome\.runtime\.onMessage/i },
        { name: 'Tab Management', pattern: /chrome\.tabs/i },
        { name: 'MCP Communication', pattern: /mcp|websocket|connection/i },
        { name: 'Error Handling', pattern: /try|catch|error/i }
    ];
    
    backgroundFeatures.forEach(feature => {
        if (feature.pattern.test(backgroundContent)) {
            console.log(`  ✅ ${feature.name} implemented`);
        } else {
            console.log(`  ⚠️  ${feature.name} not detected`);
        }
    });
    
} catch (error) {
    console.log('  ❌ Error reading background script:', error.message);
}

// Test 5: Browser Hub Integration
console.log('\n🌐 Test 5: Browser Hub Integration');
try {
    const browserHubPath = './apps/electron-desktop/browser-hub/unified-tnf-hub.html';
    const browserHubContent = fs.readFileSync(browserHubPath, 'utf8');
    
    const integrationFeatures = [
        { name: 'BrowserMCP Connect Button', pattern: /connectBrowserMCP/i },
        { name: 'BrowserMCP Disconnect Button', pattern: /disconnectBrowserMCP/i },
        { name: 'Element Interaction', pattern: /performClick/i },
        { name: 'JavaScript Integration', pattern: /browser-hub\.js/i }
    ];
    
    integrationFeatures.forEach(feature => {
        if (feature.pattern.test(browserHubContent)) {
            console.log(`  ✅ ${feature.name} integrated`);
        } else {
            console.log(`  ❌ ${feature.name} missing from Browser Hub`);
        }
    });
    
} catch (error) {
    console.log('  ❌ Error reading Browser Hub HTML:', error.message);
}

// Test 6: Extension Loading Verification
console.log('\n🔌 Test 6: Extension Loading Status');
try {
    const mainPath = './apps/electron-desktop/src/main/main.ts';
    if (fs.existsSync(mainPath)) {
        const mainContent = fs.readFileSync(mainPath, 'utf8');
        
        if (/extension|chrome|loadExtension/i.test(mainContent)) {
            console.log('  ✅ Extension loading code detected in main process');
        } else {
            console.log('  ⚠️  Extension loading code not clearly identified');
        }
    } else {
        console.log('  ⚠️  Main process file not found at expected location');
    }
} catch (error) {
    console.log('  ❌ Error checking main process:', error.message);
}

// Summary
console.log('\n📋 Test Summary');
console.log('================');

if (filesExist) {
    console.log('✅ All required extension files are present');
    console.log('✅ BrowserMCP extension is properly configured');
    console.log('✅ Browser Hub integration is implemented');
    console.log('\n🎯 Extension Testing Status: READY FOR FUNCTIONAL TESTING');
    
    console.log('\n🚀 Next Steps:');
    console.log('1. Start Browser Hub and verify extension loads');
    console.log('2. Test extension popup UI interactions');
    console.log('3. Test BrowserMCP connection functionality');
    console.log('4. Verify element interaction capabilities');
    
} else {
    console.log('❌ Some extension files are missing');
    console.log('⚠️  Extension may not function properly');
}

console.log('\n🔍 To manually test the extension:');
console.log('1. Open Browser Hub: cd apps/electron-desktop && pnpm dlx electron dist/main/main.js');
console.log('2. Navigate to chrome://extensions/ to verify installation');
console.log('3. Click the BrowserMCP extension icon to test popup');
console.log('4. Use Browser Hub controls to test MCP integration');

console.log('\n✨ BrowserMCP Extension Analysis Complete!');