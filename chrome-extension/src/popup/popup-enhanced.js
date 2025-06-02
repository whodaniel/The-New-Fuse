// Popup Script for The New Fuse Chrome Extension
// Enhanced with automatic detection and interactive selection

const logger = {
    info: (msg, data) => console.log(`[Popup] ${msg}`, data || ''),
    warn: (msg, data) => console.warn(`[Popup] ${msg}`, data || ''),
    error: (msg, data) => console.error(`[Popup] ${msg}`, data || '')
};

// --- DOM Elements ---
const connectionStatus = document.getElementById('connection-status');
const elementStatusDisplay = document.getElementById('element-status-display');
const currentUrlDisplay = document.getElementById('current-url');
const autoDetectBtn = document.getElementById('auto-detect-btn');
const selectInputBtn = document.getElementById('select-input-btn');
const selectButtonBtn = document.getElementById('select-button-btn');
const selectOutputBtn = document.getElementById('select-output-btn');
const validateBtn = document.getElementById('validate-btn');
const startSessionBtn = document.getElementById('start-session-btn');
const endSessionBtn = document.getElementById('end-session-btn');

// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', async () => {
    logger.info("Popup opened. Requesting current status and tab info.");
    
    // Get current tab URL
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab?.url) {
            currentUrlDisplay.textContent = new URL(tab.url).hostname;
        }
    } catch (error) {
        currentUrlDisplay.textContent = 'Unable to access current page';
    }

    // Request current state
    chrome.runtime.sendMessage({ type: 'GET_STATUS' });
});

autoDetectBtn.addEventListener('click', () => {
    logger.info("Auto-detect button clicked");
    autoDetectBtn.textContent = '🔍 Detecting...';
    autoDetectBtn.disabled = true;
    handleButtonClick('AUTO_DETECT_ELEMENTS');
});

selectInputBtn.addEventListener('click', () => handleSelectionRequest('INPUT'));
selectButtonBtn.addEventListener('click', () => handleSelectionRequest('BUTTON'));
selectOutputBtn.addEventListener('click', () => handleSelectionRequest('OUTPUT'));

validateBtn.addEventListener('click', () => {
    logger.info("Validate button clicked");
    handleButtonClick('VALIDATE_ELEMENTS');
});

startSessionBtn.addEventListener('click', () => handleSessionControl('START_SESSION'));
endSessionBtn.addEventListener('click', () => handleSessionControl('END_SESSION'));

/**
 * Sends a request to initiate element selection mode.
 * @param {'INPUT' | 'BUTTON' | 'OUTPUT'} elementType The type of element to select.
 */
function handleSelectionRequest(elementType) {
    logger.info(`Requesting selection for: ${elementType}`);
    
    // Update button text to show selection is active
    const button = elementType === 'INPUT' ? selectInputBtn : 
                  elementType === 'BUTTON' ? selectButtonBtn : selectOutputBtn;
    const originalText = button.textContent;
    button.textContent = '👆 Click on the page element...';
    button.disabled = true;
    
    chrome.runtime.sendMessage({ 
        type: 'SELECT_ELEMENT', 
        elementType: elementType 
    });
    
    // Reset button after a delay
    setTimeout(() => {
        button.textContent = originalText;
        button.disabled = false;
    }, 5000);
    
    window.close(); // Close popup to allow page interaction
}

/**
 * Sends a message to the background script.
 * @param {string} type The message type.
 * @param {object} [payload] Optional data to send.
 */
async function handleButtonClick(type, payload) {
    logger.info(`Button clicked: ${type}`);
    try {
        const response = await chrome.runtime.sendMessage({ type, payload });
        if (response) {
            logger.info(`Response from background for ${type}:`, response);
            updateUI(response.newState || response.state);
        }
    } catch (error) {
        logger.error(`Error sending message for ${type}:`, error);
        // Update UI to show error state
        connectionStatus.style.backgroundColor = '#ffc107'; // Orange for error
        connectionStatus.title = `Error: ${error.message}`;
    }
}

/**
 * Sends a request to start or end the AI session.
 * @param {'START_SESSION' | 'END_SESSION'} type
 */
async function handleSessionControl(type) {
    logger.info(`Session control: ${type}`);
    
    const button = type === 'START_SESSION' ? startSessionBtn : endSessionBtn;
    const originalText = button.textContent;
    button.textContent = type === 'START_SESSION' ? '🔄 Connecting...' : '🔄 Disconnecting...';
    button.disabled = true;
    
    try {
        const response = await chrome.runtime.sendMessage({ type });
        if (response) {
            updateUI(response.newState || response.state);
        }
    } catch (error) {
        logger.error(`Error during session control for ${type}:`, error);
        button.textContent = originalText;
        button.disabled = false;
    }
}

/**
 * Updates the UI based on the new state received from the background script.
 * @param {object} state The state object from the background script.
 */
function updateUI(state) {
    if (!state) {
        logger.warn("Received an empty state to update UI.");
        return;
    }

    logger.info("Updating UI with state:", state);

    // Update session connection status
    connectionStatus.classList.toggle('connected', state.isSessionActive);
    connectionStatus.title = state.isSessionActive ? 'AI Session Active' : 'No active session';

    // Update element selection status display
    const { chatInput, sendButton, chatOutput } = state.elementMapping || {};
    updateElementStatus('Input Field', chatInput);
    updateElementStatus('Send Button', sendButton);
    updateElementStatus('Output Area', chatOutput);

    // Update button states
    const allElementsMapped = chatInput && sendButton && chatOutput;
    startSessionBtn.disabled = state.isSessionActive || !allElementsMapped;
    endSessionBtn.disabled = !state.isSessionActive;
    
    // Reset auto-detect button
    autoDetectBtn.textContent = '🤖 Auto-Detect Elements';
    autoDetectBtn.disabled = false;

    // Update start session button text based on readiness
    if (!allElementsMapped) {
        startSessionBtn.textContent = '⚠️ Elements Required';
    } else if (state.isSessionActive) {
        startSessionBtn.textContent = '✅ Session Active';
    } else {
        startSessionBtn.textContent = '🚀 Start AI Session';
    }

    logger.info("UI update completed");
}

/**
 * Updates the status indicator for a specific element type.
 * @param {string} elementName The display name of the element.
 * @param {string|null} selector The CSS selector if mapped, null otherwise.
 */
function updateElementStatus(elementName, selector) {
    const statusDiv = Array.from(elementStatusDisplay.children)
        .find(div => div.textContent.includes(elementName));
    
    if (statusDiv) {
        const indicator = statusDiv.querySelector('.status-indicator');
        indicator.classList.remove('success', 'failure', 'pending');
        
        if (selector) {
            indicator.classList.add('success');
            indicator.textContent = '●';
            statusDiv.title = `Mapped to: ${selector}`;
        } else {
            indicator.classList.add('failure');
            indicator.textContent = '●';
            statusDiv.title = 'Not detected';
        }
    }
}

// --- Message Listener from Background ---
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    logger.info(`Received message: ${message.type}`);
    
    switch (message.type) {
        case 'STATUS_UPDATE':
            updateUI(message.payload);
            break;
        case 'SELECTION_SUCCESS':
            logger.info(`Selection completed for ${message.payload.elementType}`);
            // The background script will send a status update, so we don't need to do anything here
            break;
        case 'AUTO_DETECT_COMPLETE':
            logger.info("Auto-detection completed");
            // Status will be updated via STATUS_UPDATE message
            break;
        default:
            logger.warn(`Unknown message type: ${message.type}`);
    }
    
    return true; // Keep message channel open
});

logger.info("Popup script loaded and ready");
