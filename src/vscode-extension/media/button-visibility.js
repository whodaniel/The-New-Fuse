/**
 * Button visibility fix script
 * This script adds text labels to buttons if their icons aren't visible
 */

(function() {
    // Attempt to fix button visibility immediately and repeatedly
    function fixButtonVisibility() {
        try {
            console.log('Applying button visibility fix...');
            
            // Apply to all action buttons
            const actionButtons = document.querySelectorAll('.action-button');
            actionButtons.forEach(button => {
                // Ensure button has visible styling
                button.style.backgroundColor = 'var(--vscode-button-background, #0E639C)';
                button.style.color = 'var(--vscode-button-foreground, white)';
                button.style.border = '1px solid var(--vscode-contrastBorder, rgba(255, 255, 255, 0.4))';
                
                const icon = button.querySelector('.codicon');
                if (icon) {
                    const title = button.getAttribute('title');
                    if (title && button.querySelectorAll('span').length === 0) {
                        // Add text label for the button based on title
                        const label = document.createElement('span');
                        label.className = 'button-text-label';
                        label.textContent = title.split(' ').pop(); // Just use last word
                        label.style.fontSize = '9px';
                        label.style.marginTop = '2px';
                        label.style.display = 'block';
                        button.appendChild(label);
                    }
                }
            });
            
            // Apply to command menu button
            const menuButton = document.getElementById('commandMenuButton');
            if (menuButton) {
                menuButton.style.backgroundColor = 'var(--vscode-button-background, #0E639C)';
                menuButton.style.color = 'var(--vscode-button-foreground, white)';
                menuButton.style.border = '1px solid var(--vscode-contrastBorder, rgba(255, 255, 255, 0.4))';
                
                if (menuButton.querySelector('.button-text-label') === null) {
                    const label = document.createElement('span');
                    label.className = 'button-text-label';
                    label.textContent = 'Menu';
                    label.style.fontSize = '9px';
                    label.style.marginTop = '2px';
                    label.style.display = 'block';
                    menuButton.appendChild(label);
                }
            }
            
            // Apply to search toggle button
            const searchButton = document.getElementById('searchToggleButton');
            if (searchButton) {
                searchButton.style.backgroundColor = 'var(--vscode-button-background, #0E639C)';
                searchButton.style.color = 'var(--vscode-button-foreground, white)';
                searchButton.style.border = '1px solid var(--vscode-contrastBorder, rgba(255, 255, 255, 0.4))';
                
                if (searchButton.querySelector('.button-text-label') === null) {
                    const label = document.createElement('span');
                    label.className = 'button-text-label';
                    label.textContent = 'Search';
                    label.style.fontSize = '9px';
                    label.style.marginTop = '2px';
                    label.style.display = 'block';
                    searchButton.appendChild(label);
                }
            }
            
        } catch (err) {
            console.error('Error fixing button visibility:', err);
        }
    }
    
    // Run immediately when loaded
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        fixButtonVisibility();
    }
    
    // Try again after DOM content loaded
    document.addEventListener('DOMContentLoaded', () => {
        fixButtonVisibility();
        // Run a few more times to catch any buttons added dynamically
        setTimeout(fixButtonVisibility, 500);
        setTimeout(fixButtonVisibility, 1500);
    });
    
    // Run when window is fully loaded
    window.addEventListener('load', () => {
        fixButtonVisibility();
        // Run repeatedly to ensure buttons are always visible
        setInterval(fixButtonVisibility, 2000);
    });
})();
