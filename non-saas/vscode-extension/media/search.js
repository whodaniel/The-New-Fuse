/**
 * Search functionality for The New Fuse chat interface
 */

(function () {
    let currentSearchIndex = -1;
    let searchResults = [];
    let searchTerm = '';
    
    // DOM Elements
    let searchToggleButton;
    let searchContainer;
    let searchInput;
    let searchPrevButton;
    let searchNextButton;
    let searchCloseButton;
    let searchResultsDisplay;
    let messagesContainer;
    
    // Initialize search functionality
    function initSearch() {
        // Get DOM elements
        searchToggleButton = document.getElementById('searchToggleButton');
        searchContainer = document.getElementById('searchContainer');
        searchInput = document.getElementById('searchInput');
        searchPrevButton = document.getElementById('searchPrevButton');
        searchNextButton = document.getElementById('searchNextButton');
        searchCloseButton = document.getElementById('searchCloseButton');
        searchResultsDisplay = document.getElementById('searchResults');
        messagesContainer = document.getElementById('messages');
        
        if (!searchToggleButton || !searchContainer || !searchInput || 
            !searchPrevButton || !searchNextButton || !searchCloseButton) {
            console.error('Search elements not found');
            return;
        }
        
        // Toggle search bar visibility
        searchToggleButton.addEventListener('click', () => {
            console.log('Toggle search clicked');
            searchContainer.classList.toggle('visible');
            if (searchContainer.classList.contains('visible')) {
                searchInput.focus();
            } else {
                clearSearch();
            }
        });
        
        // Handle search input
        searchInput.addEventListener('input', () => {
            searchTerm = searchInput.value.trim();
            if (searchTerm.length > 1) {
                performSearch(searchTerm);
            } else {
                clearHighlights();
                updateSearchResultsDisplay(0, 0);
            }
        });
        
        // Search navigation buttons
        searchPrevButton.addEventListener('click', navigateToPreviousResult);
        searchNextButton.addEventListener('click', navigateToNextResult);
        
        // Close search
        searchCloseButton.addEventListener('click', () => {
            searchContainer.classList.remove('visible');
            clearSearch();
        });
        
        console.log('Search functionality initialized');
    }
    
    // Perform search in messages
    function performSearch(term) {
        clearHighlights();
        
        if (!term) {
            updateSearchResultsDisplay(0, 0);
            return;
        }
        
        searchResults = [];
        const messages = messagesContainer.querySelectorAll('.message-content');
        const regex = new RegExp(escapeRegExp(term), 'gi');
        
        messages.forEach((message, messageIndex) => {
            // Skip system messages if desired
            if (message.closest('.message').classList.contains('system')) {
                return;
            }
            
            const messageText = message.textContent;
            let match;
            
            // Find all matches in this message
            while ((match = regex.exec(messageText)) !== null) {
                searchResults.push({
                    messageEl: message,
                    messageIndex,
                    matchIndex: match.index,
                    matchLength: match[0].length
                });
            }
        });
        
        // Update results display
        updateSearchResultsDisplay(searchResults.length, 0);
        
        // Highlight and navigate to first result if available
        if (searchResults.length > 0) {
            currentSearchIndex = 0;
            highlightCurrentResult();
        }
    }
    
    // Navigate to the next search result
    function navigateToNextResult() {
        if (searchResults.length === 0) {
            return;
        }
        
        currentSearchIndex = (currentSearchIndex + 1) % searchResults.length;
        highlightCurrentResult();
    }
    
    // Navigate to the previous search result
    function navigateToPreviousResult() {
        if (searchResults.length === 0) {
            return;
        }
        
        currentSearchIndex = (currentSearchIndex - 1 + searchResults.length) % searchResults.length;
        highlightCurrentResult();
    }
    
    // Highlight the current search result
    function highlightCurrentResult() {
        clearHighlights();
        
        if (searchResults.length === 0 || currentSearchIndex < 0) {
            return;
        }
        
        const result = searchResults[currentSearchIndex];
        const messageEl = result.messageEl;
        
        // If the message has original content stored, restore it first
        if (messageEl.dataset.originalContent) {
            messageEl.innerHTML = messageEl.dataset.originalContent;
        } else {
            // Store original content for future restoration
            messageEl.dataset.originalContent = messageEl.innerHTML;
        }
        
        // Check if the message contains code blocks
        if (messageEl.querySelector('pre') || messageEl.querySelector('code')) {
            // This is a complex case with code blocks - handle specially
            highlightInMessageWithCodeBlocks(messageEl, searchTerm);
        } else {
            // Simple text case
            const text = messageEl.textContent;
            const beforeMatch = text.substring(0, result.matchIndex);
            const match = text.substring(result.matchIndex, result.matchIndex + result.matchLength);
            const afterMatch = text.substring(result.matchIndex + result.matchLength);
            
            messageEl.innerHTML = escapeHtml(beforeMatch) + 
                                '<span class="search-highlight current-match">' + 
                                escapeHtml(match) + 
                                '</span>' + 
                                escapeHtml(afterMatch);
        }
        
        // Scroll the result into view
        const highlightEl = messageEl.querySelector('.current-match');
        if (highlightEl) {
            highlightEl.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }
        
        // Update the counter
        updateSearchResultsDisplay(searchResults.length, currentSearchIndex + 1);
    }
    
    // Special handling for highlighting in messages with code blocks
    function highlightInMessageWithCodeBlocks(messageEl, term) {
        const walkTree = function(node, highlights) {
            if (node.nodeType === Node.TEXT_NODE) {
                // This is a text node, check if it contains the search term
                const text = node.textContent;
                const regex = new RegExp(escapeRegExp(term), 'gi');
                
                if (regex.test(text)) {
                    // Reset regex
                    regex.lastIndex = 0;
                    
                    // Create a document fragment to replace the text node
                    const fragment = document.createDocumentFragment();
                    let lastIndex = 0;
                    let match;
                    
                    while ((match = regex.exec(text)) !== null) {
                        // Add text before the match
                        if (match.index > lastIndex) {
                            fragment.appendChild(document.createTextNode(
                                text.substring(lastIndex, match.index)
                            ));
                        }
                        
                        // Create highlighted span for the match
                        const span = document.createElement('span');
                        span.className = 'search-highlight';
                        if (highlights.length === currentSearchIndex) {
                            span.classList.add('current-match');
                        }
                        span.textContent = match[0];
                        fragment.appendChild(span);
                        
                        lastIndex = match.index + match[0].length;
                        highlights.push(span);
                    }
                    
                    // Add any remaining text
                    if (lastIndex < text.length) {
                        fragment.appendChild(document.createTextNode(
                            text.substring(lastIndex)
                        ));
                    }
                    
                    // Replace the text node with the fragment
                    node.parentNode.replaceChild(fragment, node);
                    return true;
                }
                return false;
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                // Skip highlighting inside pre or code elements
                if (node.tagName === 'PRE' || node.tagName === 'CODE') {
                    return false;
                }
                
                // Process child nodes
                const childNodes = Array.from(node.childNodes);
                for (let i = 0; i < childNodes.length; i++) {
                    walkTree(childNodes[i], highlights);
                }
            }
            return false;
        };
        
        const highlights = [];
        walkTree(messageEl, highlights);
        
        // If we found the current highlight, scroll to it
        if (highlights[currentSearchIndex]) {
            highlights[currentSearchIndex].scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }
    }
    
    // Clear all search highlights
    function clearHighlights() {
        // Remove existing highlights
        const highlights = messagesContainer.querySelectorAll('.search-highlight');
        highlights.forEach(highlight => {
            const parent = highlight.parentNode;
            const text = highlight.textContent;
            
            // Replace with text node
            if (parent) {
                const textNode = document.createTextNode(text);
                parent.replaceChild(textNode, highlight);
            }
        });
        
        // Restore original content for complex messages
        const messages = messagesContainer.querySelectorAll('.message-content[data-original-content]');
        messages.forEach(message => {
            message.innerHTML = message.dataset.originalContent;
            delete message.dataset.originalContent;
        });
    }
    
    // Clear search completely
    function clearSearch() {
        searchInput.value = '';
        searchTerm = '';
        clearHighlights();
        updateSearchResultsDisplay(0, 0);
        currentSearchIndex = -1;
        searchResults = [];
    }
    
    // Update search results counter
    function updateSearchResultsDisplay(total, current) {
        if (total === 0) {
            searchResultsDisplay.textContent = 'No results';
            searchPrevButton.disabled = true;
            searchNextButton.disabled = true;
        } else {
            searchResultsDisplay.textContent = `${current} of ${total}`;
            searchPrevButton.disabled = false;
            searchNextButton.disabled = false;
        }
    }
    
    // Helper: Escape regex special characters
    function escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    
    // Helper: Escape HTML to prevent XSS
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // Initialize when document is fully loaded
    if (document.readyState === 'complete') {
        initSearch();
    } else {
        window.addEventListener('load', initSearch);
    }
    
    // Export for external use
    window.chatSearch = {
        toggle: () => {
            if (searchContainer) {
                searchContainer.classList.toggle('visible');
                if (searchContainer.classList.contains('visible')) {
                    searchInput.focus();
                }
            }
        },
        clear: clearSearch,
        perform: performSearch
    };
})();
