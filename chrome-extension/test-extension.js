// Test script to verify The New Fuse extension functionality
console.log("🧪 Testing The New Fuse Extension");

// Function to test extension messaging
function testExtensionMessaging() {
    console.log("Testing extension messaging...");
    
    // Try to send a message to check if content script is loaded
    if (typeof chrome !== 'undefined' && chrome.runtime) {
        try {
            chrome.runtime.sendMessage({action: "GET_PANEL_STATE"}, (response) => {
                if (chrome.runtime.lastError) {
                    console.error("❌ Extension messaging error:", chrome.runtime.lastError.message);
                } else {
                    console.log("✅ Extension messaging working:", response);
                }
            });
        } catch (error) {
            console.error("❌ Failed to test messaging:", error);
        }
    } else {
        console.log("⚠️ Chrome extension APIs not available - running in web context");
    }
}

// Function to check if floating panel exists
function checkFloatingPanel() {
    const panel = document.querySelector('#tnf-floating-panel');
    if (panel) {
        console.log("✅ Floating panel found in DOM");
        console.log("Panel style:", panel.style.cssText);
        console.log("Panel visibility:", window.getComputedStyle(panel).display);
    } else {
        console.log("❌ Floating panel not found in DOM");
    }
}

// Function to simulate extension icon click
function simulateExtensionClick() {
    console.log("Simulating extension icon click...");
    
    // Check if content script is available
    if (window.theFuseManager) {
        console.log("✅ Content script manager found");
        try {
            window.theFuseManager.togglePanel();
            console.log("✅ Panel toggle attempted");
        } catch (error) {
            console.error("❌ Panel toggle failed:", error);
        }
    } else {
        console.log("❌ Content script manager not found");
    }
}

// Run tests
console.log("🔍 Running extension tests...");
testExtensionMessaging();
setTimeout(checkFloatingPanel, 500);
setTimeout(simulateExtensionClick, 1000);

// Add button to test manually
const testButton = document.createElement('button');
testButton.textContent = 'Test Extension';
testButton.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    z-index: 10000;
    padding: 10px;
    background: #007cff;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
`;
testButton.onclick = () => {
    console.log("🔄 Manual test triggered");
    checkFloatingPanel();
    simulateExtensionClick();
};
document.body.appendChild(testButton);

console.log("✅ Test script loaded - click the blue 'Test Extension' button to run manual tests");
