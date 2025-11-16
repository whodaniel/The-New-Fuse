// Content script for Tab Connections extension

class TabConnectionsContent {
    constructor() {
        this.pageContent = null;
        this.updateTimeout = null;
        
        this.init();
    }
    
    init() {
        this.extractPageContent();
        this.setupContentObserver();
        this.setupMessageListener();
    }
    
    setupMessageListener() {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            switch (request.action) {
                case 'getContent':
                    sendResponse({ content: this.pageContent });
                    break;
                    
                case 'pageLoaded':
                    this.extractPageContent();
                    break;
                    
                default:
                    sendResponse({ error: 'Unknown action' });
            }
        });
    }
    
    extractPageContent() {
        try {
            const content = {
                url: window.location.href,
                title: document.title,
                text: this.getMainText(),
                headings: this.getHeadings(),
                links: this.getImportantLinks(),
                keywords: this.extractKeywords(),
                timestamp: Date.now()
            };
            
            this.pageContent = content;
            
            // Store in local storage for background script access
            chrome.storage.local.set({
                [`tab_${Date.now()}`]: content
            });
            
        } catch (error) {
            console.error('Error extracting page content:', error);
        }
    }
    
    getMainText() {
        // Remove script and style elements
        const elementsToRemove = document.querySelectorAll('script, style, nav, header, footer, aside');
        elementsToRemove.forEach(el => el.remove());
        
        // Get main content areas
        const mainSelectors = [
            'main',
            'article',
            '[role="main"]',
            '.main-content',
            '.content',
            '#content',
            '.post-content',
            '.entry-content'
        ];
        
        let mainContent = null;
        
        for (const selector of mainSelectors) {
            const element = document.querySelector(selector);
            if (element) {
                mainContent = element;
                break;
            }
        }
        
        // If no main content area found, use body
        const contentElement = mainContent || document.body;
        
        // Extract text content
        let text = contentElement.innerText || contentElement.textContent || '';
        
        // Clean up text
        text = text
            .replace(/\s+/g, ' ')
            .replace(/\n{3,}/g, '\n\n')
            .trim();
        
        // Limit text length to prevent memory issues
        return text.substring(0, 5000);
    }
    
    getHeadings() {
        const headings = [];
        const headingElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        
        headingElements.forEach(heading => {
            const text = heading.textContent.trim();
            if (text && text.length < 200) {
                headings.push({
                    level: parseInt(heading.tagName.charAt(1)),
                    text: text
                });
            }
        });
        
        return headings.slice(0, 20); // Limit to first 20 headings
    }
    
    getImportantLinks() {
        const links = [];
        const linkElements = document.querySelectorAll('a[href]');
        
        linkElements.forEach(link => {
            const href = link.href;
            const text = link.textContent.trim();
            
            // Filter out navigation and unimportant links
            if (href && 
                text && 
                text.length > 3 && 
                text.length < 100 &&
                !href.includes('#') &&
                !text.toLowerCase().includes('click here') &&
                !text.toLowerCase().includes('read more')) {
                
                links.push({
                    url: href,
                    text: text
                });
            }
        });
        
        return links.slice(0, 10); // Limit to first 10 meaningful links
    }
    
    extractKeywords() {
        const text = this.getMainText().toLowerCase();
        const words = text.split(/\s+/).filter(word => word.length > 3);
        
        // Common stop words to filter out
        const stopWords = new Set([
            'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 
            'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 
            'how', 'man', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 
            'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use'
        ]);
        
        // Count word frequencies
        const wordCounts = {};
        words.forEach(word => {
            const cleanWord = word.replace(/[^a-z0-9]/g, '');
            if (cleanWord && !stopWords.has(cleanWord) && cleanWord.length > 3) {
                wordCounts[cleanWord] = (wordCounts[cleanWord] || 0) + 1;
            }
        });
        
        // Get top keywords
        return Object.entries(wordCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .map(([word]) => word);
    }
    
    setupContentObserver() {
        // Watch for content changes
        const observer = new MutationObserver((mutations) => {
            // Debounce updates
            clearTimeout(this.updateTimeout);
            this.updateTimeout = setTimeout(() => {
                this.extractPageContent();
            }, 2000);
        });
        
        // Observe body for changes
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            characterData: true
        });
        
        // Also listen for visibility changes
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.extractPageContent();
            }
        });
    }
}

// Initialize content script when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new TabConnectionsContent();
    });
} else {
    new TabConnectionsContent();
}

// Handle dynamic content loading
let contentScript = null;
window.addEventListener('load', () => {
    // Re-extract content after full page load
    setTimeout(() => {
        if (!contentScript) {
            contentScript = new TabConnectionsContent();
        }
    }, 1000);
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (contentScript) {
        contentScript.destroy();
        contentScript = null;
    }
});