/**
 * The New Fuse Chrome Extension - Content Script
 * Handles element detection, floating panel, and page interaction
 */

console.log('The New Fuse content script loaded');

// Global state
let selectedElements = {
    input: null,
    button: null,
    output: null
};

let floatingPanel = null;
let isFloatingPanelVisible = false;
let aiSessionActive = false;

// Initialize content script
function initialize() {
    console.log('Initializing The New Fuse content script');
    
    // Listen for messages from popup
    chrome.runtime.onMessage.addListener(handleMessage);
    
    // Create floating panel (hidden by default)
    createFloatingPanel();
    
    console.log('Content script initialized');
}

/**
 * Handle messages from popup or background script
 */
function handleMessage(request, sender, sendResponse) {
    console.log('Content script received message:', request);
    
    switch (request.type) {
        case 'AUTO_DETECT_ELEMENTS':
            handleAutoDetectElements(sendResponse);
            break;
            
        case 'START_ELEMENT_SELECTION':
            handleStartElementSelection(request.elementType, sendResponse);
            break;
            
        case 'VALIDATE_ELEMENTS':
            handleValidateElements(sendResponse);
            break;
            
        case 'TOGGLE_FLOATING_PANEL':
            handleToggleFloatingPanel(sendResponse);
            break;
            
        case 'START_AI_SESSION':
            handleStartAISession(sendResponse);
            break;
            
        case 'END_AI_SESSION':
            handleEndAISession(sendResponse);
            break;
            
        default:
            sendResponse({ success: false, error: 'Unknown message type' });
            break;
    }
    
    return true; // Keep message channel open for async response
}

/**
 * Auto-detect elements on the page
 */
function handleAutoDetectElements(sendResponse) {
    console.log('Starting auto-detection...');
    
    // Common selectors for different platforms
    const inputSelectors = [
        'textarea[placeholder*="message" i]',
        'textarea[placeholder*="chat" i]',
        'textarea[placeholder*="ask" i]',
        'textarea[placeholder*="type" i]',
        'input[type="text"][placeholder*="message" i]',
        'div[contenteditable="true"]',
        'textarea:not([readonly]):not([disabled])',
        '.chat-input textarea',
        '#chat-input',
        '[data-testid*="input"]',
        '[data-testid*="textbox"]'
    ];
    
    const buttonSelectors = [
        'button[type="submit"]',
        'button:has(svg)',
        'button[aria-label*="send" i]',
        'button[title*="send" i]',
        '.send-button',
        '[data-testid*="send"]',
        '[data-testid*="submit"]',
        'button:contains("Send")',
        'button[class*="send"]'
    ];
    
    const outputSelectors = [
        '.chat-messages',
        '.conversation',
        '.messages',
        '[data-testid*="conversation"]',
        '[data-testid*="messages"]',
        '.chat-history',
        '.message-list',
        '#messages',
        '.chat-container .messages'
    ];
    
    // Try to find elements
    const input = findElement(inputSelectors);
    const button = findElement(buttonSelectors);
    const output = findElement(outputSelectors);
    
    // Store found elements
    selectedElements = { input, button, output };
    
    // Special detection for specific platforms
    detectPlatformSpecificElements();
    
    console.log('Auto-detection results:', selectedElements);
    
    sendResponse({
        success: true,
        elements: {
            input: !!selectedElements.input,
            button: !!selectedElements.button,
            output: !!selectedElements.output
        }
    });
}

/**
 * Find element using multiple selectors
 */
function findElement(selectors) {
    for (const selector of selectors) {
        try {
            const element = document.querySelector(selector);
            if (element && isElementVisible(element)) {
                return element;
            }
        } catch (e) {
            // Invalid selector, continue
        }
    }
    return null;
}

/**
 * Check if element is visible and interactable
 */
function isElementVisible(element) {
    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);
    
    return rect.width > 0 && 
           rect.height > 0 && 
           style.display !== 'none' && 
           style.visibility !== 'hidden' && 
           style.opacity !== '0';
}

/**
 * Platform-specific detection improvements
 */
function detectPlatformSpecificElements() {
    const hostname = window.location.hostname.toLowerCase();
    
    if (hostname.includes('gemini') || hostname.includes('bard')) {
        // Google Gemini/Bard specific selectors
        if (!selectedElements.input) {
            selectedElements.input = document.querySelector('rich-textarea textarea') ||
                                   document.querySelector('.ql-editor') ||
                                   document.querySelector('[data-testid="user-input"]');
        }
        if (!selectedElements.button) {
            selectedElements.button = document.querySelector('[data-testid="send-button"]') ||
                                    document.querySelector('button[aria-label*="Send"]');
        }
        if (!selectedElements.output) {
            selectedElements.output = document.querySelector('[data-testid="conversation-turn"]') ||
                                    document.querySelector('.conversation-container');
        }
    } else if (hostname.includes('openai') || hostname.includes('chatgpt')) {
        // ChatGPT specific selectors
        if (!selectedElements.input) {
            selectedElements.input = document.querySelector('#prompt-textarea') ||
                                   document.querySelector('textarea[placeholder*="Message"]');
        }
        if (!selectedElements.button) {
            selectedElements.button = document.querySelector('[data-testid="send-button"]') ||
                                    document.querySelector('button[aria-label="Send prompt"]');
        }
        if (!selectedElements.output) {
            selectedElements.output = document.querySelector('[data-testid="conversation-turn"]') ||
                                    document.querySelector('.text-base');
        }
    } else if (hostname.includes('claude')) {
        // Claude specific selectors
        if (!selectedElements.input) {
            selectedElements.input = document.querySelector('[data-testid="chat-input"]') ||
                                   document.querySelector('textarea[placeholder*="Talk"]');
        }
        if (!selectedElements.button) {
            selectedElements.button = document.querySelector('[data-testid="send-button"]') ||
                                    document.querySelector('button[aria-label*="Send"]');
        }
        if (!selectedElements.output) {
            selectedElements.output = document.querySelector('[data-testid="message"]') ||
                                    document.querySelector('.conversation');
        }
    }
}

/**
 * Start manual element selection
 */
function handleStartElementSelection(elementType, sendResponse) {
    console.log('Starting manual selection for:', elementType);
    
    // Create overlay for element selection
    createSelectionOverlay(elementType);
    
    sendResponse({ success: true });
}

/**
 * Create selection overlay
 */
function createSelectionOverlay(elementType) {
    // Remove existing overlay
    const existingOverlay = document.getElementById('tnf-selection-overlay');
    if (existingOverlay) {
        existingOverlay.remove();
    }
    
    // Create overlay
    const overlay = document.createElement('div');
    overlay.id = 'tnf-selection-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        z-index: 999999;
        cursor: crosshair;
    `;
    
    // Add instructions
    const instructions = document.createElement('div');
    instructions.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 15px 25px;
        border-radius: 10px;
        font-family: -apple-system, BlinkMacSystemFont, sans-serif;
        font-size: 14px;
        font-weight: 600;
        z-index: 1000000;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        border: 1px solid rgba(255, 255, 255, 0.2);
    `;
    instructions.textContent = `Click on the ${elementType} element (Press ESC to cancel)`;
    
    overlay.appendChild(instructions);
    document.body.appendChild(overlay);
    
    // Handle element selection
    let isSelecting = true;
    
    function handleClick(e) {
        if (!isSelecting) return;
        
        e.preventDefault();
        e.stopPropagation();
        
        // Get the element under the click (excluding overlay)
        overlay.style.pointerEvents = 'none';
        const element = document.elementFromPoint(e.clientX, e.clientY);
        overlay.style.pointerEvents = 'auto';
        
        if (element && element !== overlay && element !== instructions) {
            selectedElements[elementType] = element;
            
            // Highlight selected element
            highlightElement(element);
            
            // Show success message
            showSelectionSuccess(elementType);
            
            // Remove overlay
            setTimeout(() => {
                overlay.remove();
                isSelecting = false;
            }, 1000);
        }
    }
    
    function handleKeydown(e) {
        if (e.key === 'Escape') {
            overlay.remove();
            isSelecting = false;
        }
    }
    
    overlay.addEventListener('click', handleClick);
    document.addEventListener('keydown', handleKeydown);
    
    // Cleanup event listeners when overlay is removed
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.removedNodes.forEach((node) => {
                if (node === overlay) {
                    document.removeEventListener('keydown', handleKeydown);
                    observer.disconnect();
                }
            });
        });
    });
    observer.observe(document.body, { childList: true });
}

/**
 * Highlight selected element
 */
function highlightElement(element) {
    const highlight = document.createElement('div');
    highlight.className = 'tnf-element-highlight';
    
    const rect = element.getBoundingClientRect();
    highlight.style.cssText = `
        position: fixed;
        top: ${rect.top}px;
        left: ${rect.left}px;
        width: ${rect.width}px;
        height: ${rect.height}px;
        border: 3px solid #28a745;
        background: rgba(40, 167, 69, 0.1);
        pointer-events: none;
        z-index: 999998;
        border-radius: 4px;
        box-shadow: 0 0 20px rgba(40, 167, 69, 0.5);
        animation: pulse 1s infinite;
    `;
    
    document.body.appendChild(highlight);
    
    // Remove highlight after 3 seconds
    setTimeout(() => {
        if (highlight.parentNode) {
            highlight.remove();
        }
    }, 3000);
}

/**
 * Show selection success message
 */
function showSelectionSuccess(elementType) {
    const message = document.createElement('div');
    message.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
        color: white;
        padding: 20px 30px;
        border-radius: 10px;
        font-family: -apple-system, BlinkMacSystemFont, sans-serif;
        font-size: 16px;
        font-weight: 600;
        z-index: 1000001;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        border: 1px solid rgba(255, 255, 255, 0.2);
        animation: scaleIn 0.3s ease-out;
    `;
    message.textContent = `✅ ${elementType.charAt(0).toUpperCase() + elementType.slice(1)} element selected!`;
    
    document.body.appendChild(message);
    
    setTimeout(() => {
        message.style.animation = 'scaleOut 0.3s ease-out';
        setTimeout(() => {
            if (message.parentNode) {
                message.remove();
            }
        }, 300);
    }, 2000);
}

/**
 * Validate selected elements
 */
function handleValidateElements(sendResponse) {
    console.log('Validating elements:', selectedElements);
    
    const validation = {
        input: selectedElements.input && isElementVisible(selectedElements.input),
        button: selectedElements.button && isElementVisible(selectedElements.button),
        output: selectedElements.output && isElementVisible(selectedElements.output)
    };
    
    sendResponse({
        success: true,
        elements: validation
    });
}

/**
 * Create floating panel
 */
function createFloatingPanel() {
    if (floatingPanel) return;
    
    floatingPanel = document.createElement('div');
    floatingPanel.id = 'tnf-floating-panel';
    floatingPanel.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        width: 300px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        backdrop-filter: blur(10px);
        z-index: 999999;
        font-family: -apple-system, BlinkMacSystemFont, sans-serif;
        color: white;
        display: none;
        transition: all 0.3s ease;
    `;
    
    floatingPanel.innerHTML = `
        <div style="padding: 16px; border-bottom: 1px solid rgba(255, 255, 255, 0.2);">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <h3 style="margin: 0; font-size: 16px; font-weight: 600;">The New Fuse</h3>
                <button id="tnf-close-panel" style="background: none; border: none; color: white; font-size: 18px; cursor: pointer; padding: 4px;">×</button>
            </div>
        </div>
        <div style="padding: 16px;">
            <div style="margin-bottom: 12px;">
                <div style="font-size: 12px; font-weight: 600; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">Status</div>
                <div id="tnf-panel-status" style="font-size: 14px;">Ready</div>
            </div>
            <div style="margin-bottom: 12px;">
                <div style="font-size: 12px; font-weight: 600; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">Quick Actions</div>
                <button id="tnf-quick-detect" style="width: 100%; padding: 8px; margin-bottom: 8px; border: none; border-radius: 6px; background: rgba(255, 255, 255, 0.2); color: white; cursor: pointer; font-size: 12px;">🤖 Quick Detect</button>
                <button id="tnf-quick-session" style="width: 100%; padding: 8px; border: none; border-radius: 6px; background: rgba(255, 255, 255, 0.2); color: white; cursor: pointer; font-size: 12px;">🚀 Toggle Session</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(floatingPanel);
    
    // Add event listeners
    const closeBtn = floatingPanel.querySelector('#tnf-close-panel');
    const quickDetectBtn = floatingPanel.querySelector('#tnf-quick-detect');
    const quickSessionBtn = floatingPanel.querySelector('#tnf-quick-session');
    
    closeBtn.addEventListener('click', () => {
        hideFloatingPanel();
    });
    
    quickDetectBtn.addEventListener('click', () => {
        handleAutoDetectElements(() => {
            updatePanelStatus('Elements detected!');
        });
    });
    
    quickSessionBtn.addEventListener('click', () => {
        if (aiSessionActive) {
            handleEndAISession(() => {
                updatePanelStatus('Session ended');
            });
        } else {
            handleStartAISession(() => {
                updatePanelStatus('Session started');
            });
        }
    });
    
    // Make panel draggable
    makeDraggable(floatingPanel);
}

/**
 * Make element draggable
 */
function makeDraggable(element) {
    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;
    let xOffset = 0;
    let yOffset = 0;
    
    const header = element.querySelector('div:first-child');
    
    header.addEventListener('mousedown', dragStart);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', dragEnd);
    
    function dragStart(e) {
        initialX = e.clientX - xOffset;
        initialY = e.clientY - yOffset;
        
        if (e.target === header || header.contains(e.target)) {
            isDragging = true;
            header.style.cursor = 'grabbing';
        }
    }
    
    function drag(e) {
        if (isDragging) {
            e.preventDefault();
            currentX = e.clientX - initialX;
            currentY = e.clientY - initialY;
            
            xOffset = currentX;
            yOffset = currentY;
            
            element.style.transform = `translate(${currentX}px, ${currentY}px)`;
        }
    }
    
    function dragEnd() {
        initialX = currentX;
        initialY = currentY;
        isDragging = false;
        header.style.cursor = 'grab';
    }
}

/**
 * Show floating panel
 */
function showFloatingPanel() {
    if (floatingPanel) {
        floatingPanel.style.display = 'block';
        setTimeout(() => {
            floatingPanel.style.opacity = '1';
            floatingPanel.style.transform = 'scale(1)';
        }, 10);
        isFloatingPanelVisible = true;
    }
}

/**
 * Hide floating panel
 */
function hideFloatingPanel() {
    if (floatingPanel) {
        floatingPanel.style.opacity = '0';
        floatingPanel.style.transform = 'scale(0.9)';
        setTimeout(() => {
            floatingPanel.style.display = 'none';
        }, 300);
        isFloatingPanelVisible = false;
    }
}

/**
 * Toggle floating panel
 */
function handleToggleFloatingPanel(sendResponse) {
    if (isFloatingPanelVisible) {
        hideFloatingPanel();
    } else {
        showFloatingPanel();
    }
    
    sendResponse({
        success: true,
        visible: isFloatingPanelVisible
    });
}

/**
 * Update panel status
 */
function updatePanelStatus(message) {
    const statusElement = floatingPanel?.querySelector('#tnf-panel-status');
    if (statusElement) {
        statusElement.textContent = message;
        
        // Reset to "Ready" after 3 seconds
        setTimeout(() => {
            statusElement.textContent = 'Ready';
        }, 3000);
    }
}

/**
 * Start AI session
 */
function handleStartAISession(sendResponse) {
    aiSessionActive = true;
    console.log('AI session started');
    
    sendResponse({ success: true });
}

/**
 * End AI session
 */
function handleEndAISession(sendResponse) {
    aiSessionActive = false;
    console.log('AI session ended');
    
    sendResponse({ success: true });
}

// Add required CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes pulse {
        0% { opacity: 1; }
        50% { opacity: 0.7; }
        100% { opacity: 1; }
    }
    
    @keyframes scaleIn {
        from { transform: translate(-50%, -50%) scale(0.8); opacity: 0; }
        to { transform: translate(-50%, -50%) scale(1); opacity: 1; }
    }
    
    @keyframes scaleOut {
        from { transform: translate(-50%, -50%) scale(1); opacity: 1; }
        to { transform: translate(-50%, -50%) scale(0.8); opacity: 0; }
    }
    
    .tnf-element-highlight {
        animation: pulse 1s infinite;
    }
`;
document.head.appendChild(style);

// Initialize when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
} else {
    initialize();
}
