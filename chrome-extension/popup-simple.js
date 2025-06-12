/**
 * Simplified Popup Script for The New Fuse Chrome Extension
 * Just two buttons: Start Server, Connect
 */

// Simple state tracking  
let currentServerStatus = 'stopped';
let currentConnectionStatus = 'offline';

// DOM elements
let startServerBtn, connectBtn, serverStatusEl, connectionStatusEl, connectionStatusLight;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Get DOM elements
    startServerBtn = document.getElementById('start-server-btn');
    connectBtn = document.getElementById('connect-btn');
    serverStatusEl = document.getElementById('server-status');
    connectionStatusEl = document.getElementById('connection-status-text');
    connectionStatusLight = document.getElementById('connection-status');

    // Setup event listeners
    startServerBtn.addEventListener('click', handleStartServer);
    connectBtn.addEventListener('click', handleConnect);

    // Check initial status
    checkServerStatus();
    
    console.log('Simple popup loaded');
});

/**
 * Handle Start Server button click - SIMPLIFIED
 */
function handleStartServer() {
    console.log('Start server clicked');
    
    // Update UI to starting state
    updateServerStatus('starting');
    startServerBtn.disabled = true;
    startServerBtn.textContent = '🔄 Starting...';
    
    // Send message to background script
    chrome.runtime.sendMessage({
        type: 'START_WS_SERVER',
        port: 3710
    }, (response) => {
        if (chrome.runtime.lastError) {
            console.error('Error starting server:', chrome.runtime.lastError);
            updateServerStatus('stopped');
            startServerBtn.disabled = false;
            startServerBtn.textContent = '🚀 Start Server';
            return;
        }

        if (response && response.success) {
            console.log('Server started successfully');
            updateServerStatus('running');
            startServerBtn.textContent = '✅ Server Started';
            connectBtn.disabled = false;
        } else {
            console.log('Server start failed');
            updateServerStatus('stopped');
            startServerBtn.disabled = false;
            startServerBtn.textContent = '🚀 Start Server';
        }
    });
}

/**
 * Handle Connect button click - SIMPLIFIED
 */
function handleConnect() {
    console.log('Connect clicked');
    
    // Update UI to connecting state
    updateConnectionStatus('connecting');
    connectBtn.disabled = true;
    connectBtn.textContent = '🔄 Connecting...';
    
    // Simple connection attempt - no complex retry logic
    const wsUrl = 'ws://localhost:3710';
    
    try {
        const ws = new WebSocket(wsUrl);
        
        ws.onopen = () => {
            console.log('WebSocket connected successfully');
            updateConnectionStatus('connected');
            connectBtn.textContent = '✅ Connected';
            
            // Send simple auth message
            ws.send(JSON.stringify({
                type: 'AUTH',
                token: 'chrome-extension',
                timestamp: Date.now()
            }));
            
            // Store WebSocket reference
            window.currentWebSocket = ws;
        };
        
        ws.onclose = () => {
            console.log('WebSocket disconnected');
            updateConnectionStatus('offline');
            connectBtn.disabled = false;
            connectBtn.textContent = '🔗 Connect';
        };
        
        ws.onerror = (error) => {
            console.error('WebSocket connection failed:', error);
            updateConnectionStatus('offline');
            connectBtn.disabled = false;
            connectBtn.textContent = '🔗 Connect';
        };
        
    } catch (error) {
        console.error('Failed to create WebSocket:', error);
        updateConnectionStatus('offline');
        connectBtn.disabled = false;
        connectBtn.textContent = '🔗 Connect';
    }
}

/**
 * Check initial server status - SIMPLIFIED
 */
function checkServerStatus() {
    chrome.runtime.sendMessage({
        type: 'GET_SERVER_STATUS'
    }, (response) => {
        if (response && response.running) {
            updateServerStatus('running');
            startServerBtn.textContent = '✅ Server Started';
            connectBtn.disabled = false;
        } else {
            updateServerStatus('stopped');
        }
    });
}

/**
 * Update server status display
 */
function updateServerStatus(status) {
    currentServerStatus = status;
    serverStatusEl.className = `status-value ${status}`;
    
    switch (status) {
        case 'stopped':
            serverStatusEl.textContent = 'Stopped';
            break;
        case 'starting':
            serverStatusEl.textContent = 'Starting';
            break;
        case 'running':
            serverStatusEl.textContent = 'Running';
            break;
    }
}

/**
 * Update connection status display
 */
function updateConnectionStatus(status) {
    currentConnectionStatus = status;
    connectionStatusEl.className = `status-value ${status}`;
    
    // Update the status light as well
    if (status === 'connected') {
        connectionStatusLight.classList.add('connected');
        connectionStatusEl.textContent = 'Connected';
    } else {
        connectionStatusLight.classList.remove('connected');
        if (status === 'connecting') {
            connectionStatusEl.textContent = 'Connecting';
        } else {
            connectionStatusEl.textContent = 'Offline';
        }
    }
}

// End of simplified popup script
