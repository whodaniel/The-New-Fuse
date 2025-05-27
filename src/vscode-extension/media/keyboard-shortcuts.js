/**
 * Keyboard shortcuts for The New Fuse chat interface
 */

(function () {
    // Initialize keyboard shortcuts
    function initKeyboardShortcuts() {
        // Global keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Don't handle shortcuts when typing in input fields (except for specified ones)
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                if (!(e.key === 'Escape' || (e.key === 'f' && (e.ctrlKey || e.metaKey)))) {
                    return;
                }
            }
            
            // Ctrl+F or Cmd+F to open search
            if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
                e.preventDefault();
                if (window.chatSearch) {
                    window.chatSearch.toggle();
                }
            }
            
            // Escape key handling
            if (e.key === 'Escape') {
                const searchContainer = document.getElementById('searchContainer');
                const commandsDropdown = document.getElementById('commandsDropdown');
                
                // Check if search is open
                if (searchContainer && searchContainer.classList.contains('visible')) {
                    e.preventDefault();
                    searchContainer.classList.remove('visible');
                    if (window.chatSearch) {
                        window.chatSearch.clear();
                    }
                }
                // Check if command menu is open
                else if (commandsDropdown && commandsDropdown.classList.contains('show')) {
                    e.preventDefault();
                    commandsDropdown.classList.remove('show');
                    const commandMenuButton = document.getElementById('commandMenuButton');
                    if (commandMenuButton) {
                        commandMenuButton.classList.remove('active');
                    }
                }
            }
            
            // Alt+C or Option+C to clear chat
            if (e.altKey && e.key === 'c') {
                e.preventDefault();
                const clearChatButton = document.getElementById('clearChatButton');
                if (clearChatButton) {
                    clearChatButton.click();
                }
            }
            
            // Ctrl+/ or Cmd+/ to open command menu
            if ((e.ctrlKey || e.metaKey) && e.key === '/') {
                e.preventDefault();
                const commandMenuButton = document.getElementById('commandMenuButton');
                if (commandMenuButton) {
                    commandMenuButton.click();
                }
            }
            
            // F3 key for search navigation
            if (e.key === 'F3' || ((e.ctrlKey || e.metaKey) && e.key === 'g')) {
                const searchContainer = document.getElementById('searchContainer');
                if (searchContainer && searchContainer.classList.contains('visible')) {
                    e.preventDefault();
                    
                    if (e.shiftKey) {
                        // Previous search result
                        document.getElementById('searchPrevButton')?.click();
                    } else {
                        // Next search result
                        document.getElementById('searchNextButton')?.click();
                    }
                }
            }
        });
        
        // Add tooltips for keyboard shortcuts
        addKeyboardShortcutTooltips();
    }
    
    // Add tooltips for keyboard shortcuts to UI elements
    function addKeyboardShortcutTooltips() {
        // Search button
        const searchToggleButton = document.getElementById('searchToggleButton');
        if (searchToggleButton) {
            const shortcutText = navigator.platform.indexOf('Mac') >= 0 ? '(⌘F)' : '(Ctrl+F)';
            searchToggleButton.title = `Search Messages ${shortcutText}`;
        }
        
        // Command menu
        const commandMenuButton = document.getElementById('commandMenuButton');
        if (commandMenuButton) {
            const shortcutText = navigator.platform.indexOf('Mac') >= 0 ? '(⌘/)' : '(Ctrl+/)';
            commandMenuButton.title = `Commands Menu ${shortcutText}`;
        }
        
        // Clear chat button
        const clearChatButton = document.getElementById('clearChatButton');
        if (clearChatButton) {
            const shortcutText = navigator.platform.indexOf('Mac') >= 0 ? '(⌥C)' : '(Alt+C)';
            clearChatButton.title = `Clear Chat History ${shortcutText}`;
        }
    }
    
    // Initialize when document is fully loaded
    if (document.readyState === 'complete') {
        initKeyboardShortcuts();
    } else {
        window.addEventListener('load', initKeyboardShortcuts);
    }
    
    // Export public methods
    window.keyboardShortcuts = {
        refresh: addKeyboardShortcutTooltips
    };
})();
