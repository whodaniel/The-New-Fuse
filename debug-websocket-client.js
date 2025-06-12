const WebSocket = require('ws');

function testConnection() {
    console.log('Testing WebSocket connection to ws://localhost:3710...');
    
    const ws = new WebSocket('ws://localhost:3710');
    
    ws.on('open', () => {
        console.log('✅ Connection opened successfully');
        
        // Send a test message
        const testMessage = {
            type: 'PING',
            timestamp: Date.now()
        };
        
        console.log('📤 Sending test message:', testMessage);
        ws.send(JSON.stringify(testMessage));
    });
    
    ws.on('message', (data) => {
        try {
            const message = JSON.parse(data.toString());
            console.log('📥 Received message:', message);
        } catch (error) {
            console.log('📥 Received raw data:', data.toString());
        }
    });
    
    ws.on('close', (code, reason) => {
        console.log(`🔴 Connection closed - Code: ${code}, Reason: ${reason || 'No reason provided'}`);
    });
    
    ws.on('error', (error) => {
        console.error('❌ WebSocket error:', error);
    });
    
    // Keep connection alive for a few seconds
    setTimeout(() => {
        console.log('🔄 Closing connection...');
        ws.close();
    }, 5000);
}

testConnection();
