#!/usr/bin/env node

console.log('🚀 TNF Agent Relay v2.1 - Node.js Test');
console.log('Testing MCP infrastructure discovery...');

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Test 1: Check MCP processes
exec('ps aux | grep -E "(mcp|applescript|browser)" | grep -v grep', (error, stdout, stderr) => {
    if (stdout) {
        console.log('
📊 Found MCP Processes:');
        stdout.split('
').forEach(line => {
            if (line.trim() && (line.includes('applescript-mcp') || line.includes('browsermcp'))) {
                const parts = line.split(/\s+/);
                const pid = parts[1];
                const command = parts.slice(10).join(' ');
                console.log('  ✅ PID ' + pid + ': ' + command.substring(0, 80) + '...');
            }
        });
    } else {
        console.log('
⚠️ No MCP processes found');
    }
    
    // Test 2: Check for MCP config files
    const homeDir = process.env.HOME;
    const configPaths = [
        homeDir + '/Library/Application Support/Claude/claude_desktop_config.json',
        homeDir + '/Library/Application Support/Code/User/mcp_config.json',
        homeDir + '/Library/Application Support/GitHub Copilot/mcp_config.json'
    ];
    
    console.log('
📁 MCP Configuration Files:');
    configPaths.forEach(configPath => {
        try {
            fs.accessSync(configPath);
            console.log('  ✅ Found: ' + path.basename(configPath));
        } catch (error) {
            console.log('  ❌ Missing: ' + path.basename(configPath));
        }
    });
    
    // Test 3: Test HTTP endpoints
    console.log('
🌐 Testing MCP HTTP Endpoints:');
    const http = require('http');
    const ports = [3000, 3001, 3772, 3773];
    
    ports.forEach(port => {
        const req = http.get('http://localhost:' + port, { timeout: 2000 }, (res) => {
            console.log('  ✅ Port ' + port + ': RESPONDING');
        });
        
        req.on('error', () => {
            console.log('  ❌ Port ' + port + ': No response');
        });
        
        req.on('timeout', () => {
            req.destroy();
            console.log('  ⏱️ Port ' + port + ': Timeout');
        });
    });
    
    // Test 4: Create test message
    setTimeout(() => {
        console.log('
📡 Creating test communication message...');
        
        const testMessage = {
            id: 'TEST_' + Date.now(),
            type: 'DISCOVERY_TEST',
            source: 'TNF-RELAY-001',
            target: 'all-agents',
            content: {
                action: 'ping',
                message: 'Node.js TNF Relay discovery test',
                timestamp: new Date().toISOString()
            }
        };
        
        console.log('  ✅ Test message created:', JSON.stringify(testMessage, null, 2));
        console.log('
🎉 Node.js TNF Agent Relay test complete!');
        console.log('  Ready for full integration with your MCP infrastructure.');
        
    }, 3000);
});

