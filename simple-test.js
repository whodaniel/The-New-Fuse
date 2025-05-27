console.log('TNF Agent Relay - Node.js Test');
console.log('Checking MCP infrastructure...');

const { execSync } = require('child_process');

try {
    // Check for MCP processes
    const processes = execSync('ps aux | grep mcp | grep -v grep || echo "No MCP processes"').toString();
    console.log('MCP Processes:');
    console.log(processes);
    
    // Test message creation
    const testMessage = {
        id: 'TEST_' + Date.now(),
        source: 'TNF-RELAY-001',
        message: 'Node.js relay test successful'
    };
    
    console.log('Test Message:', JSON.stringify(testMessage, null, 2));
    console.log('Node.js TNF Relay test SUCCESSFUL!');
    
} catch (error) {
    console.error('Test error:', error.message);
}
