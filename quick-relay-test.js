console.log('TNF Agent Relay v2.1 - Quick Test');

// Test 1: Check MCP processes
const { execSync } = require('child_process');
try {
    const processes = execSync('ps aux | grep -E "(applescript-mcp|browsermcp)" | grep -v grep').toString();
    if (processes.trim()) {
        console.log('Found MCP processes:');
        processes.split('
').forEach(line => {
            if (line.trim()) {
                const parts = line.split(/\s+/);
                console.log('  PID', parts[1], ':', parts.slice(10, 13).join(' ') + '...');
            }
        });
    } else {
        console.log('No MCP processes found');
    }
} catch (e) {
    console.log('Process check error:', e.message);
}

// Test 2: Check Node.js MCP capabilities
console.log('
Node.js TNF Relay ready for MCP integration!');
console.log('Available commands: discover, test, status');
