#!/usr/bin/env node

const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Create HTTP server for serving test files
const server = http.createServer((req, res) => {
    let filePath = path.join(__dirname, req.url === '/' ? 'test-resizable-panel.html' : req.url);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
        res.writeHead(404);
        res.end('File not found');
        return;
    }
    
    // Set content type based on file extension
    const ext = path.extname(filePath);
    const contentTypes = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json'
    };
    
    res.writeHead(200, { 'Content-Type': contentTypes[ext] || 'text/plain' });
    fs.createReadStream(filePath).pipe(res);
});

// Create WebSocket server
const wss = new WebSocket.Server({ port: 3712 });

console.log('🚀 Starting Resizable Panel Test Server...');
console.log('📡 WebSocket server listening on port 3712');
console.log('🌐 HTTP server starting on port 8080');

// WebSocket connection handler
wss.on('connection', (ws) => {
    console.log('🔗 New WebSocket connection established');
    
    // Send welcome message
    ws.send(JSON.stringify({
        type: 'system',
        message: 'Connected to resizable panel test server',
        timestamp: new Date().toISOString()
    }));
    
    // Handle incoming messages
    ws.on('message', (data) => {
        try {
            const message = JSON.parse(data);
            console.log('📨 Received message:', message);
            
            // Echo the message back with additional info
            const response = {
                type: 'echo',
                original: message,
                response: `Received: ${message.message || 'No message content'}`,
                timestamp: new Date().toISOString(),
                panelTest: true
            };
            
            ws.send(JSON.stringify(response));
            
            // Simulate some test responses for resizable panel testing
            if (message.type === 'chat' && message.message) {
                setTimeout(() => {
                    const botResponse = {
                        type: 'chat',
                        message: `🤖 Bot response to: "${message.message}". Panel resize test successful!`,
                        timestamp: new Date().toISOString(),
                        source: 'test-server'
                    };
                    ws.send(JSON.stringify(botResponse));
                }, 1000);
            }
            
        } catch (error) {
            console.error('❌ Error parsing message:', error);
            ws.send(JSON.stringify({
                type: 'error',
                message: 'Invalid JSON format',
                timestamp: new Date().toISOString()
            }));
        }
    });
    
    // Handle connection close
    ws.on('close', () => {
        console.log('🔌 WebSocket connection closed');
    });
    
    // Handle errors
    ws.on('error', (error) => {
        console.error('❌ WebSocket error:', error);
    });
});

// Start HTTP server
server.listen(8080, () => {
    console.log('✅ Test server ready!');
    console.log('🔗 Open: http://localhost:8080 to test resizable panel');
    console.log('📋 Test checklist:');
    console.log('   1. Load Chrome extension in developer mode');
    console.log('   2. Navigate to http://localhost:8080');
    console.log('   3. Click "Show Floating Panel"');
    console.log('   4. Test resize handles on panel edges');
    console.log('   5. Verify minimum/maximum size constraints');
    console.log('   6. Test chat area responsiveness during resize');
    console.log('   7. Test state persistence (resize, reload page)');
    console.log('');
    console.log('💡 Press Ctrl+C to stop the server');
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down test server...');
    server.close(() => {
        console.log('✅ HTTP server closed');
        process.exit(0);
    });
});

// Send periodic test messages to connected clients
setInterval(() => {
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
                type: 'heartbeat',
                message: 'Resizable panel test server heartbeat',
                timestamp: new Date().toISOString(),
                clientCount: wss.clients.size
            }));
        }
    });
}, 30000); // Every 30 seconds
