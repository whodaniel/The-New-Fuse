/**
 * Emergency Button Visibility Fix
 * This script will force all action buttons to be visible regardless of styling issues.
 * It applies multiple redundant fixes to ensure buttons can be seen and used.
 */

(function() {
    // Set this to true to force text labels on all buttons even if icons load correctly
    const FORCE_TEXT_LABELS = true;
    
    // Direct DOM manipulation to ensure buttons are visible
    function forceButtonVisibility() {
        try {
            console.log('EMERGENCY: Applying forced button visibility fix...');
            
            // 1. Fix action buttons in quick actions area
            const actionButtons = document.querySelectorAll('.action-button');
            actionButtons.forEach((button, index) => {
                // Apply high-contrast styling
                applyEmergencyButtonStyle(button);
                
                // Add text label based on title or position
                const title = button.getAttribute('title') || '';
                if (title && (FORCE_TEXT_LABELS || !hasVisibleIcon(button))) {
                    addTextLabel(button, title);
                }
            });
            
            // 2. Fix command menu button
            const menuButton = document.getElementById('commandMenuButton');
            if (menuButton) {
                applyEmergencyButtonStyle(menuButton);
                if (FORCE_TEXT_LABELS || !hasVisibleIcon(menuButton)) {
                    addTextLabel(menuButton, 'Menu');
                }
            }
            
            // 3. Fix search toggle button
            const searchButton = document.getElementById('searchToggleButton');
            if (searchButton) {
                applyEmergencyButtonStyle(searchButton);
                if (FORCE_TEXT_LABELS || !hasVisibleIcon(searchButton)) {
                    addTextLabel(searchButton, 'Search');
                }
            }
            
            // 4. Fix send button
            const sendButton = document.getElementById('sendButton');
            if (sendButton) {
                applyEmergencyButtonStyle(sendButton);
                if (FORCE_TEXT_LABELS || !hasVisibleIcon(sendButton)) {
                    addTextLabel(sendButton, 'Send');
                }
            }
            
            // 5. Add fixed positions for quick action buttons if missing
            const quickActions = document.querySelector('.quick-actions');
            if (quickActions && quickActions.childElementCount < 2) {
                console.log('Recreating quick action buttons from scratch');
                recreateQuickActions(quickActions);
            }
        } catch (err) {
            console.error('Error in emergency button fix:', err);
        }
    }
    
    // Check if an element has a visible icon
    function hasVisibleIcon(element) {
        const icon = element.querySelector('.codicon');
        if (!icon) {return false;}
        
        // Check computed style
        const style = window.getComputedStyle(icon);
        const content = style.getPropertyValue('content');
        const display = style.getPropertyValue('display');
        
        return content && content !== 'normal' && content !== 'none' && display !== 'none';
    }
    
    // Apply high-contrast emergency styling to a button
    function applyEmergencyButtonStyle(button) {
        // Super-important styling with !important flags to override anything
        button.style.cssText = `
            background-color: var(--vscode-button-background, #0E639C) !important;
            color: var(--vscode-button-foreground, white) !important;
            border: 2px solid var(--vscode-contrastBorder, rgba(255, 255, 255, 0.6)) !important;
            min-width: 36px !important;
            min-height: 36px !important;
            width: 36px !important;
            height: 36px !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            justify-content: center !important;
            position: relative !important;
            padding: 4px !important;
            margin: 0 5px !important;
            border-radius: 6px !important;
            cursor: pointer !important;
            opacity: 1 !important;
            visibility: visible !important;
            overflow: visible !important;
        `;
    }
    
    // Add a text label to a button
    function addTextLabel(button, title) {
        // Don't add if already has a label
        if (button.querySelector('.emergency-button-label')) {return;}
        
        // Create simple text label
        const label = document.createElement('span');
        label.className = 'emergency-button-label';
        label.textContent = title.split(' ').pop(); // Just use last word to keep it short
        label.style.cssText = `
            font-size: 10px !important;
            margin-top: 3px !important;
            display: block !important;
            color: var(--vscode-button-foreground, white) !important;
            text-align: center !important;
            line-height: 1.1 !important;
            white-space: nowrap !important;
            overflow: hidden !important;
            max-width: 36px !important;
            text-overflow: ellipsis !important;
            font-weight: bold !important;
            text-shadow: 0 0 1px rgba(0,0,0,0.5) !important;
        `;
        
        button.appendChild(label);
    }
    
    // Completely recreate quick action buttons if they're missing
    function recreateQuickActions(container) {
        // Clear existing content
        container.innerHTML = '';
        
        // Define common buttons
        const buttonDefs = [
            { title: 'Start AI Collab', command: 'the-new-fuse.startAICollab', icon: 'play' },
            { title: 'Stop AI Collab', command: 'the-new-fuse.stopAICollab', icon: 'stop' },
            { title: 'Select LLM Provider', command: 'the-new-fuse.selectLLMProvider', icon: 'settings-gear' },
            { title: 'Connect to MCP', command: 'the-new-fuse.connectMCP', icon: 'plug' },
            { title: 'Clear Chat', id: 'clearChatButton', icon: 'clear-all' }
        ];
        
        // Create each button
        buttonDefs.forEach(def => {
            const button = document.createElement('button');
            button.className = 'action-button';
            button.title = def.title;
            
            if (def.command) {
                button.setAttribute('data-command', def.command);
            }
            
            if (def.id) {
                button.id = def.id;
            }
            
            // Create icon
            const icon = document.createElement('i');
            icon.className = `codicon codicon-${def.icon}`;
            button.appendChild(icon);
            
            // Apply emergency style and add text
            applyEmergencyButtonStyle(button);
            addTextLabel(button, def.title);
            
            // Add to container
            container.appendChild(button);
            
            // Add click handler
            button.addEventListener('click', () => {
                if (def.command) {
                    // Send command to VS Code
                    const vscode = acquireVsCodeApi();
                    vscode.postMessage({
                        type: 'executeCommand',
                        command: def.command
                    });
                } else if (def.id === 'clearChatButton') {
                    if (confirm('Are you sure you want to clear the chat history?')) {
                        const vscode = acquireVsCodeApi();
                        vscode.postMessage({ type: 'clearHistory' });
                    }
                }
            });
        });
    }
    
    // Install global emergency button fix function
    window._forceButtonVisibility = forceButtonVisibility;
    
    // Run immediately if document is already loaded
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        setTimeout(forceButtonVisibility, 50);
    }
    
    // Run when DOM content is loaded
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(forceButtonVisibility, 50);
    });
    
    // Run when window is fully loaded
    window.addEventListener('load', () => {
        // Try repeatedly to cover all bases
        setTimeout(forceButtonVisibility, 100);
        setTimeout(forceButtonVisibility, 500);
        setTimeout(forceButtonVisibility, 1000);
        setInterval(forceButtonVisibility, 3000); // Keep checking periodically
    });
    
    // If the chat view is showing but buttons aren't visible, we can detect it and fix
    // Use MutationObserver to watch for DOM changes
    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                setTimeout(forceButtonVisibility, 50);
                return;
            }
        }
    });
    
    // Start observing when DOM is ready
    if (document.body) {
        observer.observe(document.body, { childList: true, subtree: true });
    } else {
        document.addEventListener('DOMContentLoaded', () => {
            observer.observe(document.body, { childList: true, subtree: true });
        });
    }
})();
