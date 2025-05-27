#!/usr/bin/env node
console.log('🚀 TNF Agent Relay v2.1 - Basic Mode');

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

class SimpleRelay {
    constructor() {
        this.relayId = 'TNF-RELAY-001';
        this.agents = [];
    }
    
    async discover() {
        console.log('🔍 Discovering MCP agents...');
        
        // Check for MCP processes
        return new Promise((resolve) => {
            exec('ps aux | grep mcp | grep -v grep', (error, stdout, stderr) => {
                if (stdout) {
                    const lines = stdout.split('
').filter(line => line.trim());
                    lines.forEach(line => {
                        if (line.includes('applescript-mcp')) {
                            this.agents.push({name: 'AppleScript MCP', status: 'running'});
                        }
                        if (line.includes('browsermcp')) {
                            this.agents.push({name: 'Browser MCP', status: 'running'});
                        }
                    });
                }
                
                console.log(`Found ${this.agents.length} agents:`);
                this.agents.forEach(agent => {
                    console.log(`  • ${agent.name} - ${agent.status}`);
                });
                
                resolve(this.agents);
            });
        });
    }
    
    async test() {
        console.log('📡 Testing communication...');
        const message = {
            id: 'TEST_' + Date.now(),
            from: this.relayId,
            text: 'Hello from Node.js TNF Relay!'
        };
        console.log('Test message:', JSON.stringify(message, null, 2));
        return message;
    }
}

const relay = new SimpleRelay();

if (process.argv[2] === 'discover') {
    relay.discover();
} else if (process.argv[2] === 'test') {
    relay.test();
} else {
    console.log('Usage: node basic-relay.js [discover|test]');
    console.log('TNF Agent Relay ready!');
}
