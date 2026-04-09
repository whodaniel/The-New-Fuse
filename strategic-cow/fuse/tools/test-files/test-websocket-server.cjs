const WebSocket = require('ws');
const http = require('http');

// Create HTTP server
const server = http.createServer();

// Create WebSocket server
const wss = new WebSocket.Server({ server });

// Set up WebSocket server event handlers
wss.on('connection', (ws, req) => {
    console.log(`Client connected: ${req.socket.remoteAddress}`);

    // Send welcome message
    ws.send(JSON.stringify({
        type: 'SYSTEM',
        message: 'Connected to The New Fuse WebSocket Server',
        timestamp: Date.now()
    }));

    // Set up event handlers
    ws.on('message', (message) => {
        try {
            // Parse message
            const data = JSON.parse(message.toString());
            console.log('Received message:', data);

            // Handle message based on type
            switch (data.type) {
                case 'AUTH':
                    handleAuthMessage(ws, data);
                    break;
                case 'PING':
                    handlePingMessage(ws);
                    break;
                case 'CODE_INPUT':
                    handleCodeInputMessage(ws, data);
                    break;
                case 'AI_QUERY':
                    handleAIQueryMessage(ws, data);
                    break;
                case 'STATUS_REQUEST':
                    handleStatusRequestMessage(ws);
                    break;
                case 'DISCONNECT':
                    handleDisconnectMessage(ws);
                    break;
                default:
                    console.warn(`Unknown message type: ${data.type}`);
                    ws.send(JSON.stringify({
                        type: 'ERROR',
                        message: `Unknown message type: ${data.type}`,
                        timestamp: Date.now()
                    }));
            }
        } catch (error) {
            console.error(`Error handling message: ${error}`);
        }
    });

    ws.on('close', (code, reason) => {
        console.log(`Client disconnected, code: ${code}, reason: ${reason || 'No reason provided'}`);
    });

    ws.on('error', (error) => {
        console.error(`WebSocket error: ${error}`);
    });
});

// Handle authentication message
function handleAuthMessage(ws, message) {
    console.log('Authentication message received:', message);

    // For testing, just accept any token
    ws.send(JSON.stringify({
        type: 'AUTH_RESPONSE',
        success: true,
        timestamp: Date.now()
    }));
}

// Handle ping message
function handlePingMessage(ws) {
    ws.send(JSON.stringify({
        type: 'PONG',
        timestamp: Date.now()
    }));
}

// Handle code input message
function handleCodeInputMessage(ws, message) {
    console.log('Code input received:', message.code);

    // Send acknowledgement
    ws.send(JSON.stringify({
        type: 'CODE_INPUT_RECEIVED',
        timestamp: Date.now()
    }));

    // Simulate AI processing the code
    setTimeout(() => {
        ws.send(JSON.stringify({
            type: 'AI_RESPONSE',
            result: `Processed code: ${message.code}`,
            timestamp: Date.now()
        }));
    }, 1000);
}

// Handle AI query message
function handleAIQueryMessage(ws, message) {
    console.log('AI query received:', message.query);

    // Simulate AI processing the query
    setTimeout(() => {
        ws.send(JSON.stringify({
            type: 'AI_RESPONSE',
            result: `Answer to: ${message.query}`,
            timestamp: Date.now()
        }));
    }, 1500);
}

// Handle status request message
function handleStatusRequestMessage(ws) {
    console.log('Status request received');

    // Send status information
    ws.send(JSON.stringify({
        type: 'STATUS_RESPONSE',
        status: {
            server: 'running',
            clients: 1,
            uptime: process.uptime(),
            memory: process.memoryUsage()
        },
        timestamp: Date.now()
    }));
}

// Handle disconnect message
function handleDisconnectMessage(ws) {
    console.log('Disconnect request received');

    // Send acknowledgement before closing
    ws.send(JSON.stringify({
        type: 'DISCONNECT_ACK',
        message: 'Disconnecting by request',
        timestamp: Date.now()
    }));

    // Close the connection after a short delay
    setTimeout(() => {
        ws.close(1000, 'Client requested disconnect');
    }, 500);
}

// Start HTTP server
const PORT = 3712; // Set to port 3712 as requested
server.listen(PORT, () => {
    console.log(`WebSocket server running on ws://localhost:${PORT}`);
});

// Handle server errors
server.on('error', (error) => {
    console.error(`Server error: ${error}`);
});

// Handle process termination
process.on('SIGINT', () => {
    console.log('Shutting down server...');
    wss.close(() => {
        console.log('WebSocket server closed');
        server.close(() => {
            console.log('HTTP server closed');
            process.exit(0);
        });
    });
});

console.log('Press Ctrl+C to stop the server');
