/**
 * The New Fuse Chrome Extension - Enhanced Popup Script
 * Simplified version with full feature set
 */

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('The New Fuse popup loaded');
    
    // Initialize all components
    initializeConnectionStatus();
    initializeElementDetection();
    initializeAISession();
    initializeWebSocketConnection();
    initializeFloatingPanel();
    updateCurrentURL();
});

/**
 * Initialize connection status indicator
 */
function initializeConnectionStatus() {
    const statusLight = document.getElementById('connection-status');
    if (statusLight) {
        // Check connection status and update
        checkConnectionStatus().then(connected => {
            updateConnectionStatus(connected);
        });
    }
}

/**
 * Initialize element detection features
 */
function initializeElementDetection() {
    // Auto-detect button
    const autoDetectBtn = document.getElementById('auto-detect-btn');
    if (autoDetectBtn) {
        autoDetectBtn.addEventListener('click', handleAutoDetect);
    }

    // Manual selection buttons
    const selectInputBtn = document.getElementById('select-input-btn');
    const selectButtonBtn = document.getElementById('select-button-btn');
    const selectOutputBtn = document.getElementById('select-output-btn');
    const validateBtn = document.getElementById('validate-btn');

    if (selectInputBtn) {
        selectInputBtn.addEventListener('click', () => handleManualSelect('input'));
    }
    if (selectButtonBtn) {
        selectButtonBtn.addEventListener('click', () => handleManualSelect('button'));
    }
    if (selectOutputBtn) {
        selectOutputBtn.addEventListener('click', () => handleManualSelect('output'));
    }
    if (validateBtn) {
        validateBtn.addEventListener('click', handleValidateElements);
    }
}

/**
 * Initialize AI session management
 */
function initializeAISession() {
    const startSessionBtn = document.getElementById('start-session-btn');
    const endSessionBtn = document.getElementById('end-session-btn');

    if (startSessionBtn) {
        startSessionBtn.addEventListener('click', handleStartSession);
    }
    if (endSessionBtn) {
        endSessionBtn.addEventListener('click', handleEndSession);
    }
}

/**
 * Initialize WebSocket connection controls
 */
function initializeWebSocketConnection() {
    const connectBtn = document.getElementById('websocket-connect-btn');
    const disconnectBtn = document.getElementById('websocket-disconnect-btn');

    if (connectBtn) {
        connectBtn.addEventListener('click', handleWebSocketConnect);
    }
    if (disconnectBtn) {
        disconnectBtn.addEventListener('click', handleWebSocketDisconnect);
    }
}

/**
 * Initialize floating panel feature
 */
function initializeFloatingPanel() {
    const togglePanelBtn = document.getElementById('toggle-floating-panel-btn');
    if (togglePanelBtn) {
        togglePanelBtn.addEventListener('click', handleToggleFloatingPanel);
    }
}

/**
 * Update current URL display
 */
function updateCurrentURL() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        const currentTab = tabs[0];
        const urlDisplay = document.getElementById('current-url');
        if (urlDisplay && currentTab) {
            const url = new URL(currentTab.url);
            urlDisplay.textContent = `${url.protocol}//${url.hostname}${url.pathname}`;
        }
    });
}

/**
 * Handle auto-detect elements
 */
async function handleAutoDetect() {
    showNotification('🤖 Starting auto-detection...');
    
    try {
        // Get current tab
        const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
        
        // Send message to content script to auto-detect elements
        chrome.tabs.sendMessage(tab.id, {
            type: 'AUTO_DETECT_ELEMENTS'
        }, (response) => {
            if (chrome.runtime.lastError) {
                showError('Content script not loaded. Please refresh the page.');
                return;
            }
            
            if (response && response.success) {
                updateElementStatus(response.elements);
                showNotification('✅ Auto-detection completed!');
            } else {
                showError('Auto-detection failed. Try manual selection.');
            }
        });
    } catch (error) {
        showError('Error during auto-detection: ' + error.message);
    }
}

/**
 * Handle manual element selection
 */
async function handleManualSelect(elementType) {
    const typeLabels = {
        'input': 'chat input field',
        'button': 'send button', 
        'output': 'chat output area'
    };
    
    showNotification(`📝 Click on the ${typeLabels[elementType]} on the page`);
    
    try {
        const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
        
        chrome.tabs.sendMessage(tab.id, {
            type: 'START_ELEMENT_SELECTION',
            elementType: elementType
        });
        
        // Close popup to allow user to select element
        window.close();
    } catch (error) {
        showError('Error starting element selection: ' + error.message);
    }
}

/**
 * Handle validate elements
 */
async function handleValidateElements() {
    showNotification('✅ Validating elements...');
    
    try {
        const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
        
        chrome.tabs.sendMessage(tab.id, {
            type: 'VALIDATE_ELEMENTS'
        }, (response) => {
            if (chrome.runtime.lastError) {
                showError('Content script not loaded. Please refresh the page.');
                return;
            }
            
            if (response && response.success) {
                updateElementStatus(response.elements);
                showNotification('✅ Validation completed!');
            } else {
                showError('Validation failed: ' + (response?.error || 'Unknown error'));
            }
        });
    } catch (error) {
        showError('Error during validation: ' + error.message);
    }
}

/**
 * Handle start AI session
 */
async function handleStartSession() {
    showNotification('🚀 Starting AI session...');
    
    try {
        const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
        
        chrome.tabs.sendMessage(tab.id, {
            type: 'START_AI_SESSION'
        }, (response) => {
            if (chrome.runtime.lastError) {
                showError('Content script not loaded. Please refresh the page.');
                return;
            }
            
            if (response && response.success) {
                showNotification('✅ AI session started!');
            } else {
                showError('Failed to start AI session: ' + (response?.error || 'Unknown error'));
            }
        });
    } catch (error) {
        showError('Error starting session: ' + error.message);
    }
}

/**
 * Handle end AI session
 */
async function handleEndSession() {
    showNotification('🛑 Ending AI session...');
    
    try {
        const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
        
        chrome.tabs.sendMessage(tab.id, {
            type: 'END_AI_SESSION'
        }, (response) => {
            if (chrome.runtime.lastError) {
                showError('Content script not loaded. Please refresh the page.');
                return;
            }
            
            if (response && response.success) {
                showNotification('✅ AI session ended!');
            } else {
                showError('Failed to end AI session: ' + (response?.error || 'Unknown error'));
            }
        });
    } catch (error) {
        showError('Error ending session: ' + error.message);
    }
}

/**
 * Handle WebSocket connect
 */
async function handleWebSocketConnect() {
    showNotification('🔌 Connecting to WebSocket...');
    
    try {
        const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
        
        chrome.tabs.sendMessage(tab.id, {
            type: 'WEBSOCKET_CONNECT'
        }, (response) => {
            if (chrome.runtime.lastError) {
                showError('Content script not loaded. Please refresh the page.');
                return;
            }
            
            if (response && response.success) {
                updateConnectionStatus(true);
                showNotification('✅ WebSocket connected!');
            } else {
                showError('Failed to connect WebSocket: ' + (response?.error || 'Unknown error'));
            }
        });
    } catch (error) {
        showError('Error connecting WebSocket: ' + error.message);
    }
}

/**
 * Handle WebSocket disconnect
 */
async function handleWebSocketDisconnect() {
    showNotification('🔌 Disconnecting WebSocket...');
    
    try {
        const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
        
        chrome.tabs.sendMessage(tab.id, {
            type: 'WEBSOCKET_DISCONNECT'
        }, (response) => {
            if (chrome.runtime.lastError) {
                showError('Content script not loaded. Please refresh the page.');
                return;
            }
            
            if (response && response.success) {
                updateConnectionStatus(false);
                showNotification('✅ WebSocket disconnected!');
            } else {
                showError('Failed to disconnect WebSocket: ' + (response?.error || 'Unknown error'));
            }
        });
    } catch (error) {
        showError('Error disconnecting WebSocket: ' + error.message);
    }
}

/**
 * Handle toggle floating panel
 */
async function handleToggleFloatingPanel() {
    try {
        const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
        
        // Check if tab is valid for content scripts
        if (!isValidTabForContentScript(tab)) {
            showError('Cannot activate on this page. Try on a regular website.');
            return;
        }
        
        // Send message with timeout and retry
        const response = await sendMessageWithRetry(tab.id, {
            type: 'TOGGLE_FLOATING_PANEL'
        });
        
        if (response && response.success) {
            showNotification(`🎯 Panel ${response.visible ? 'shown' : 'hidden'}!`);
        } else {
            showError('Failed to toggle panel. Please refresh the page and try again.');
        }
    } catch (error) {
        console.error('Toggle panel error:', error);
        if (error.message.includes('Receiving end does not exist')) {
            showError('Extension not loaded on this page. Please refresh and try again.');
        } else {
            showError('Error toggling panel: ' + error.message);
        }
    }
}

/**
 * Check if tab is valid for content scripts
 */
function isValidTabForContentScript(tab) {
    if (!tab || !tab.url) return false;
    
    const url = tab.url.toLowerCase();
    const invalidPrefixes = [
        'chrome://',
        'chrome-extension://',
        'moz-extension://',
        'edge://',
        'opera://',
        'about:',
        'data:',
        'file://'
    ];
    
    return !invalidPrefixes.some(prefix => url.startsWith(prefix));
}

/**
 * Send message with retry logic
 */
async function sendMessageWithRetry(tabId, message, retries = 2) {
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            return await chrome.tabs.sendMessage(tabId, message);
        } catch (error) {
            if (attempt === retries) {
                throw error;
            }
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }
}

/**
 * Update element status display
 */
function updateElementStatus(elements) {
    const statusDisplay = document.getElementById('element-status-display');
    if (statusDisplay && elements) {
        const inputStatus = elements.input ? 'success' : 'failure';
        const buttonStatus = elements.button ? 'success' : 'failure';
        const outputStatus = elements.output ? 'success' : 'failure';
        
        statusDisplay.innerHTML = `
            <div>Input Field: <span class="status-indicator ${inputStatus}">●</span></div>
            <div>Send Button: <span class="status-indicator ${buttonStatus}">●</span></div>
            <div>Output Area: <span class="status-indicator ${outputStatus}">●</span></div>
        `;
    }
}

/**
 * Update connection status
 */
function updateConnectionStatus(connected) {
    const statusLight = document.getElementById('connection-status');
    const websocketStatus = document.getElementById('websocket-status');
    
    if (statusLight) {
        statusLight.className = connected ? 'status-light connected' : 'status-light';
        statusLight.title = connected ? 'Connected' : 'Disconnected';
    }
    
    if (websocketStatus) {
        websocketStatus.className = connected ? 'status-value online' : 'status-value offline';
        websocketStatus.textContent = connected ? 'Connected' : 'Disconnected';
    }
}

/**
 * Update WebSocket status
 */
function updateWebSocketStatus(status) {
    const statusElement = document.getElementById('websocket-status');
    if (statusElement) {
        statusElement.className = `status-value ${status === 'connected' ? 'online' : 'offline'}`;
        statusElement.textContent = status.charAt(0).toUpperCase() + status.slice(1);
    }
}

/**
 * Log WebSocket message
 */
function logWebSocketMessage(message) {
    const logElement = document.getElementById('websocket-log');
    if (logElement) {
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = `[${timestamp}] ${message}\n`;
        logElement.textContent += logEntry;
        logElement.scrollTop = logElement.scrollHeight;
    }
}

/**
 * Check connection status
 */
async function checkConnectionStatus() {
    try {
        // For now, return false - this would normally check actual connection
        return false;
    } catch (error) {
        return false;
    }
}

/**
 * Show notification
 */
function showNotification(message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        background: rgba(40, 167, 69, 0.9);
        color: white;
        padding: 10px 15px;
        border-radius: 8px;
        z-index: 10000;
        font-size: 12px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.2);
        animation: slideIn 0.3s ease-out;
    `;
    notification.textContent = message;
    
    // Add to body
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => {
            if (notification.parentNode) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

/**
 * Show error notification
 */
function showError(message) {
    // Create error notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        background: rgba(220, 53, 69, 0.9);
        color: white;
        padding: 10px 15px;
        border-radius: 8px;
        z-index: 10000;
        font-size: 12px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.2);
        animation: slideIn 0.3s ease-out;
    `;
    notification.textContent = message;
    
    // Add to body
    document.body.appendChild(notification);
    
    // Remove after 5 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => {
            if (notification.parentNode) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 5000);
}

// Add animation keyframes to document
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

console.log('The New Fuse popup script initialized');
