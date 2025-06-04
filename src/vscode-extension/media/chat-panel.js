// media/chat-panel.js - Client-side script for the Chat Panel

// Assume vscode API is available (e.g., const vscode = acquireVsCodeApi();)
// For this task, we'll assume vscode.postMessage is available globally,
// or a function like postMessageToExtension is provided by tabbed-container.js.
// If not, uncomment the line below:
// const vscode = acquireVsCodeApi();

// --- DOM Element References ---
const chatMessagesContainer = document.getElementById('chat-messages');
const chatInputElement = document.getElementById('chat-input');
const sendButtonElement = document.getElementById('send-button');
const thinkingIndicatorElement = document.getElementById('thinking-indicator');

// --- Global State ---
let currentActiveSessionId = null;

// --- Helper Function to Render a Single Message ---
/**
 * Renders a single chat message and appends it to the chatMessagesContainer.
 * @param {object} message - The message object (e.g., { role: 'user' | 'assistant', content: string })
 */
function renderMessage(message) {
    if (!chatMessagesContainer) return;

    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message');
    if (message.role === 'user') {
        messageDiv.classList.add('user-message');
    } else if (message.role === 'assistant') {
        messageDiv.classList.add('assistant-message');
    } else {
        messageDiv.classList.add('system-message'); // Or some other default
    }

    // For now, assuming plain text. Sanitize if HTML content is possible.
    // A simple way to prevent HTML injection for plain text:
    const contentDiv = document.createElement('div');
    contentDiv.textContent = message.content;
    messageDiv.appendChild(contentDiv);

    chatMessagesContainer.appendChild(messageDiv);
}

/**
 * Scrolls the chat messages container to the bottom.
 */
function scrollToBottom() {
    if (chatMessagesContainer) {
        chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
    }
}

// --- Event Listener for Sending Messages ---
function handleSendMessage() {
    if (!chatInputElement || !sendButtonElement) return;

    const chatInputText = chatInputElement.value.trim();
    if (chatInputText) {
        // Use global vscode.postMessage or a provided wrapper
        vscode.postMessage({
            command: 'chat:sendMessage',
            payload: {
                prompt: chatInputText,
                sessionId: currentActiveSessionId
            }
        });
        // Optionally clear input here, or wait for 'chat:clearInput' from extension
        // chatInputElement.value = '';
    }
}

if (sendButtonElement) {
    sendButtonElement.addEventListener('click', handleSendMessage);
}

if (chatInputElement) {
    chatInputElement.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault(); // Prevent default newline in textarea
            handleSendMessage();
        }
    });
}

// --- Message Receiving Logic (from Extension) ---
window.addEventListener('message', event => {
    const message = event.data; // The JSON data our extension sent

    if (!message || !message.command) {
        // console.warn('ChatPanel: Received message without command:', event.data);
        return;
    }

    // console.log('ChatPanel: Received message:', message.command, message.payload);

    switch (message.command) {
        case 'chat:renderMessages':
            if (chatMessagesContainer && message.payload && Array.isArray(message.payload.messages)) {
                chatMessagesContainer.innerHTML = ''; // Clear existing messages
                currentActiveSessionId = message.payload.currentSessionId || null;
                message.payload.messages.forEach(renderMessage);
                scrollToBottom();
            }
            break;

        case 'chat:appendMessage':
            if (message.payload) {
                renderMessage(message.payload);
                scrollToBottom();
            }
            break;

        case 'chat:setThinking':
            if (thinkingIndicatorElement) {
                const isThinking = message.payload && message.payload.isThinking;
                thinkingIndicatorElement.style.display = isThinking ? 'block' : 'none';
            }
            break;

        case 'chat:clearInput':
            if (chatInputElement) {
                chatInputElement.value = '';
            }
            break;

        case 'chat:setActiveSession':
            currentActiveSessionId = message.payload ? message.payload.id : null;
            if (chatMessagesContainer) {
                chatMessagesContainer.innerHTML = ''; // Clear existing messages
                if (message.payload && Array.isArray(message.payload.messages)) {
                    message.payload.messages.forEach(renderMessage);
                }
                scrollToBottom();
            }
            // Potentially update other UI elements based on active session
            break;

        // Add other chat-specific commands here
    }
});

// --- Initial State Request ---
// When the chat panel is ready, request the current state from the extension.
// This ensures the UI is populated if the webview was reloaded or shown after being hidden.
document.addEventListener('DOMContentLoaded', () => {
    // console.log('ChatPanel: DOMContentLoaded, requesting initial state.');
    if (typeof vscode !== 'undefined' && vscode.postMessage) {
         vscode.postMessage({ command: 'chat:requestState' });
    } else {
        console.warn('ChatPanel: vscode.postMessage not available at DOMContentLoaded for chat:requestState.');
        // Fallback or retry mechanism might be needed if vscode API is not immediately available
    }

    // Ensure elements are available
    if (!chatMessagesContainer) console.error('ChatPanel: chat-messages container not found!');
    if (!chatInputElement) console.error('ChatPanel: chat-input element not found!');
    if (!sendButtonElement) console.error('ChatPanel: send-button element not found!');
    if (!thinkingIndicatorElement) console.error('ChatPanel: thinking-indicator element not found!');
});

// console.log('ChatPanel: script loaded.');