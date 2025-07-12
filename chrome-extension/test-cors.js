/**
 * CORS Test Script for TNF Chrome Extension
 * Run this in the browser console to test CORS access
 */

async function testCORSAccess() {
    console.log('🧪 Testing CORS access to TNF services...');
    
    const endpoints = [
        { name: 'TNF Simple Relay', url: 'http://localhost:8765/health' },
        { name: 'TNF Comprehensive HTTP', url: 'http://localhost:3000/health' },
        { name: 'TNF UI Server', url: 'http://localhost:3002/health' }
    ];
    
    for (const endpoint of endpoints) {
        try {
            console.log(`📡 Testing ${endpoint.name}...`);
            const response = await fetch(endpoint.url);
            
            if (response.ok) {
                const data = await response.json();
                console.log(`✅ ${endpoint.name}: ${JSON.stringify(data)}`);
            } else {
                console.log(`❌ ${endpoint.name}: HTTP ${response.status}`);
            }
        } catch (error) {
            console.log(`❌ ${endpoint.name}: ${error.message}`);
        }
    }
    
    console.log('🏁 CORS test completed');
}

// Test WebSocket connection
async function testWebSocketConnection() {
    console.log('🔌 Testing WebSocket connection...');
    
    try {
        const ws = new WebSocket('ws://localhost:3001');
        
        ws.onopen = function() {
            console.log('✅ WebSocket connected successfully');
            ws.send(JSON.stringify({
                type: 'TEST_MESSAGE',
                source: 'cors-test',
                message: 'Hello from CORS test'
            }));
        };
        
        ws.onmessage = function(event) {
            console.log('📩 WebSocket received:', event.data);
            ws.close();
        };
        
        ws.onclose = function() {
            console.log('🔌 WebSocket connection closed');
        };
        
        ws.onerror = function(error) {
            console.log('❌ WebSocket error:', error);
        };
        
    } catch (error) {
        console.log('❌ WebSocket connection failed:', error.message);
    }
}

// Run tests if this script is executed
if (typeof window !== 'undefined') {
    // Running in browser
    testCORSAccess();
    setTimeout(testWebSocketConnection, 2000);
} else {
    // Export for Node.js testing
    module.exports = { testCORSAccess, testWebSocketConnection };
}