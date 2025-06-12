/**
 * Fixed Popup Script for The New Fuse Chrome Extension
 * Simplified server management without complex reconnection logic
 */

// Simple state tracking  
let serverPort = 3710;

// DOM elements
let startServerBtn, connectBtn, serverStatusEl, connectionStatusEl, connectionStatusLight, portInput;

// WebSocket instance
let websocket = null;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Get DOM elements
    startServerBtn = document.getElementById('start-server-btn');
    connectBtn = document.getElementById('connect-btn');
    serverStatusEl = document.getElementById('server-status');
    connectionStatusEl = document.getElementById('connection-status-text');
    connectionStatusLight = document.getElementById('connection-status');
    portInput = document.getElementById('port-input');

    // Setup event listeners
    startServerBtn.addEventListener('click', handleStartServer);
    connectBtn.addEventListener('click', handleConnect);
    
    if (portInput) {
        portInput.addEventListener('change', (e) => {
            serverPort = parseInt(e.target.value) || 3710;
        });
    }

    console.log('Fixed popup loaded');
});

/**
 * Handle Start Server button click
 */
function handleStartServer() {
    console.log('Start server clicked');
    
    // For a Chrome extension, we can't actually start a Node.js server
    // This should show instructions or trigger an external process
    showServerInstructions();
}

/**
 * Show instructions for starting the server
 */
function showServerInstructions() {
    const instructions = document.getElementById('instructions');
    if (instructions) {
        instructions.classList.add('show');
    }
    
    // Update UI to indicate manual start needed
    updateServerStatus('Manual Start Required');
    startServerBtn.textContent = '📋 See Instructions';
}

/**
 * Handle Connect button click
 */
function handleConnect() {
    console.log('Connect clicked');
    
    if (websocket && websocket.readyState === WebSocket.OPEN) {
        // Disconnect if already connected
        disconnectWebSocket();
    } else {
        // Connect to WebSocket
        connectWebSocket();
    }
}

/**
 * Connect to WebSocket server
 */
function connectWebSocket() {
    const port = portInput ? portInput.value : serverPort;
    const wsUrl = `ws://localhost:${port}`;
    
    updateConnectionStatus('Connecting...', false);
    connectBtn.disabled = true;
    connectBtn.textContent = '🔄 Connecting...';
    
    try {
        websocket = new WebSocket(wsUrl);
        
        websocket.onopen = () => {
            console.log('WebSocket connected successfully');
            updateConnectionStatus('Connected', true);
            connectBtn.disabled = false;
            connectBtn.textContent = '🔌 Disconnect';
            
            // Update server status since we know it's running
            updateServerStatus('Running');
            
            // Send initial message
            websocket.send(JSON.stringify({
                type: 'CONNECTION',
                source: 'chrome-extension-popup',
                timestamp: Date.now()
            }));
        };
        
        websocket.onclose = () => {
            console.log('WebSocket disconnected');
            updateConnectionStatus('Disconnected', false);
            connectBtn.disabled = false;
            connectBtn.textContent = '🔗 Connect';
            websocket = null;
        };
        
        websocket.onerror = (error) => {
            console.error('WebSocket error:', error);
            updateConnectionStatus('Connection Failed', false);
            connectBtn.disabled = false;
            connectBtn.textContent = '🔗 Connect';
            
            // Show instructions if connection fails
            showServerInstructions();
        };
        
        websocket.onmessage = (event) => {
            console.log('Message received:', event.data);
        };
        
    } catch (error) {
        console.error('Failed to create WebSocket:', error);
        updateConnectionStatus('Error', false);
        connectBtn.disabled = false;
        connectBtn.textContent = '🔗 Connect';
    }
}

/**
 * Disconnect from WebSocket
 */
function disconnectWebSocket() {
    if (websocket) {
        websocket.close();
        websocket = null;
    }
    updateConnectionStatus('Disconnected', false);
    connectBtn.textContent = '🔗 Connect';
}

/**
 * Update server status display
 */
function updateServerStatus(status) {
    if (serverStatusEl) {
        serverStatusEl.textContent = status;
        serverStatusEl.className = `status-value ${status === 'Running' ? 'running' : 'stopped'}`;
    }
}

/**
 * Update connection status display
 */
function updateConnectionStatus(status, isConnected) {
    if (connectionStatusEl) {
        connectionStatusEl.textContent = status;
        connectionStatusEl.className = `status-value ${isConnected ? 'connected' : 'offline'}`;
    }
    
    if (connectionStatusLight) {
        connectionStatusLight.className = isConnected ? 'status-light connected' : 'status-light';
        connectionStatusLight.title = status;
    }
}
