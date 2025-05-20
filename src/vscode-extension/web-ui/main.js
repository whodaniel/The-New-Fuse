// State management
let currentConversationId = null;
let messageQueue = [];

// DOM Elements
const messagesContainer = document.getElementById('messages');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
const newConversationButton = document.getElementById('newConversation');
const clearMessagesButton = document.getElementById('clearMessages');
const showSettingsButton = document.getElementById('showSettings');

// Initialize WebView
window.addEventListener('load', () => {
    initializeEventListeners();
    restoreState();
    updateConnectionStatus();
});

// Handle messages from VS Code
window.addEventListener('message', event => {
    const message = event.data;
    handleVSCodeMessage(message);
});

function initializeEventListeners() {
    // Agent selection
    document.querySelectorAll('.agent-item').forEach(agentItem => {
        agentItem.addEventListener('click', () => {
            const agentId = agentItem.dataset.agentId;
            selectAgent(agentId);
        });
    });

    // Conversation selection
    document.querySelectorAll('.conversation-item').forEach(convItem => {
        convItem.addEventListener('click', () => {
            const conversationId = convItem.dataset.conversationId;
            selectConversation(conversationId);
        });
    });

    // Message input
    messageInput.addEventListener('keydown', event => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            sendMessage();
        }
    });

    sendButton.addEventListener('click', () => {
        sendMessage();
    });

    // Other actions
    newConversationButton.addEventListener('click', () => {
        startNewConversation();
    });

    clearMessagesButton.addEventListener('click', () => {
        clearMessages();
    });

    showSettingsButton.addEventListener('click', () => {
        showSettings();
    });
}

function handleVSCodeMessage(message) {
    switch (message.type) {
        case 'newMessage':
            addMessage(message.data);
            break;
        case 'conversationSelected':
            loadConversation(message.data);
            break;
        case 'agentStatusChanged':
            updateAgentStatus(message.data);
            break;
        case 'connectionStatusChanged':
            updateConnectionStatus(message.data);
            break;
        case 'error':
            showError(message.data);
            break;
    }
}

function selectAgent(agentId) {
    document.querySelectorAll('.agent-item').forEach(item => {
        item.classList.remove('selected');
    });

    const selectedAgent = document.querySelector(`[data-agent-id="${agentId}"]`);
    if (selectedAgent) {
        selectedAgent.classList.add('selected');
        vscode.postMessage({
            command: 'selectAgent',
            agentId
        });
    }
}

function selectConversation(conversationId) {
    document.querySelectorAll('.conversation-item').forEach(item => {
        item.classList.remove('selected');
    });

    const selectedConv = document.querySelector(`[data-conversation-id="${conversationId}"]`);
    if (selectedConv) {
        selectedConv.classList.add('selected');
        currentConversationId = conversationId;
        vscode.postMessage({
            command: 'selectConversation',
            conversationId
        });
    }
}

function addMessage(message) {
    // Create message element
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${message.sourceAgent === 'vscode.core' ? 'outgoing' : 'incoming'}`;
    messageDiv.dataset.messageId = message.id;

    // Create message header
    const headerDiv = document.createElement('div');
    headerDiv.className = 'message-header';
    headerDiv.innerHTML = `
        <span class="message-source">${message.sourceAgent}</span>
        <span class="message-time">${new Date(message.timestamp).toLocaleTimeString()}</span>
    `;
    messageDiv.appendChild(headerDiv);

    // Create message content
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.innerHTML = formatMessageContent(message.content);
    messageDiv.appendChild(contentDiv);

    // Create message footer
    const footerDiv = document.createElement('div');
    footerDiv.className = 'message-footer';
    footerDiv.innerHTML = `
        <span class="message-type">${message.type}</span>
        ${message.metadata ? '<span class="message-meta"><i class="codicon codicon-info"></i></span>' : ''}
    `;
    messageDiv.appendChild(footerDiv);

    // Add to messages container
    messagesContainer.appendChild(messageDiv);
    scrollToBottom();
}

function formatMessageContent(content) {
    if (typeof content === 'string') {
        return content.replace(/\n/g, '<br>');
    }
    
    if (content.code) {
        return `<pre><code>${content.code}</code></pre>`;
    }
    
    return `<pre>${JSON.stringify(content, null, 2)}</pre>`;
}

function sendMessage() {
    const content = messageInput.value.trim();
    if (!content || !currentConversationId) return;

    vscode.postMessage({
        command: 'sendMessage',
        message: {
            conversationId: currentConversationId,
            content
        }
    });

    messageInput.value = '';
}

function startNewConversation() {
    vscode.postMessage({
        command: 'startConversation'
    });
}

function clearMessages() {
    if (currentConversationId) {
        vscode.postMessage({
            command: 'clearMessages',
            conversationId: currentConversationId
        });
        messagesContainer.innerHTML = '';
    }
}

function showSettings() {
    vscode.postMessage({
        command: 'showSettings'
    });
}

function updateAgentStatus(agent) {
    const agentItem = document.querySelector(`[data-agent-id="${agent.id}"]`);
    if (agentItem) {
        agentItem.classList.toggle('active', agent.active);
        agentItem.classList.toggle('disconnected', !agent.active);
    }
}

function updateConnectionStatus(status) {
    Object.entries(status).forEach(([id, connectionStatus]) => {
        const indicator = document.querySelector(`[data-connection-id="${id}"]`);
        if (indicator) {
            indicator.className = `status-indicator ${connectionStatus.toLowerCase()}`;
            indicator.querySelector('.codicon').className = 
                `codicon codicon-${connectionStatus === 'CONNECTED' ? 'check' : 'error'}`;
        }
    });
}

function showError(error) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = error;
    messagesContainer.appendChild(errorDiv);
    scrollToBottom();

    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
}

function scrollToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function restoreState() {
    // Restore any persisted state
    const state = vscode.getState();
    if (state) {
        currentConversationId = state.currentConversationId;
        if (currentConversationId) {
            selectConversation(currentConversationId);
        }
    }
}

// Save state when unloading
window.addEventListener('unload', () => {
    vscode.setState({ currentConversationId });
});