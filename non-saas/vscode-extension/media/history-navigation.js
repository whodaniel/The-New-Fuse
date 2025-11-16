/**
 * Message history navigation for The New Fuse chat interface
 */

(function () {
    // Message history management
    let messageHistory = [];
    let currentHistoryIndex = -1;
    let tempInputBuffer = '';
    
    // DOM Elements
    let userInput;
    let messagesContainer;
    let prevMessageHint;

    function initHistoryNavigation() {
        // Get DOM elements
        userInput = document.getElementById('userInput');
        messagesContainer = document.getElementById('messages');
        prevMessageHint = document.querySelector('.prev-message-hint');
        
        if (!userInput || !messagesContainer) {
            console.error('Required elements not found for history navigation');
            return;
        }
        
        // Build initial message history from existing messages
        buildInitialHistory();
        
        // Set up event handlers for keyboard navigation
        userInput.addEventListener('keydown', handleHistoryKeydown);
    }
    
    function handleHistoryKeydown(event) {
        if (event.key === 'ArrowUp' && userInput.value.trim() === '') {
            event.preventDefault(); // Prevent cursor from moving to start of input
            navigateHistory('back');
        } else if (event.key === 'ArrowDown' && currentHistoryIndex >= 0) {
            event.preventDefault(); // Prevent cursor from moving to end of input
            navigateHistory('forward');
        }
    }
    
    function buildInitialHistory() {
        // Get all user messages from the UI
        if (!messagesContainer) {
            console.warn('Messages container not found, skipping history build');
            return;
        }
        
        const userMessages = messagesContainer.querySelectorAll('.message.user .message-content');
        
        messageHistory = Array.from(userMessages)
            .map(msg => msg.textContent.trim())
            .filter(text => text.length > 0);
        
        // Reset the index to point to the end of history
        currentHistoryIndex = messageHistory.length;
        
        // Update the count in the hint
        updateMessageHistoryHint();
    }
    
    function navigateHistory(direction) {
        // If this is first history navigation, save current input text
        if (currentHistoryIndex === messageHistory.length) {
            tempInputBuffer = userInput.value;
        }
        
        // Calculate new index based on direction
        if (direction === 'back' && currentHistoryIndex > 0) {
            currentHistoryIndex--;
            setInputFromHistory();
        } else if (direction === 'forward' && currentHistoryIndex < messageHistory.length) {
            currentHistoryIndex++;
            
            if (currentHistoryIndex === messageHistory.length) {
                // At the end of history, restore the temp buffer
                userInput.value = tempInputBuffer;
            } else {
                setInputFromHistory();
            }
        }
        
        // Trigger input event to resize the textarea
        const inputEvent = new Event('input', { bubbles: true });
        userInput.dispatchEvent(inputEvent);
    }
    
    function setInputFromHistory() {
        if (currentHistoryIndex >= 0 && currentHistoryIndex < messageHistory.length) {
            userInput.value = messageHistory[currentHistoryIndex];
            
            // Move cursor to the end of the text
            setTimeout(() => {
                userInput.selectionStart = userInput.selectionEnd = userInput.value.length;
            }, 0);
        }
    }
    
    function updateMessageHistoryHint() {
        if (prevMessageHint && messageHistory.length > 0) {
            prevMessageHint.textContent = `↑ for previous messages (${messageHistory.length})`;
        }
    }
    
    function addToHistory(message) {
        // Only add if it's not identical to the most recent entry
        if (message && 
            (messageHistory.length === 0 || messageHistory[messageHistory.length - 1] !== message)) {
            messageHistory.push(message);
            
            // Reset index to end of history
            currentHistoryIndex = messageHistory.length;
            
            // Update the hint
            updateMessageHistoryHint();
        }
    }
    
    // Initialize when document is fully loaded
    function initWithRetry() {
        const messagesEl = document.getElementById('messages');
        const userInputEl = document.getElementById('userInput');
        
        if (messagesEl && userInputEl) {
            console.log('History navigation: Elements found, initializing');
            messagesContainer = messagesEl;
            userInput = userInputEl;
            initHistoryNavigation();
        } else {
            console.log('Messages container or input not found yet, retrying in 500ms');
            setTimeout(initWithRetry, 500);
        }
    }
    
    if (document.readyState === 'complete') {
        initWithRetry();
    } else {
        window.addEventListener('load', initWithRetry);
    }
    
    // Export for external use
    window.messageHistory = {
        add: addToHistory,
        rebuild: buildInitialHistory,
        getHistoryCount: () => messageHistory.length,
        navigateUp: () => navigateHistory('back'),
        navigateDown: () => navigateHistory('forward')
    };
})();
