// Communication Hub UI JavaScript
(function() {
    // Get VS Code API
    const vscode = acquireVsCodeApi();
    
    // DOM Elements
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-button');
    const refreshButton = document.querySelector('.refresh-button');
    const clearButton = document.querySelector('.clear-button');
    const messageList = document.querySelector('.message-list');
    const agentList = document.querySelector('.agent-list');
    
    // Initialize
    document.addEventListener('DOMContentLoaded', initialize);
    
    function initialize() {
        // Setup event listeners
        sendButton.addEventListener('click', sendMessage);
        messageInput.addEventListener('keydown', handleKeyDown);
        refreshButton.addEventListener('click', refreshAgents);
        clearButton.addEventListener('click', clearMessages);
        
        // Request initial data
        requestAgentList();
        
        // Setup message handler
        window.addEventListener('message', handleMessage);
    }
    
    /**
     * Send a message to the extension
     */
    function sendMessage() {
        const text = messageInput.value.trim();
        if (text) {
            vscode.postMessage({
                command: 'sendMessage',
                text: text
            });
            messageInput.value = '';
            messageInput.focus();
        }
    }
    
    /**
     * Handle keyboard events
     */
    function handleKeyDown(event) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            sendMessage();
        }
    }
    
    /**
     * Request the list of agents from the extension
     */
    function requestAgentList() {
        vscode.postMessage({
            command: 'getAgents'
        });
    }
    
    /**
     * Clear all messages
     */
    function clearMessages() {
        vscode.postMessage({
            command: 'clearMessages'
        });
        messageList.innerHTML = '';
    }
    
    /**
     * Refresh the agent list
     */
    function refreshAgents() {
        requestAgentList();
    }
    
    /**
     * Handle messages from the extension
     */
    function handleMessage(event) {
        const message = event.data;
        
        switch (message.command) {
            case 'newMessage':
                addMessage(message.message);
                break;
                
            case 'agentList':
                updateAgentList(message.agents);
                break;
                
            case 'clearMessages':
                messageList.innerHTML = '';
                break;
                
            case 'showError':
                showError(message.error);
                break;
        }
    }
    
    /**
     * Add a message to the UI
     */
    function addMessage(message) {
        const messageElement = document.createElement('div');
        messageElement.className = `message ${getMessageClass(message)}`;
        
        const senderElement = document.createElement('div');
        senderElement.className = 'message-sender';
        
        // Get sender info
        const sender = message.metadata?.sender || 'unknown';
        const timestamp = message.metadata?.timestamp 
            ? new Date(message.metadata.timestamp).toLocaleTimeString()
            : new Date().toLocaleTimeString();
            
        senderElement.innerHTML = `<span class="sender-name">${escapeHtml(sender)}</span> <span class="timestamp">${timestamp}</span>`;
        messageElement.appendChild(senderElement);
        
        // Add message content
        const contentElement = document.createElement('div');
        contentElement.className = 'message-content';
        contentElement.textContent = message.content;
        messageElement.appendChild(contentElement);
        
        // Add to message list
        messageList.appendChild(messageElement);
        
        // Scroll to bottom
        messageList.scrollTop = messageList.scrollHeight;
    }
    
    /**
     * Get message class based on message type
     */
    function getMessageClass(message) {
        const direction = message.metadata?.direction || '';
        const sender = message.metadata?.sender || '';
        
        if (direction === 'outgoing' || sender === 'user') {
            return 'outgoing';
        } else if (direction === 'incoming') {
            return 'incoming';
        } else if (sender === 'system') {
            return 'system';
        }
        
        return '';
    }
    
    /**
     * Update the agent list UI
     */
    function updateAgentList(agents) {
        agentList.innerHTML = '';
        
        if (!agents || agents.length === 0) {
            const noAgentsElement = document.createElement('div');
            noAgentsElement.className = 'no-agents';
            noAgentsElement.textContent = 'No agents connected';
            agentList.appendChild(noAgentsElement);
            return;
        }
        
        agents.forEach(agent => {
            const agentElement = document.createElement('div');
            agentElement.className = `agent-item ${agent.status ? agent.status.toLowerCase() : ''}`;
            
            const nameElement = document.createElement('div');
            nameElement.className = 'agent-name';
            nameElement.textContent = agent.name;
            agentElement.appendChild(nameElement);
            
            const idElement = document.createElement('div');
            idElement.className = 'agent-id';
            idElement.textContent = agent.id;
            agentElement.appendChild(idElement);
            
            if (agent.capabilities && agent.capabilities.length > 0) {
                const capsElement = document.createElement('div');
                capsElement.className = 'agent-capabilities';
                capsElement.textContent = `Capabilities: ${agent.capabilities.join(', ')}`;
                agentElement.appendChild(capsElement);
            }
            
            // Add click listener to send direct message (future enhancement)
            agentElement.addEventListener('click', () => {
                messageInput.value = `@${agent.id} `;
                messageInput.focus();
            });
            
            agentList.appendChild(agentElement);
        });
    }
    
    /**
     * Show error message
     */
    function showError(errorMessage) {
        // Create the error element
        const errorElement = document.createElement('div');
        errorElement.className = 'message error';
        errorElement.innerHTML = `<div class="error-header"><i class="codicon codicon-error"></i> Error</div>
                                  <div class="error-message">${escapeHtml(errorMessage)}</div>`;
        
        // Add to message list
        messageList.appendChild(errorElement);
        
        // Scroll to bottom
        messageList.scrollTop = messageList.scrollHeight;
    }
    
    /**
     * Escape HTML to prevent XSS
     */
    function escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
})();
