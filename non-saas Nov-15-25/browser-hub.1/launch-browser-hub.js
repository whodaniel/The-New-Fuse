#!/usr/bin/env node

/**
 * Browser Hub Launcher
 * Launches The New Fuse Browser Hub without Theia dependencies
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Starting The New Fuse Browser Hub...');

// Check if we're in development or production mode
const isDev = process.env.NODE_ENV !== 'production';

// Define the main hub file
const hubFile = path.join(__dirname, 'enhanced-hub.html');

// Check if the hub file exists
if (!fs.existsSync(hubFile)) {
    console.error('❌ Browser Hub file not found:', hubFile);
    process.exit(1);
}

// Launch the browser hub
if (isDev) {
    console.log('🔧 Development mode: Opening Browser Hub in default browser');
    
    // Try to use live-server if available, otherwise open directly
    try {
        const liveServer = spawn('npx', ['live-server', __dirname, '--port=8080', '--entry-file=enhanced-hub.html'], {
            stdio: 'inherit',
            shell: true
        });
        
        liveServer.on('error', (err) => {
            console.log('⚠️  Live server not available, opening file directly');
            openInBrowser(hubFile);
        });
        
        liveServer.on('close', (code) => {
            console.log(`Live server exited with code ${code}`);
        });
        
    } catch (error) {
        console.log('⚠️  Live server not available, opening file directly');
        openInBrowser(hubFile);
    }
} else {
    console.log('🌐 Production mode: Opening Browser Hub');
    openInBrowser(hubFile);
}

function openInBrowser(filePath) {
    const { exec } = require('child_process');
    const platform = process.platform;
    
    let command;
    if (platform === 'darwin') {
        command = `open "${filePath}"`;
    } else if (platform === 'win32') {
        command = `start "${filePath}"`;
    } else {
        command = `xdg-open "${filePath}"`;
    }
    
    exec(command, (error) => {
        if (error) {
            console.error('❌ Failed to open Browser Hub:', error);
            console.log('📁 Please manually open:', filePath);
        } else {
            console.log('✅ Browser Hub opened successfully');
        }
    });
}

// Handle process termination
process.on('SIGINT', () => {
    console.log('\n👋 Shutting down Browser Hub launcher...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n👋 Shutting down Browser Hub launcher...');
    process.exit(0);
});