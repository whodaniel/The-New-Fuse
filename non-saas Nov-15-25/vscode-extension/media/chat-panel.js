// Enhanced Chat Panel JavaScript
(function () {
    const vscode = acquireVsCodeApi();
    let currentSession = null;
    let isProcessing = false;

    // Utility functions
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function renderMessage(msg) {
        const div = document.createElement('div');
        const roleClass = msg.role === 'user' ? 'user' : msg.role === 'assistant' ? 'assistant' : 'system';
        div.className = `chat-message ${roleClass}`;
        
        const timestamp = msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString() : '';
        
        div.innerHTML = `
            <div class="message-header">
                <span class="role">${getRoleDisplayName(msg.role)}</span>
                ${timestamp ? `<span class="timestamp">${timestamp}</span>` : ''}
                <button class="copy-btn" title="Copy message">
                    <i class="codicon codicon-copy"></i>
                </button>
            </div>
            <div class="message-content">${renderEnhancedMarkdown(msg.content)}</div>
        `;
        
        // Add copy functionality
        div.querySelector('.copy-btn').addEventListener('click', () => {
            navigator.clipboard.writeText(msg.content).then(() => {
                showToast('Message copied to clipboard');
            });
        });
        
        return div;
    }

    function getRoleDisplayName(role) {
        const roleMap = {
            'user': 'You',
            'assistant': 'AI Assistant',
            'system': 'System'
        };
        return roleMap[role] || role;
    }

    function renderEnhancedMarkdown(text) {
        if (!text) return '';
        
        let html = escapeHtml(text);
        
        // Code blocks with language detection
        html = html.replace(/```(\w+)?\n?([\s\S]*?)```/g, (match, lang, code) => {
            const language = lang || 'plaintext';
            return `<pre><code class="language-${language}">${escapeHtml(code.trim())}</code></pre>`;
        });
        
        // Inline code
        html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
        
        // Bold
        html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        
        // Italic
        html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
        
        // Links
        html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
        
        // Line breaks
        html = html.replace(/\n/g, '<br>');
        
        return html;
    }

    function appendMessage(msg, scroll = true) {
        const container = document.getElementById('chat-messages');
        if (!container) return;
        
        container.appendChild(renderMessage(msg));
        if (scroll) {
            container.scrollTop = container.scrollHeight;
        }
    }

    function clearMessages() {
        const container = document.getElementById('chat-messages');
        if (container) {
            container.innerHTML = `
                <div class="welcome-message">
                    <i class="codicon codicon-rocket"></i>
                    <h3>Welcome to The New Fuse AI Assistant</h3>
                    <p>Ask me anything about your code, project, or development workflow.</p>
                </div>
            `;
        }
    }

    function clearInput() {
        const input = document.getElementById('chat-input');
        if (input) input.value = '';
    }

    function setThinking(isThinking) {
        isProcessing = isThinking;
        const indicator = document.getElementById('thinking-indicator');
        const sendButton = document.getElementById('send-button');
        
        if (indicator) {
            indicator.style.display = isThinking ? 'flex' : 'none';
        }
        
        if (sendButton) {
            sendButton.disabled = isThinking;
        }
    }

    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 8px;
            color: white;
            font-size: 14px;
            z-index: 1000;
            animation: slideIn 0.3s ease;
            ${type === 'error' ? 'background: var(--vscode-errorForeground);' :
              type === 'success' ? 'background: var(--vscode-terminal-ansiGreen);' :
              'background: var(--vscode-textLink-foreground);'}
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    function handleError(error) {
        console.error('Chat error:', error);
        showToast(error.message || 'An error occurred', 'error');
    }

    function sendMessage() {
        if (isProcessing) return;
        
        const input = document.getElementById('chat-input');
        const text = input?.value.trim();
        
        if (!text) {
            showToast('Please enter a message', 'error');
            return;
        }
        
        vscode.postMessage({
            command: 'chat:send',
            text,
            session: currentSession
        });
        
        clearInput();
    }

    function loadSession(sessionId) {
        currentSession = sessionId;
        vscode.postMessage({
            command: 'chat:loadSession',
            sessionId
        });
    }

    function createNewSession() {
        vscode.postMessage({ command: 'chat:newSession' });
    }

    // Event listeners
    document.addEventListener('DOMContentLoaded', () => {
        const sendButton = document.getElementById('send-button');
        const chatInput = document.getElementById('chat-input');
        const newSessionBtn = document.getElementById('new-session-btn');
        const clearChatBtn = document.getElementById('clear-chat-btn');
        const sessionSelector = document.getElementById('session-selector');

        if (sendButton) {
            sendButton.addEventListener('click', sendMessage);
        }

        if (chatInput) {
            chatInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                }
            });
            
            // Auto-resize textarea
            chatInput.addEventListener('input', () => {
                chatInput.style.height = 'auto';
                chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + 'px';
            });
        }

        if (newSessionBtn) {
            newSessionBtn.addEventListener('click', createNewSession);
        }

        if (clearChatBtn) {
            clearChatBtn.addEventListener('click', () => {
                if (confirm('Clear all messages in this session?')) {
                    vscode.postMessage({ command: 'chat:clear' });
                }
            });
        }

        if (sessionSelector) {
            sessionSelector.addEventListener('change', (e) => {
                loadSession(e.target.value);
            });
        }
    });

    // Message handling
    window.addEventListener('message', event => {
        const { command, payload } = event.data;
        
        switch (command) {
            case 'chat:renderMessages':
                clearMessages();
                (payload.messages || []).forEach(msg => appendMessage(msg, false));
                if (payload.messages?.length > 0) {
                    const container = document.getElementById('chat-messages');
                    if (container) container.scrollTop = container.scrollHeight;
                }
                break;
                
            case 'chat:appendMessage':
                appendMessage(payload);
                break;
                
            case 'chat:clearInput':
                clearInput();
                break;
                
            case 'chat:setThinking':
                setThinking(payload);
                break;
                
            case 'chat:updateSessions':
                updateSessionSelector(payload.sessions);
                break;
                
            case 'chat:error':
                handleError(payload);
                break;
                
            case 'chat:sessionCreated':
                currentSession = payload.sessionId;
                showToast('New session created');
                break;
        }
    });

    function updateSessionSelector(sessions) {
        const selector = document.getElementById('session-selector');
        if (!selector) return;
        
        selector.innerHTML = '<option value="">Select Session...</option>';
        sessions.forEach(session => {
            const option = document.createElement('option');
            option.value = session.id;
            option.textContent = session.name || `Session ${session.id.substring(0, 8)}`;
            option.selected = session.id === currentSession;
            selector.appendChild(option);
        });
    }

    // Initialize
    vscode.postMessage({ command: 'chat:ready' });
})();
