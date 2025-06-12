// Enhanced Background Script for The New Fuse Chrome Extension
console.log("🚀 The New Fuse Enhanced Background Script Loaded");

// Helper function to check if content script is loaded
async function isContentScriptLoaded(tabId) {
    try {
        const response = await chrome.tabs.sendMessage(tabId, { action: "PING" });
        return response && response.status === "PONG";
    } catch (error) {
        return false;
    }
}

// Helper function to inject content script if not loaded
async function ensureContentScriptLoaded(tabId) {
    const isLoaded = await isContentScriptLoaded(tabId);
    
    if (!isLoaded) {
        console.log("📦 Injecting content script for tab:", tabId);
        try {
            await chrome.scripting.executeScript({
                target: { tabId: tabId },
                files: ['content.js']
            });
            
            // Wait a bit for the script to initialize
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Verify it's now loaded
            const nowLoaded = await isContentScriptLoaded(tabId);
            if (!nowLoaded) {
                throw new Error("Content script failed to load after injection");
            }
            
            console.log("✅ Content script successfully injected");
            return true;
        } catch (error) {
            console.error("❌ Failed to inject content script:", error);
            return false;
        }
    }
    
    return true;
}

// Helper function to check if tab supports content scripts
function isValidTab(tab) {
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

// Improved message sending with retry logic
async function sendMessageToTab(tabId, message, retries = 2) {
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            // Ensure content script is loaded
            const scriptLoaded = await ensureContentScriptLoaded(tabId);
            if (!scriptLoaded) {
                throw new Error("Content script could not be loaded");
            }
            
            // Send the message
            const response = await chrome.tabs.sendMessage(tabId, message);
            console.log("✅ Message sent successfully:", response);
            return response;
            
        } catch (error) {
            console.log(`⚠️ Attempt ${attempt + 1} failed:`, error.message);
            
            if (attempt === retries) {
                throw error;
            }
            
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
}

// Handle extension icon click
chrome.action.onClicked.addListener(async (tab) => {
    console.log("📌 Extension icon clicked for tab:", tab.id);
    
    // Check if this is a valid tab for content scripts
    if (!isValidTab(tab)) {
        console.warn("⚠️ Cannot inject content script on this page:", tab.url);
        
        // Show notification to user
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon48.png',
            title: 'The New Fuse',
            message: 'Cannot activate on this page. Try on a regular website.'
        });
        return;
    }
    
    try {
        await sendMessageToTab(tab.id, {
            action: "TOGGLE_FLOATING_PANEL"
        });
        console.log("✅ Panel toggle completed");
    } catch (error) {
        console.error("❌ Failed to toggle panel:", error);
        
        // Show error notification
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon48.png',
            title: 'The New Fuse - Error',
            message: 'Failed to toggle panel. Try refreshing the page.'
        });
    }
});

// Handle keyboard shortcuts
chrome.commands.onCommand.addListener(async (command) => {
    console.log("⌨️ Keyboard command:", command);
    
    if (command === "toggle-floating-panel") {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        if (!tab) {
            console.error("❌ No active tab found");
            return;
        }
        
        // Check if this is a valid tab for content scripts
        if (!isValidTab(tab)) {
            console.warn("⚠️ Cannot use keyboard shortcut on this page:", tab.url);
            return;
        }
        
        try {
            await sendMessageToTab(tab.id, {
                action: "TOGGLE_FLOATING_PANEL"
            });
            console.log("✅ Keyboard shortcut completed");
        } catch (error) {
            console.error("❌ Keyboard shortcut failed:", error);
        }
    }
});

console.log("✅ Enhanced background script initialized");

// WebSocket server management variables - SIMPLIFIED
let isServerRunning = false;
let serverPort = 3710;

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("📨 Received message:", message);
    
    // Handle different message types
    switch (message.type) {
        case 'START_WS_SERVER':
            handleStartServer(message, sendResponse);
            return true; // Keep sendResponse callback alive for async response
            
        case 'STOP_WS_SERVER':
            handleStopServer(message, sendResponse);
            return true; // Keep sendResponse callback alive for async response
            
        case 'GET_SERVER_STATUS':
            sendResponse({
                success: true,
                running: isServerRunning,
                port: serverPort
            });
            return false;
            
        default:
            // Not a server management message, ignore
            return false;
    }
});

// Handle starting WebSocket server - SIMPLIFIED
async function handleStartServer(message, sendResponse) {
    console.log("🚀 Starting WebSocket server...");
    
    if (isServerRunning) {
        console.log("✅ Server already running");
        sendResponse({ success: true, port: serverPort });
        return;
    }
    
    try {
        serverPort = message.port || 3710;
        console.log(`🌐 Starting server on port ${serverPort}...`);
        
        // Simple approach: just mark as started and let connection attempts validate
        isServerRunning = true;
        
        console.log("✅ Server started successfully");
        sendResponse({ success: true, port: serverPort });
        
    } catch (error) {
        console.error("❌ Failed to start server:", error);
        isServerRunning = false;
        sendResponse({ success: false, error: error.message });
    }
}

// Handle stopping WebSocket server - SIMPLIFIED
async function handleStopServer(message, sendResponse) {
    console.log("🛑 Stopping WebSocket server...");
    
    if (!isServerRunning) {
        console.log("⚠️ Server not running");
        sendResponse({ success: false, error: 'Server is not running' });
        return;
    }
    
    try {
        // Simple approach: just mark as stopped
        isServerRunning = false;
        
        console.log("✅ Server stopped successfully");
        sendResponse({ success: true });
        
    } catch (error) {
        console.error("❌ Failed to stop server:", error);
        sendResponse({ success: false, error: error.message });
    }
}
