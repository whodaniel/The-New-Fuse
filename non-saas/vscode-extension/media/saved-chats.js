// @ts-check

/**
 * Saved Chats Manager for The New Fuse Chat
 * Handles saving, loading, and switching between chat sessions
 */
(function () {
    const vscode = acquireVsCodeApi();
    
    // State
    let savedChats = [];
    let currentChatId = null;

    // DOM Elements
    let savedChatsContainer;
    let savedChatsHeader;
    let savedChatsList;
    let toggleButton;
    
    // Export functions to the global scope for accessibility from chat.js
    window.savedChatsManager = {
        initialize: initialize,
        updateSavedChatsList: updateSavedChatsList,
        selectChat: selectChat
    };
    
    // Automatically initialize when DOM is ready
    document.addEventListener('DOMContentLoaded', () => {
        // Initialize with a slight delay to ensure other components are ready
        setTimeout(initialize, 500);
    });
    
    /**
     * Initialize saved chats functionality
     */
    function initialize() {
        // Create the saved chats UI if it doesn't exist
        createSavedChatsUI();
        
        // Listen for messages from the extension
        window.addEventListener('message', (event) => {
            const message = event.data;
            
            switch (message.type) {
                case 'savedChatsUpdated':
                    updateSavedChatsList(message.chats);
                    break;
                case 'currentChatChanged':
                    selectChat(message.chatId);
                    break;
            }
        });
        
        // Request saved chats from extension
        requestSavedChats();
    }
    
    /**
     * Create the saved chats UI elements
     */
    function createSavedChatsUI() {
        const chatContainer = document.querySelector('.chat-container');
        if (!chatContainer) { return; }
        
        // Create container if it doesn't exist
        if (!document.querySelector('.saved-chats-container')) {
            savedChatsContainer = document.createElement('div');
            savedChatsContainer.className = 'saved-chats-container';
            
            // Create header with toggle button
            savedChatsHeader = document.createElement('div');
            savedChatsHeader.className = 'saved-chats-header';
            
            const headerTitle = document.createElement('span');
            headerTitle.textContent = 'Saved Chats';
            
            toggleButton = document.createElement('button');
            toggleButton.className = 'action-button';
            toggleButton.innerHTML = '<i class="codicon codicon-chevron-down"></i>';
            toggleButton.title = 'Show/Hide Saved Chats';
            toggleButton.addEventListener('click', toggleSavedChats);
            
            savedChatsHeader.appendChild(headerTitle);
            savedChatsHeader.appendChild(toggleButton);
            
            // Create list container
            savedChatsList = document.createElement('div');
            savedChatsList.className = 'saved-chats-list';
            
            // Add to container
            savedChatsContainer.appendChild(savedChatsHeader);
            savedChatsContainer.appendChild(savedChatsList);
            
            // Insert after header, before messages
            const quickActions = document.querySelector('.quick-actions');
            if (quickActions) {
                chatContainer.insertBefore(savedChatsContainer, quickActions.nextSibling);
            } else {
                const header = document.querySelector('.chat-header');
                if (header) {
                    chatContainer.insertBefore(savedChatsContainer, header.nextSibling);
                }
            }
            
            // Add save current chat button to quick actions
            const chatControls = document.querySelector('.action-button-group.chat-controls');
            if (chatControls) {
                const saveButton = document.createElement('button');
                saveButton.className = 'action-button';
                saveButton.title = 'Save Current Chat';
                saveButton.innerHTML = '<i class="codicon codicon-save"></i>';
                saveButton.addEventListener('click', saveCurrentChat);
                chatControls.appendChild(saveButton);
            }
        } else {
            savedChatsContainer = document.querySelector('.saved-chats-container');
            savedChatsHeader = savedChatsContainer.querySelector('.saved-chats-header');
            savedChatsList = savedChatsContainer.querySelector('.saved-chats-list');
            toggleButton = savedChatsHeader.querySelector('button');
        }
    }
    
    /**
     * Toggle visibility of saved chats list
     */
    function toggleSavedChats() {
        if (!savedChatsContainer) { return; }
        
        savedChatsContainer.classList.toggle('show');
        
        // Update toggle button icon
        if (toggleButton) {
            if (savedChatsContainer.classList.contains('show')) {
                toggleButton.innerHTML = '<i class="codicon codicon-chevron-up"></i>';
            } else {
                toggleButton.innerHTML = '<i class="codicon codicon-chevron-down"></i>';
            }
        }
    }
    
    /**
     * Update the saved chats list with provided chats
     * @param {Array} chats 
     */
    function updateSavedChatsList(chats) {
        if (!savedChatsList) { return; }
        
        savedChats = chats;
        savedChatsList.innerHTML = '';
        
        if (chats.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'saved-chats-empty';
            emptyMessage.textContent = 'No saved chats yet';
            savedChatsList.appendChild(emptyMessage);
            return;
        }
        
        chats.forEach(chat => {
            const chatItem = document.createElement('div');
            chatItem.className = 'saved-chat-item';
            if (chat.id === currentChatId) {
                chatItem.classList.add('active');
            }
            chatItem.dataset.chatId = chat.id;
            
            const title = document.createElement('span');
            title.className = 'saved-chat-title';
            title.textContent = chat.name;
            
            const time = document.createElement('span');
            time.className = 'saved-chat-time';
            time.textContent = formatDate(chat.updatedAt || chat.createdAt);
            
            const deleteButton = document.createElement('button');
            deleteButton.className = 'saved-chat-delete';
            deleteButton.innerHTML = '<i class="codicon codicon-trash"></i>';
            deleteButton.title = 'Delete chat';
            deleteButton.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteChat(chat.id);
            });
            
            chatItem.appendChild(title);
            chatItem.appendChild(time);
            chatItem.appendChild(deleteButton);
            
            chatItem.addEventListener('click', () => {
                switchToChat(chat.id);
            });
            
            savedChatsList.appendChild(chatItem);
        });
    }
    
    /**
     * Format a date for display
     * @param {number} timestamp 
     * @returns {string}
     */
    function formatDate(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        
        // Today
        if (date.toDateString() === now.toDateString()) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        
        // This year
        if (date.getFullYear() === now.getFullYear()) {
            return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
        }
        
        // Different year
        return date.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
    }
    
    /**
     * Request saved chats from the extension
     */
    function requestSavedChats() {
        vscode.postMessage({
            type: 'getSavedChats'
        });
    }
    
    /**
     * Save the current chat session
     */
    function saveCurrentChat() {
        const name = prompt('Enter a name for this chat session:', `Chat ${new Date().toLocaleDateString()}`);
        if (name) {
            vscode.postMessage({
                type: 'saveChat',
                name: name
            });
        }
    }
    
    /**
     * Switch to a different chat session
     * @param {string} chatId 
     */
    function switchToChat(chatId) {
        vscode.postMessage({
            type: 'switchChat',
            chatId: chatId
        });
    }
    
    /**
     * Delete a chat session
     * @param {string} chatId 
     */
    function deleteChat(chatId) {
        if (confirm('Are you sure you want to delete this chat?')) {
            vscode.postMessage({
                type: 'deleteChat',
                chatId: chatId
            });
        }
    }
    
    /**
     * Update UI to reflect the current chat
     * @param {string} chatId 
     */
    function selectChat(chatId) {
        currentChatId = chatId;
        
        // Update active state in UI
        const chatItems = document.querySelectorAll('.saved-chat-item');
        chatItems.forEach(item => {
            if (item.dataset.chatId === chatId) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }
    
    // Initialize when document is ready
    document.addEventListener('DOMContentLoaded', initialize);
    
    // Export functions to window
    window.savedChatsManager = {
        initialize,
        saveCurrentChat,
        switchToChat,
        deleteChat,
        toggleSavedChats
    };
})();
