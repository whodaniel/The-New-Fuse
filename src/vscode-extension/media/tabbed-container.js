// media/tabbed-container.js

// 1. VS Code API
const vscode = acquireVsCodeApi();

// 3. Message Posting Utility
function postMessageToExtension(command, payload, expectsResponse = false) {
    const message = { command, payload };
    if (expectsResponse) {
        message.requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    vscode.postMessage(message);
}

document.addEventListener('DOMContentLoaded', () => {
    // 2. Tab Navigation Logic
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContentAreas = document.querySelectorAll('.tab-content-area');

    function setActiveTab(tabId) {
        tabButtons.forEach(button => {
            if (button.dataset.tabId === tabId) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });

        tabContentAreas.forEach(area => {
            if (area.dataset.tabId === tabId) {
                area.classList.add('active');
            } else {
                area.classList.remove('active');
            }
        });
    }

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.dataset.tabId;
            setActiveTab(tabId);
            postMessageToExtension('container:tabChanged', { tabId });
        });
    });

    // 4. Message Receiving Logic
    const notificationsArea = document.getElementById('webview-notifications');
    const connectionStatusIndicator = document.getElementById('connection-status-indicator');

    window.addEventListener('message', event => {
        const message = event.data; // The JSON data our extension sent

        switch (message.command) {
            case 'container:switchToTab':
                if (message.payload && message.payload.tabId) {
                    setActiveTab(message.payload.tabId);
                }
                break;
            case 'container:showNotification':
                if (message.payload && notificationsArea) {
                    const notificationDiv = document.createElement('div');
                    notificationDiv.className = `notification ${message.payload.type || 'info'}`; // 'success', 'error', 'info'
                    notificationDiv.textContent = message.payload.text;
                    notificationsArea.appendChild(notificationDiv);

                    // Auto-remove notification after a few seconds
                    setTimeout(() => {
                        notificationDiv.remove();
                    }, 5000); // Remove after 5 seconds
                }
                break;
            case 'container:updateConnectionStatus':
                if (message.payload && connectionStatusIndicator) {
                    connectionStatusIndicator.textContent = message.payload.isConnected ? 'Connected' : 'Disconnected';
                    connectionStatusIndicator.className = message.payload.isConnected ? 'status-connected' : 'status-disconnected';
                }
                break;
            case 'response': // Basic response handling
                if (message.requestId) {
                    // For now, just log. Future: resolve promises.
                    console.log('Received response for requestId:', message.requestId, 'Payload:', message.payload);
                }
                break;
            default:
                // Potentially log unknown commands for debugging
                // console.warn('Unknown message command received:', message.command);
                break;
        }
    });

    // 5. Initial State
    const defaultTabId = 'chat'; // Default tab to activate
    const defaultTabButton = document.querySelector(`.tab-button[data-tab-id="${defaultTabId}"]`);

    if (defaultTabButton) {
        setActiveTab(defaultTabId);
    } else if (tabButtons.length > 0) {
        // Fallback to the first tab button if the default is not found
        setActiveTab(tabButtons[0].dataset.tabId);
    }

    // Post a message to the extension indicating the webview is ready
    postMessageToExtension('container:webviewReady');
});
