// @ts-check

(function () {
    const vscode = acquireVsCodeApi();
    
    // Ensure buttons are visible - runs immediately
    function ensureButtonVisibility() {
        // Target action buttons specifically
        const actionButtons = document.querySelectorAll('.action-button');
        actionButtons.forEach(button => {
            // Ensure basic styling to make buttons visible regardless of icons
            button.style.backgroundColor = 'var(--vscode-button-background, #0E639C)';
            button.style.color = 'var(--vscode-button-foreground, white)';
            button.style.border = '2px solid var(--vscode-contrastBorder, rgba(255, 255, 255, 0.6))';
            button.style.minWidth = '36px';
            button.style.minHeight = '36px';
            button.style.display = 'flex';
            button.style.flexDirection = 'column';
            button.style.alignItems = 'center';
            button.style.justifyContent = 'center';
            button.style.padding = '4px';
            button.style.position = 'relative';
            button.style.opacity = '1';
            button.style.visibility = 'visible';
            
            // Check if any icon element exists and is properly visible
            const icon = button.querySelector('.codicon');
            if (icon) {
                // Force icon color to be visible
                icon.style.color = 'var(--vscode-button-foreground, white)';
                icon.style.fontSize = '16px';
                
                const style = window.getComputedStyle(icon);
                const content = style.getPropertyValue('content');
                
                // If content is missing, icon might not be visible
                if (!content || content === 'normal' || content === 'none' || content === '') {
                    // Always add text labels for better visibility
                    const title = button.getAttribute('title');
                    if (title && !button.querySelector('.enhanced-button-label')) {
                        const shortTitle = title.split(' ').pop(); // Use last word of title
                        const textSpan = document.createElement('span');
                        textSpan.textContent = shortTitle;
                        textSpan.className = 'enhanced-button-label';
                        textSpan.style.fontSize = '9px';
                        textSpan.style.marginTop = '2px';
                        textSpan.style.display = 'block';
                        textSpan.style.textAlign = 'center';
                        textSpan.style.lineHeight = '1';
                        textSpan.style.maxWidth = '100%';
                        textSpan.style.whiteSpace = 'nowrap';
                        textSpan.style.overflow = 'hidden';
                        textSpan.style.textOverflow = 'ellipsis';
                        textSpan.style.fontWeight = 'bold';
                        button.appendChild(textSpan);
                    }
                }
            } else {
                // If no icon at all, create a text-only button
                const title = button.getAttribute('title');
                if (title && !button.querySelector('.enhanced-button-label')) {
                    const textSpan = document.createElement('span');
                    textSpan.textContent = title.split(' ').pop();
                    textSpan.className = 'enhanced-button-label';
                    textSpan.style.fontSize = '10px';
                    textSpan.style.fontWeight = 'bold';
                    textSpan.style.textAlign = 'center';
                    button.appendChild(textSpan);
                }
            }
        });
        
        // Also fix command menu button
        const commandMenuButton = document.getElementById('commandMenuButton');
        if (commandMenuButton) {
            commandMenuButton.style.backgroundColor = 'var(--vscode-button-background, #0E639C)';
            commandMenuButton.style.color = 'var(--vscode-button-foreground, white)';
            commandMenuButton.style.border = '1px solid var(--vscode-contrastBorder, rgba(255, 255, 255, 0.4))';
            
            // Add text label if missing
            if (!commandMenuButton.querySelector('.enhanced-button-label')) {
                const textSpan = document.createElement('span');
                textSpan.textContent = 'Menu';
                textSpan.className = 'enhanced-button-label';
                textSpan.style.fontSize = '9px';
                textSpan.style.marginTop = '2px';
                textSpan.style.display = 'block';
                commandMenuButton.appendChild(textSpan);
            }
        }
    }
    
    // Run immediately
    ensureButtonVisibility();
    // And also run after a delay to catch any buttons added after initial load
    setTimeout(ensureButtonVisibility, 300);
    setTimeout(ensureButtonVisibility, 800);
    setTimeout(ensureButtonVisibility, 1500);
    setTimeout(ensureButtonVisibility, 3000);
    
    // Keep checking periodically
    setInterval(ensureButtonVisibility, 5000);
    
    // Get DOM elements safely
    function getElement(id) {
        const element = document.getElementById(id);
        if (!element) {
            console.warn(`Element with id '${id}' not found`);
        }
        return element;
    }
    
    const messagesContainer = getElement('messages');
    const userInput = getElement('userInput');
    const sendButton = getElement('sendButton');
    let currentStreamingMessage = null;

    // Auto-resize the input field
    function autoResizeInput() {
        if (!userInput || !sendButton) {return;}
        userInput.style.height = 'auto';
        userInput.style.height = Math.min(userInput.scrollHeight, 150) + 'px';
        sendButton.disabled = !userInput.value.trim();
    }

    // Send a message
    function sendMessage() {
        if (!userInput) {
            console.warn('User input element not found');
            return;
        }
        
        const text = userInput.value.trim();
        if (!text) {
            console.warn('Cannot send empty message');
            return;
        }

        try {
            // Add to message history for up/down arrow navigation
            if (window.messageHistory) {
                window.messageHistory.add(text);
            }

            // Send to extension - it will handle adding the message to the UI
            vscode.postMessage({
                type: 'sendMessage',
                text: text
            });

            // Clear input
            userInput.value = '';
            autoResizeInput();
            if (sendButton) {
                sendButton.disabled = true;
            }

            // Show thinking indicator
            appendThinkingIndicator();
            
            console.log('Message sent successfully:', text.substring(0, 50) + '...');
        } catch (error) {
            console.error('Error sending message:', error);
            
            // Show error to user
            if (messagesContainer) {
                const errorDiv = document.createElement('div');
                errorDiv.className = 'message error';
                errorDiv.innerHTML = `<div class="message-content">Error sending message: ${error.message}</div>`;
                messagesContainer.appendChild(errorDiv);
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }
        }
    }

    // Show thinking indicator
    function appendThinkingIndicator() {
        if (!messagesContainer) {
            console.warn('Messages container not found');
            return;
        }
        
        // Remove any existing thinking indicator first
        removeThinkingIndicator();
        
        try {
            const indicator = document.createElement('div');
            indicator.className = 'thinking';
            indicator.id = 'thinking-indicator';
            
            const text = document.createElement('span');
            text.textContent = 'Thinking';
            
            const dots = document.createElement('div');
            dots.className = 'dots';
            for (let i = 0; i < 3; i++) {
                const dot = document.createElement('div');
                dot.className = 'dot';
                dots.appendChild(dot);
            }
            
            indicator.appendChild(text);
            indicator.appendChild(dots);
            messagesContainer.appendChild(indicator);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        } catch (error) {
            console.error('Error showing thinking indicator:', error);
        }
    }

    // Remove thinking indicator
    function removeThinkingIndicator() {
        try {
            const indicator = document.getElementById('thinking-indicator');
            if (indicator) {
                indicator.remove();
            }
        } catch (error) {
            console.error('Error removing thinking indicator:', error);
        }
    }

    // Toggle thinking indicator based on message from extension
    function toggleThinkingIndicator(show) {
        try {
            if (show) {
                appendThinkingIndicator();
            } else {
                removeThinkingIndicator();
            }
        } catch (error) {
            console.error('Error toggling thinking indicator:', error);
        }
    }

    // Format a timestamp
    function formatTimestamp(timestamp) {
        if (!timestamp) { return ''; }
        
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // Add a message to the UI
    function addMessageToUI(message, isPartial = false) {
        try {
            if (!messagesContainer) {
                console.error('Cannot add message: messages container not found');
                return null;
            }

            // Handle streaming updates
            if (isPartial && currentStreamingMessage) {
                updateStreamingMessage(currentStreamingMessage, message.content);
                return currentStreamingMessage;
            }

            const messageDiv = document.createElement('div');
            
            // Determine message class based on role
            let messageClass = 'assistant';
            if (typeof message === 'object' && message.role) {
                messageClass = message.role;
            } else if (typeof message === 'object' && message.metadata?.sender) {
                messageClass = message.metadata.sender;
            } else if (typeof message === 'string') {
                messageClass = message;
            }
            
            messageDiv.className = `message ${messageClass}`;
            
            // Set message ID if available
            if (message.id) {
                messageDiv.setAttribute('data-id', message.id);
            }
            
            // Create content div
            const contentDiv = document.createElement('div');
            contentDiv.className = 'message-content';
            
            // Get content from message object or string
            const content = typeof message === 'object' ? 
                (message.content || '') : 
                (typeof message === 'string' ? '' : String(message || ''));
            
            // Format content with code blocks if needed
            if (content.includes('```')) {
                contentDiv.innerHTML = formatCodeBlocks(content);
                
                // Look for any code blocks that need highlighting
                setTimeout(() => {
                    if (window.hljs) {
                        contentDiv.querySelectorAll('pre code').forEach((block) => {
                            try {
                                window.hljs.highlightElement(block);
                            } catch (e) {
                                console.warn('Error highlighting code block:', e);
                            }
                        });
                    }
                }, 10);
            } else {
                contentDiv.innerHTML = formatText(content);
            }
            
            messageDiv.appendChild(contentDiv);
            
            // Add star button to messages (except system messages)
            if (messageClass !== 'system' && !isPartial) {
                try {
                    const starButton = document.createElement('button');
                    starButton.className = 'message-star-button';
                    starButton.innerHTML = '<i class="codicon codicon-star-empty"></i>';
                    starButton.title = 'Star this message';
                    starButton.addEventListener('click', () => {
                        starMessage(messageDiv, content);
                    });
                    
                    const messageActions = document.createElement('div');
                    messageActions.className = 'message-actions';
                    messageActions.appendChild(starButton);
                    messageDiv.appendChild(messageActions);
                } catch (error) {
                    console.warn('Error adding star button:', error);
                }
            }
            
            // Add timestamp to the message
            if (!isPartial) {
                try {
                    const timestamp = document.createElement('div');
                    timestamp.className = 'message-time';
                    
                    // Get timestamp from message object or use current time
                    let messageTime;
                    if (typeof message === 'object' && message.timestamp) {
                        messageTime = new Date(message.timestamp);
                    } else {
                        messageTime = new Date();
                    }
                    
                    timestamp.textContent = formatTime(messageTime);
                    messageDiv.appendChild(timestamp);
                } catch (error) {
                    console.warn('Error adding timestamp:', error);
                }
            }
            
            messagesContainer.appendChild(messageDiv);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
            
            // If this is a streaming message, set it as current
            if (isPartial) {
                currentStreamingMessage = messageDiv;
            }
            
            return messageDiv;
        } catch (error) {
            console.error('Error adding message to UI:', error);
            return null;
        }
    }

    // Format time in a friendly way (e.g., "3:45 PM")
    function formatTime(date) {
        let hours = date.getHours();
        const minutes = date.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        
        hours = hours % 12;
        hours = hours ? hours : 12; // Convert 0 to 12 for 12-hour format
        const minutesStr = minutes < 10 ? '0' + minutes : minutes;
        
        return `${hours}:${minutesStr} ${ampm}`;
    }

    // Format text with markdown-like syntax highlighting
    function formatText(text) {
        if (!text) { return ''; }
        
        // Basic markdown-like formatting
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')  // Bold
            .replace(/\*(.*?)\*/g, '<em>$1</em>')              // Italic
            .replace(/`([^`]+)`/g, '<code>$1</code>')          // Inline code
            .replace(/\n/g, '<br>');                          // Line breaks
    }
    
    // Update a streaming message with new content
    function updateStreamingMessage(messageDiv, content) {
        const contentDiv = messageDiv.querySelector('.message-content');
        if (contentDiv) {
            if (content.includes('```')) {
                contentDiv.innerHTML = formatCodeBlocks(content);
                
                // Highlight code blocks
                if (window.hljs) {
                    contentDiv.querySelectorAll('pre code').forEach((block) => {
                        window.hljs.highlightBlock(block);
                    });
                }
            } else {
                contentDiv.innerHTML = formatText(content);
            }
            
            // Auto-scroll while streaming
            const isNearBottom = messagesContainer.scrollHeight - messagesContainer.scrollTop - messagesContainer.clientHeight < 100;
            if (isNearBottom) {
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }
        }
    }

    // Format code blocks with syntax highlighting
    function formatCodeBlocks(text) {
        return text.replace(/```(\w+)?\n([\s\S]*?)```/g, (_, lang, code) => {
            const language = lang || '';
            const escapedCode = escapeHtml(code.trim());
            
            // Create wrapper elements
            const wrapper = document.createElement('div');
            wrapper.className = 'code-block-wrapper';
            
            const header = document.createElement('div');
            header.className = 'code-block-header';
            
            const langLabel = document.createElement('span');
            langLabel.className = 'code-block-lang';
            langLabel.textContent = language || 'text';
            
            const copyButton = document.createElement('button');
            copyButton.className = 'copy-code-button';
            copyButton.innerHTML = '<i class="codicon codicon-copy"></i>';
            copyButton.title = 'Copy code';
            copyButton.addEventListener('click', function(e) {
                e.stopPropagation();
                navigator.clipboard.writeText(code.trim());
                this.innerHTML = '<i class="codicon codicon-check"></i>';
                this.title = 'Copied!';
                
                // Show a brief notification
                const notification = document.createElement('div');
                notification.className = 'copy-notification';
                notification.textContent = 'Code copied to clipboard';
                document.body.appendChild(notification);
                
                // Animate and remove notification
                setTimeout(() => {
                    notification.classList.add('show');
                    setTimeout(() => {
                        notification.classList.remove('show');
                        setTimeout(() => notification.remove(), 300);
                    }, 1500);
                }, 0);
                
                setTimeout(() => {
                    this.innerHTML = '<i class="codicon codicon-copy"></i>';
                    this.title = 'Copy code';
                }, 2000);
            });
            
            header.appendChild(langLabel);
            header.appendChild(copyButton);
            
            const pre = document.createElement('pre');
            const codeElement = document.createElement('code');
            
            if (language) {
                codeElement.className = `language-${language}`;
            }
            
            // Add line numbers if code has multiple lines
            const lines = code.trim().split('\n');
            if (lines.length > 1) {
                pre.classList.add('with-line-numbers');
                
                // Create line numbers container
                const lineNumbers = document.createElement('div');
                lineNumbers.className = 'line-numbers';
                
                for (let i = 1; i <= lines.length; i++) {
                    const lineNumber = document.createElement('div');
                    lineNumber.className = 'line-number';
                    lineNumber.textContent = i;
                    lineNumbers.appendChild(lineNumber);
                }
                
                pre.appendChild(lineNumbers);
            }
            
            codeElement.innerHTML = escapedCode;
            pre.appendChild(codeElement);
            
            wrapper.appendChild(header);
            wrapper.appendChild(pre);
            
            // Queue the highlighting to happen after the element is added to the DOM
            setTimeout(() => {
                if (window.hljs && language) {
                    try {
                        hljs.highlightElement(codeElement);
                    } catch (e) {
                        console.error('Error highlighting code:', e);
                    }
                }
            }, 0);
            
            return wrapper.outerHTML;
        });
    }

    // Escape HTML to prevent XSS
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // Clear all messages from the UI
    function clearMessagesFromUI() {
        if (!messagesContainer) { return; }
        
        // Preserve any persistent elements like feature indicators
        const welcomeMessages = Array.from(messagesContainer.querySelectorAll('.welcome-message'));
        const featureIndicators = Array.from(messagesContainer.querySelectorAll('.feature-indicator'));
        
        // Clear the container
        messagesContainer.innerHTML = '';
        
        // Re-add any preserved elements
        welcomeMessages.forEach(element => messagesContainer.appendChild(element));
        featureIndicators.forEach(element => messagesContainer.appendChild(element));
        
        // Reset streaming message reference
        currentStreamingMessage = null;
    }

    // Handle VS Code messages
    window.addEventListener('message', event => {
        try {
            const message = event.data;
            console.log('Received message from extension:', message.type);

            switch (message.type) {
                case 'addMessage':
                    try {
                        // Create a message object that combines all parameters
                        const messageObj = {
                            role: message.role,
                            content: message.content,
                            timestamp: message.timestamp,
                            metadata: message.metadata || {},
                            id: message.id
                        };
                        addMessageToUI(messageObj, message.isPartial);
                    } catch (error) {
                        console.error('Error adding message to UI:', error);
                    }
                    break;
                    
                case 'updateMessage':
                    try {
                        updateMessageInUI(message.id, message.content);
                    } catch (error) {
                        console.error('Error updating message in UI:', error);
                    }
                    break;
                    
                case 'clearMessages':
                    try {
                        clearMessagesFromUI();
                    } catch (error) {
                        console.error('Error clearing messages from UI:', error);
                    }
                    break;
                    
                case 'showWelcomeMessage':
                    try {
                        showWelcomeMessage();
                    } catch (error) {
                        console.error('Error showing welcome message:', error);
                    }
                    break;
                    
                case 'thinking':
                    try {
                        toggleThinkingIndicator(message.show);
                    } catch (error) {
                        console.error('Error toggling thinking indicator:', error);
                    }
                    break;
                    
                case 'error':
                    try {
                        showError(message.message);
                    } catch (error) {
                        console.error('Error showing error message:', error);
                    }
                    break;
                    
                case 'updateProvider':
                    try {
                        updateProviderBadge(message.provider);
                    } catch (error) {
                        console.error('Error updating provider badge:', error);
                    }
                    break;
                    
                case 'providerSwitched':
                    try {
                        handleProviderSwitch(message.from, message.to, message.reason);
                    } catch (error) {
                        console.error('Error handling provider switch:', error);
                    }
                    break;
                    
                case 'updateFeatureStatus':
                    try {
                        updateFeatureStatus(message.state, message.text);
                    } catch (error) {
                        console.error('Error updating feature status:', error);
                    }
                    break;
                
                case 'notification':
                    try {
                        showNotification(message.message);
                    } catch (error) {
                        console.error('Error showing notification:', error);
                    }
                    break;
                    
                case 'updateMetrics':
                    try {
                        handleMetricsUpdate(message.data);
                    } catch (error) {
                        console.error('Error handling metrics update:', error);
                    }
                    break;
                    
                case 'savedChatsUpdated':
                    try {
                        if (window.savedChatsManager) {
                            window.savedChatsManager.updateSavedChatsList(message.chats);
                        }
                    } catch (error) {
                        console.error('Error updating saved chats:', error);
                    }
                    break;
                    
                case 'currentChatChanged':
                    try {
                        if (window.savedChatsManager) {
                            window.savedChatsManager.selectChat(message.chatId);
                        }
                    } catch (error) {
                        console.error('Error selecting chat:', error);
                    }
                    break;
                    
                default:
                    console.warn('Unknown message type received from extension:', message.type);
                    if (typeof message.type === 'undefined') {
                        console.error('Offending message object:', JSON.stringify(message));
                    }
                    break;
            }
        } catch (error) {
            console.error('Error handling message from extension:', error);
        }
    });
    
    // Show notification using the notification system
    function showNotification(message, type = 'info') {
        try {
            if (window.notifications) {
                window.notifications.show(message, type);
            } else {
                // Fallback to simple alert if notification system isn't available
                console.log(`Notification: ${message}`);
                
                // Create a simple notification element
                const notification = document.createElement('div');
                notification.className = `notification notification-${type}`;
                notification.textContent = message;
                notification.style.cssText = `
                    position: fixed;
                    top: 10px;
                    right: 10px;
                    background: var(--vscode-notifications-background);
                    color: var(--vscode-notifications-foreground);
                    border: 1px solid var(--vscode-notifications-border);
                    padding: 8px 12px;
                    border-radius: 4px;
                    z-index: 1000;
                    max-width: 300px;
                    word-wrap: break-word;
                `;
                
                document.body.appendChild(notification);
                
                // Auto-remove after 3 seconds
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 3000);
            }
        } catch (error) {
            console.error('Error showing notification:', error);
        }
    }

    // Show error message
    function showError(errorMessage) {
        try {
            if (!messagesContainer) {
                console.error('Cannot show error: messages container not found');
                return;
            }
            
            const errorDiv = document.createElement('div');
            errorDiv.className = 'message error';
            
            const contentDiv = document.createElement('div');
            contentDiv.className = 'message-content';
            contentDiv.innerHTML = `<strong>Error:</strong> ${formatText(errorMessage)}`;
            
            errorDiv.appendChild(contentDiv);
            messagesContainer.appendChild(errorDiv);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
            
            // Also show as notification
            showNotification(errorMessage, 'error');
        } catch (error) {
            console.error('Error showing error message:', error);
        }
    }

    // Update provider badge
    function updateProviderBadge(providerName) {
        try {
            const providerBadge = document.getElementById('providerName');
            if (providerBadge) {
                providerBadge.textContent = providerName || 'VS Code';
            }
        } catch (error) {
            console.error('Error updating provider badge:', error);
        }
    }

    // Handle provider switch
    function handleProviderSwitch(from, to, reason) {
        try {
            updateProviderBadge(to);
            
            let message = `Switched from ${from} to ${to}`;
            if (reason) {
                message += ` (${reason})`;
            }
            
            showNotification(message, 'info');
        } catch (error) {
            console.error('Error handling provider switch:', error);
        }
    }

    // Update feature status
    function updateFeatureStatus(state, text) {
        try {
            const indicator = document.getElementById('active-feature-indicator');
            if (indicator) {
                const nameElement = indicator.querySelector('.feature-name');
                const dotElement = indicator.querySelector('.status-dot');
                
                if (nameElement) {
                    nameElement.textContent = text;
                }
                
                if (dotElement) {
                    // Remove existing state classes
                    dotElement.classList.remove('ready', 'working', 'error');
                    // Add new state class
                    dotElement.classList.add(state);
                }
                
                // Update indicator class
                indicator.classList.remove('ready', 'working', 'error');
                indicator.classList.add(state);
            }
        } catch (error) {
            console.error('Error updating feature status:', error);
        }
    }

    // Update message in UI (for streaming)
    function updateMessageInUI(messageId, content) {
        try {
            // Find message by ID or find the current streaming message
            let messageDiv = currentStreamingMessage;
            
            if (messageId) {
                // Try to find by ID first
                const messages = messagesContainer.querySelectorAll('.message');
                for (const msg of messages) {
                    if (msg.getAttribute('data-id') === messageId) {
                        messageDiv = msg;
                        break;
                    }
                }
            }
            
            if (!messageDiv) {
                // Create new streaming message if none exists
                messageDiv = document.createElement('div');
                messageDiv.className = 'message assistant';
                messageDiv.setAttribute('data-id', messageId || `stream_${Date.now()}`);
                
                const contentDiv = document.createElement('div');
                contentDiv.className = 'message-content';
                messageDiv.appendChild(contentDiv);
                
                messagesContainer.appendChild(messageDiv);
                currentStreamingMessage = messageDiv;
            }
            
            // Update content
            updateStreamingMessage(messageDiv, content);
        } catch (error) {
            console.error('Error updating message in UI:', error);
        }
    }
    
    // Star a message
    function starMessage(messageElement, content) {
        const messageId = `msg_${Date.now()}_${Math.random()}`;
        const note = prompt('Add a note for this starred message (optional):');
        
        // Update UI
        const starButton = messageElement.querySelector('.message-star-button i');
        if (starButton) {
            starButton.className = 'codicon codicon-star-full';
            starButton.parentNode.title = 'Unstar this message';
            starButton.parentNode.onclick = () => unstarMessage(messageElement, messageId);
        }
        
        // Send to extension
        vscode.postMessage({
            type: 'starMessage',
            messageId: messageId,
            content: content,
            note: note
        });
    }
    
    // Unstar a message
    function unstarMessage(messageElement, messageId) {
        // Update UI
        const starButton = messageElement.querySelector('.message-star-button i');
        if (starButton) {
            starButton.className = 'codicon codicon-star-empty';
            starButton.parentNode.title = 'Star this message';
            starButton.parentNode.onclick = () => starMessage(messageElement, messageElement.querySelector('.message-content').textContent);
        }
        
        // Send to extension
        vscode.postMessage({
            type: 'unstarMessage',
            messageId: messageId
        });
    }
    
    // Handle metrics update from the extension
    function handleMetricsUpdate(data) {
        try {
            console.log('Metrics updated:', data);
            
            // Store metrics in a global variable for debugging
            window.extensionMetrics = data;
            
            // Update any UI elements that show metrics
            const metricsIndicator = document.getElementById('metrics-indicator');
            if (metricsIndicator && data.metrics) {
                const { totalGenerations, successfulGenerations, errorRate } = data.metrics;
                metricsIndicator.innerHTML = `
                    <span class="metric-item">Generations: ${totalGenerations}</span>
                    <span class="metric-item">Success: ${successfulGenerations}</span>
                    <span class="metric-item">Error Rate: ${(errorRate * 100).toFixed(1)}%</span>
                `;
            }
            
            // Optionally show performance notifications for high error rates
            if (data.metrics && data.metrics.errorRate > 0.5) {
                console.warn('High error rate detected:', data.metrics.errorRate);
            }
        } catch (error) {
            console.error('Error processing metrics update:', error);
        }
    }

    // Event listeners
    userInput.addEventListener('input', autoResizeInput);
    userInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            sendMessage();
        } else if (event.key === 'Enter' && event.shiftKey) {
            // Allow Shift+Enter to insert a line break
            // The default behavior will insert a newline, no need to do anything
            autoResizeInput();
        } else if (event.key === 'ArrowUp' && userInput.value.trim() === '') {
            // Use the history navigation module
            event.preventDefault();
            if (window.messageHistory) {
                window.messageHistory.navigateUp();
            }
        } else if (event.key === 'ArrowDown' && userInput.value.trim() !== '') {
            // Use the history navigation module
            event.preventDefault();
            if (window.messageHistory) {
                window.messageHistory.navigateDown();
            }
        } else if (event.key === 'Tab' && commandsDropdown.classList.contains('show')) {
            // Handle Tab navigation in the command menu
            event.preventDefault();
            const focusedItem = document.querySelector('.command-item.hover');
            const items = Array.from(commandItems);
            
            if (!focusedItem) {
                if (items.length) {
                    items[0].classList.add('hover');
                }
            } else {
                focusedItem.classList.remove('hover');
                const currentIndex = items.indexOf(focusedItem);
                const nextIndex = (currentIndex + 1) % items.length;
                items[nextIndex].classList.add('hover');
            }
        }
        // Note: We're handling Escape in the keyboard-shortcuts.js file now
    });
    sendButton.addEventListener('click', sendMessage);

    // Command menu functionality
    const commandMenuButton = document.getElementById('commandMenuButton');
    const commandsDropdown = document.getElementById('commandsDropdown');
    const commandItems = document.querySelectorAll('.command-item');

    // Toggle command menu on click
    if (commandMenuButton) {
        commandMenuButton.addEventListener('click', (event) => {
            event.stopPropagation();
            commandsDropdown.classList.toggle('show');
            
            // Add active state to button when menu is open
            if (commandsDropdown.classList.contains('show')) {
                commandMenuButton.classList.add('active');
            } else {
                commandMenuButton.classList.remove('active');
            }
        });

        // Close the dropdown if clicked outside
        document.addEventListener('click', (event) => {
            if (!event.target.closest('.commands-menu')) {
                if (commandsDropdown.classList.contains('show')) {
                    commandsDropdown.classList.remove('show');
                    commandMenuButton.classList.remove('active');
                }
            }
        });

        // Handle command item click
        commandItems.forEach(item => {
            item.addEventListener('click', () => {
                const command = item.getAttribute('data-command');
                if (command) {
                    // Visual feedback on click
                    item.classList.add('clicked');
                    setTimeout(() => item.classList.remove('clicked'), 200);
                    
                    // Send command to VS Code
                    vscode.postMessage({
                        type: 'executeCommand',
                        command: command
                    });
                    
                    // Hide dropdown after selection
                    commandsDropdown.classList.remove('show');
                    commandMenuButton.classList.remove('active');
                }
            });
            
            // Add hover effect
            item.addEventListener('mouseenter', () => {
                item.classList.add('hover');
            });
            
            item.addEventListener('mouseleave', () => {
                item.classList.remove('hover');
            });
        });
    }

    // Quick action buttons functionality
    const actionButtons = document.querySelectorAll('.action-button');
    
    if (actionButtons.length > 0) {
        actionButtons.forEach(button => {
            button.addEventListener('click', () => {
                const command = button.getAttribute('data-command');
                if (command) {
                    // Visual feedback on click
                    button.classList.add('clicked');
                    setTimeout(() => button.classList.remove('clicked'), 200);
                    
                    // Send command to VS Code
                    vscode.postMessage({
                        type: 'executeCommand',
                        command: command
                    });
                }
            });
        });
    }

    // Send viewerReady message to load saved messages
    window.addEventListener('DOMContentLoaded', () => {
        // Initialize highlight.js if available
        if (window.hljs) {
            try {
                // Configure highlight.js
                hljs.configure({
                    languages: ['javascript', 'typescript', 'python', 'html', 'css', 'json', 'xml', 'bash', 'shell'],
                    ignoreUnescapedHTML: true
                });
                
                console.log('Highlight.js initialized successfully');
            } catch (e) {
                console.error('Error initializing highlight.js:', e);
            }
        } else {
            console.warn('Highlight.js not available');
        }
        
        // Initialize search functionality if available
        if (window.chatSearch) {
            console.log('Search functionality available');
        }
        
        // Initialize message history if available
        if (window.messageHistory) {
            console.log('Message history navigation available');
            
            // Rebuild history based on existing messages
            window.messageHistory.rebuild();
        }
        
        // Additional initialization for button visibility
        setTimeout(() => {
            // Ensure all buttons are visible by adding explicit styles
            const allButtons = document.querySelectorAll('.action-button, .command-menu-button, #searchToggleButton');
            allButtons.forEach(button => {
                button.style.backgroundColor = 'var(--vscode-button-background, #0E639C)';
                button.style.color = 'var(--vscode-button-foreground, white)';
                button.style.border = '1px solid var(--vscode-contrastBorder, rgba(255, 255, 255, 0.4))';
            });
            console.log('Button visibility enhanced');
        }, 300);
        
        // Notify the extension that the viewer is ready to receive saved messages
        vscode.postMessage({
            type: 'viewerReady'
        });
    });
    
    // Clear chat button
    const clearChatButton = document.getElementById('clearChatButton');
    if (clearChatButton) {
        clearChatButton.addEventListener('click', () => {
            if (confirm('Are you sure you want to clear the chat history?')) {
                vscode.postMessage({
                    type: 'clearHistory'
                });
            }
        });
    }
    
    // New Chat button
    const newChatButton = document.getElementById('newChatButton');
    if (newChatButton) {
        newChatButton.addEventListener('click', () => {
            // Start a fresh chat without confirmation (preserve history)
            vscode.postMessage({
                type: 'newChat'
            });
            
            // Visual feedback animation
            newChatButton.classList.add('clicked');
            setTimeout(() => newChatButton.classList.remove('clicked'), 200);
        });
    }

    // Initialize the extension
    function initializeExtension() {
        console.log('Chat extension initialized');
        
        // Continue with existing initialization
        if (document.querySelector('.chat-container')) {
            initializeChat();
            initializeSearch();
            initializeHistoryNavigation();
            initializeKeyboardShortcuts();
        } else {
            console.error('Chat container not found - skipping initialization');
        }
    }

    function initializeChat() {
        // Existing chat initialization code...
    }

    function initializeSearch() {
        // Existing search initialization code...
    }

    function initializeHistoryNavigation() {
        // Existing history navigation initialization code...
    }

    function initializeKeyboardShortcuts() {
        // Existing keyboard shortcuts initialization code...
    }

    // Initial setup
    autoResizeInput();
    initializeExtension();
    
    // Initialize saved chats if available
    if (window.savedChatsManager && typeof window.savedChatsManager.initialize === 'function') {
        window.savedChatsManager.initialize();
    } else {
        // Create window.savedChatsManager if not available
        window.savedChatsManager = {
            initialize: function() {
                if (typeof initialize === 'function') {
                    initialize();
                }
            },
            updateSavedChatsList: function(chats) {
                if (typeof updateSavedChatsList === 'function') {
                    updateSavedChatsList(chats);
                }
            },
            selectChat: function(chatId) {
                if (typeof selectChat === 'function') {
                    selectChat(chatId);
                }
            }
        };
        
        // Attempt to initialize saved chats
        window.savedChatsManager.initialize();
    }

    // Show welcome message if no messages
    function showWelcomeMessage() {
        // Use the enhanced welcome message if available, otherwise fall back to basic
        if (window.showEnhancedWelcomeMessage && messagesContainer) {
            window.showEnhancedWelcomeMessage(messagesContainer);
        } else if (messagesContainer && messagesContainer.children.length === 0) {
            // Fallback to basic welcome message
            const welcomeDiv = document.createElement('div');
            welcomeDiv.className = 'welcome-message';
            welcomeDiv.innerHTML = `
                <h2>Welcome to The New Fuse</h2>
                <p>Type a message below to start chatting with your AI assistant.</p>
            `;
            messagesContainer.appendChild(welcomeDiv);
        }
    }

    // Call showWelcomeMessage initially
    setTimeout(showWelcomeMessage, 1000);
})();
