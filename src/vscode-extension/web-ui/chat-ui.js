// @ts-check

(function () {
    // @ts-ignore
    const vscode = acquireVsCodeApi();

    // Get references to elements
    const messageList = document.getElementById('message-list');
    const messageInput = document.getElementById('message-input'); // vscode-text-area
    const sendButton = document.getElementById('send-button'); // vscode-button
    const sessionSelect = document.getElementById('session-select'); // vscode-dropdown
    const newChatButton = document.getElementById('new-chat-button'); // vscode-button
    const clearChatButton = document.getElementById('clear-chat-button'); // vscode-button
    const loadingIndicator = document.getElementById('loading-indicator');

    // --- State --- 
    let isSending = false;

    // --- Functions --- 

    /**
     * Scrolls the message list to the bottom.
     */
    function scrollToBottom() {
        if (messageList) {
            messageList.scrollTop = messageList.scrollHeight;
        }
    }

    /**
     * Sends the message from the input field.
     */
    function sendMessage() {
        if (!messageInput || !sendButton || isSending) return;

        // @ts-ignore
        const text = messageInput.value.trim();
        if (text) {
            isSending = true;
            updateSendButtonState();
            vscode.postMessage({
                command: 'sendMessage',
                text: text
            });
            // @ts-ignore
            messageInput.value = ''; // Clear the input field
        }
    }

    /**
     * Updates the enabled/disabled state of the send button.
     */
    function updateSendButtonState() {
        if (!messageInput || !sendButton) return;
        // @ts-ignore
        const text = messageInput.value.trim();
        // @ts-ignore
        sendButton.disabled = text === '' || isSending;
    }

    /**
     * Shows or hides the loading indicator.
     * @param {boolean} show 
     */
    function setLoading(show) {
        if (loadingIndicator) {
            loadingIndicator.style.display = show ? 'flex' : 'none';
            if (show) {
                scrollToBottom(); // Scroll down when loading starts
            }
        }
        isSending = show; // Update sending state based on loading indicator
        updateSendButtonState();
    }

    // --- Event Listeners --- 

    // Send button click
    if (sendButton) {
        sendButton.addEventListener('click', sendMessage);
    }

    // Message input events
    if (messageInput) {
        // @ts-ignore
        messageInput.addEventListener('input', updateSendButtonState);
        // @ts-ignore
        messageInput.addEventListener('keydown', (e) => {
            // Send on Enter (but not Shift+Enter)
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault(); // Prevent newline
                sendMessage();
            }
        });
    }

    // New chat button click
    if (newChatButton) {
        newChatButton.addEventListener('click', () => {
            vscode.postMessage({ command: 'newChat' });
        });
    }

    // Clear chat button click
    if (clearChatButton) {
        clearChatButton.addEventListener('click', () => {
            // Optional: Add a confirmation dialog here
            vscode.postMessage({ command: 'clearChat' });
        });
    }

    // Session select change
    if (sessionSelect) {
        // @ts-ignore
        sessionSelect.addEventListener('change', (event) => {
            // @ts-ignore
            const selectedValue = event.target.value;
            if (selectedValue) {
                vscode.postMessage({
                    command: 'selectSession',
                    sessionId: selectedValue
                });
            }
        });
    }

    // Handle messages from the extension
    window.addEventListener('message', event => {
        const message = event.data; // The JSON data our extension sent
        switch (message.command) {
            case 'showLoading':
                setLoading(true);
                break;
            case 'hideLoading':
                setLoading(false);
                // The webview should be updated by the extension sending new HTML
                // But we ensure scroll happens after potential DOM updates
                setTimeout(scrollToBottom, 50); 
                break;
            // Add other cases as needed, e.g., 'updateMessages', 'updateSessions'
            // if not relying solely on full HTML updates.
        }
    });

    // --- Initialization --- 

    // Initial scroll to bottom
    scrollToBottom();

    // Initial button state
    updateSendButtonState();

    // Set focus to the input field on load
    if (messageInput) {
        // @ts-ignore
        messageInput.focus();
    }

}());