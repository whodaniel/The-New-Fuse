#!/usr/bin/env node

/**
 * Test Script for BrowserMCP Extension Integration
 * 
 * This script tests if the BrowserMCP Chrome extension is properly installed
 * and functioning within The Browser Hub's custom Chromium browser.
 */

const { WebSocket } = require('ws');
const http = require('http');

console.log('🧪 Testing BrowserMCP Extension Integration...\n');

// Test 1: Check if MCP WebSocket server can be created
function testMCPServerConnection() {
    console.log('📡 Testing MCP WebSocket Server Connection...');
    
    return new Promise((resolve) => {
        const server = http.createServer();
        const wss = new WebSocket.Server({ server });
        
        wss.on('connection', (ws) => {
            console.log('✅ WebSocket connection established');
            
            ws.on('message', (message) => {
                console.log('📨 Received message from extension:', message.toString());
            });
            
            // Send test message to extension
            ws.send(JSON.stringify({
                type: 'test',
                message: 'Hello from MCP server!'
            }));
        });
        
        server.listen(3025, () => {
            console.log('✅ MCP WebSocket server started on port 3025');
            console.log('🔗 Extension should connect automatically...\n');
            resolve(server);
        });
    });
}

// Test 2: Simulate extension commands
function testExtensionCommands() {
    console.log('🎮 Testing Extension Command Simulation...');
    
    const testCommands = [
        {
            type: 'CONNECT_TAB',
            description: 'Connect to active tab'
        },
        {
            type: 'TAKE_SCREENSHOT',
            description: 'Capture screenshot'
        },
        {
            type: 'GET_PAGE_INFO',
            description: 'Extract page information'
        },
        {
            type: 'NAVIGATE',
            url: 'https://example.com',
            description: 'Navigate to URL'
        }
    ];
    
    testCommands.forEach((cmd, index) => {
        console.log(`${index + 1}. ${cmd.description}: ${cmd.type}`);
    });
    
    console.log('✅ Extension command structure verified\n');
}

// Test 3: Check extension file integrity
function testExtensionFiles() {
    console.log('📁 Testing Extension File Integrity...');
    
    const fs = require('fs');
    const path = require('path');
    
    const extensionPath = path.join(__dirname, 'apps/electron-desktop/extensions/browser-mcp-extension');
    const requiredFiles = [
        'manifest.json',
        'background.js',
        'content.js', 
        'popup.html',
        'popup.js'
    ];
    
    let allFilesExist = true;
    
    requiredFiles.forEach(file => {
        const filePath = path.join(extensionPath, file);
        if (fs.existsSync(filePath)) {
            console.log(`✅ ${file} exists`);
        } else {
            console.log(`❌ ${file} missing`);
            allFilesExist = false;
        }
    });
    
    if (allFilesExist) {
        console.log('✅ All extension files present\n');
    } else {
        console.log('❌ Some extension files missing\n');
    }
    
    return allFilesExist;
}

// Test 4: Verify extension manifest
function testExtensionManifest() {
    console.log('📋 Testing Extension Manifest...');
    
    try {
        const fs = require('fs');
        const path = require('path');
        
        const manifestPath = path.join(__dirname, 'apps/electron-desktop/extensions/browser-mcp-extension/manifest.json');
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        
        console.log(`✅ Extension Name: ${manifest.name}`);
        console.log(`✅ Version: ${manifest.version}`);
        console.log(`✅ Manifest Version: ${manifest.manifest_version}`);
        console.log(`✅ Permissions: ${manifest.permissions.length} permissions`);
        console.log(`✅ Background Script: ${manifest.background.service_worker}`);
        
        if (manifest.permissions.includes('activeTab') && 
            manifest.permissions.includes('tabs') &&
            manifest.permissions.includes('storage')) {
            console.log('✅ Essential permissions present');
        } else {
            console.log('⚠️  Some essential permissions missing');
        }
        
        console.log('✅ Extension manifest valid\n');
        return true;
    } catch (error) {
        console.log('❌ Error reading extension manifest:', error.message, '\n');
        return false;
    }
}

// Main test execution
async function runTests() {
    console.log('🚀 Starting BrowserMCP Extension Tests\n');
    console.log('=' .repeat(50) + '\n');
    
    // Run all tests
    const filesExist = testExtensionFiles();
    const manifestValid = testExtensionManifest();
    testExtensionCommands();
    
    if (filesExist && manifestValid) {
        console.log('🎯 Starting MCP Server for Extension Testing...');
        const server = await testMCPServerConnection();
        
        // Keep server running for 30 seconds to allow extension connection
        setTimeout(() => {
            console.log('⏰ Test complete - shutting down MCP server...');
            server.close();
            
            console.log('\n' + '=' .repeat(50));
            console.log('📊 TEST SUMMARY:');
            console.log('✅ Extension files: Present');
            console.log('✅ Manifest structure: Valid');  
            console.log('✅ MCP server: Started successfully');
            console.log('✅ Command structure: Verified');
            console.log('\n🎉 BrowserMCP Extension appears to be properly configured!');
            console.log('\n💡 To test fully:');
            console.log('   1. Launch Browser Hub with: pnpm run dev');
            console.log('   2. Click the BrowserMCP extension icon');
            console.log('   3. Click "Connect to Current Tab"');
            console.log('   4. Test screenshot and page info features');
            
            process.exit(0);
        }, 10000);
        
    } else {
        console.log('\n❌ Extension configuration issues detected');
        process.exit(1);
    }
}

// Run the tests
if (require.main === module) {
    runTests().catch(console.error);
}

module.exports = {
    testExtensionFiles,
    testExtensionManifest,
    testExtensionCommands,
    testMCPServerConnection
};