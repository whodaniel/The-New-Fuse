/**
 * Fallback icons script for The New Fuse
 * This script detects if codicons failed to load and applies fallback Unicode icons
 */

(function() {
    // Force fallback mode for testing
    const FORCE_FALLBACK = false; // Set to true to force fallback icons for testing
    
    // Track fallback application to avoid multiple attempts
    let fallbackApplied = false;
    let checkAttempts = 0;
    const MAX_ATTEMPTS = 5;

    // Function to create a test element and check if codicons loaded properly
    function checkCodiconsLoaded() {
        try {
            // Try to find a codicon element and check if it has the expected style
            const testEl = document.createElement('i');
            testEl.className = 'codicon codicon-check';
            testEl.style.position = 'absolute';
            testEl.style.visibility = 'hidden';
            testEl.style.zIndex = '-1000';
            document.body.appendChild(testEl);

            // Get computed style 
            const style = window.getComputedStyle(testEl);
            const fontFamily = style.getPropertyValue('font-family');
            const content = style.getPropertyValue('content');
            const fontSize = style.getPropertyValue('font-size');
            
            // Check multiple indicators that the font loaded correctly
            const fontFamilyOk = fontFamily.toLowerCase().includes('codicon');
            const contentOk = content && content !== 'normal' && content !== 'none' && content !== '';
            
            // Clean up test element
            document.body.removeChild(testEl);

            console.log('Codicons check:', { 
                fontFamily, 
                content,
                fontSize,
                fontFamilyOk,
                contentOk,
                attempt: checkAttempts + 1
            });
            
            return fontFamilyOk && contentOk && !FORCE_FALLBACK;
        } catch (err) {
            console.error('Error checking codicons:', err);
            return false;
        }
    }

    // Function to create a quick test of common icons
    function quickIconTest() {
        try {
            // Create a test container that's hidden
            const container = document.createElement('div');
            container.style.position = 'absolute';
            container.style.visibility = 'hidden';
            container.style.zIndex = '-1000';
            container.style.bottom = '0';
            container.style.right = '0';
            
            // Add a few common icons to test
            const iconNames = ['check', 'play', 'search', 'menu', 'refresh'];
            iconNames.forEach(name => {
                const icon = document.createElement('i');
                icon.className = `codicon codicon-${name}`;
                icon.id = `test-icon-${name}`;
                container.appendChild(icon);
            });
            
            document.body.appendChild(container);
            
            // Check if any icons rendered correctly
            let anyIconsWorking = false;
            iconNames.forEach(name => {
                const icon = document.getElementById(`test-icon-${name}`);
                if (icon) {
                    const style = window.getComputedStyle(icon);
                    const content = style.getPropertyValue('content');
                    if (content && content !== 'normal' && content !== 'none' && content !== '') {
                        anyIconsWorking = true;
                    }
                }
            });
            
            // Clean up
            document.body.removeChild(container);
            
            return anyIconsWorking;
        } catch (err) {
            console.error('Error in quick icon test:', err);
            return false;
        }
    }

    // Function to apply fallback icons
    function applyFallbackIcons() {
        if (fallbackApplied) {
            return; // Avoid applying fallbacks multiple times
        }
        
        console.log('Applying fallback icons to UI elements...');
        document.body.classList.add('using-fallback-icons');
        fallbackApplied = true;

        // Replace all codicon elements with fallback icons or add text labels
        try {
            // First apply to buttons
            const actionButtons = document.querySelectorAll('.action-button');
            actionButtons.forEach(button => {
                // Extract title for label
                const title = button.getAttribute('title') || '';
                // Make sure button has visible background
                button.style.backgroundColor = 'var(--vscode-button-background, #0E639C)';
                button.style.color = 'var(--vscode-button-foreground, white)';
                button.style.border = '1px solid var(--vscode-contrastBorder, rgba(255, 255, 255, 0.4))';
                
                // Find the icon inside button
                const icon = button.querySelector('.codicon');
                if (icon) {
                    // Extract icon type
                    const classList = Array.from(icon.classList);
                    const iconType = classList.find(c => c.startsWith('codicon-'))?.replace('codicon-', '');
                    
                    if (iconType) {
                        // Create fallback element
                        const fallback = document.createElement('span');
                        fallback.className = `fallback-icon fallback-icon-${iconType}`;
                        button.appendChild(fallback);
                        
                        // Add small text label below icon
                        if (title) {
                            const label = document.createElement('small');
                            label.style.display = 'block';
                            label.style.fontSize = '8px';
                            label.style.marginTop = '2px';
                            label.textContent = title.split(' ').pop(); // Just use last word to keep it small
                            button.appendChild(label);
                        }
                    }
                }
            });

            // Then handle all other codicon elements
            const codiconElements = document.querySelectorAll('.codicon:not(.action-button .codicon)');
            codiconElements.forEach(el => {
                try {
                    // Get the codicon type from class
                    const classList = Array.from(el.classList);
                    const iconType = classList.find(c => c.startsWith('codicon-'))?.replace('codicon-', '');
                    
                    if (iconType) {
                        // Create fallback element
                        const fallback = document.createElement('span');
                        fallback.className = `fallback-icon fallback-icon-${iconType}`;
                        el.parentNode.insertBefore(fallback, el.nextSibling);
                    }
                } catch (innerErr) {
                    console.error('Error applying fallback for element:', el, innerErr);
                }
            });
        } catch (err) {
            console.error('Error applying fallbacks:', err);
        }
    }

    // Function to check and possibly apply fallbacks
    function checkAndApplyFallbacks() {
        if (fallbackApplied || checkAttempts >= MAX_ATTEMPTS) {
            return; // Already applied or too many attempts
        }
        
        checkAttempts++;
        // Only require one test to fail to apply fallbacks (more aggressive approach)
        const codiconsBasicCheck = checkCodiconsLoaded();
        const iconTest = quickIconTest();
        
        console.log(`Codicon check attempt ${checkAttempts}: Basic check ${codiconsBasicCheck ? 'passed' : 'failed'}, Icon test ${iconTest ? 'passed' : 'failed'}`);
        
        // If either test fails, apply fallbacks
        if (!codiconsBasicCheck || !iconTest || FORCE_FALLBACK) {
            console.log(`Applying fallbacks on attempt ${checkAttempts} - Basic check: ${codiconsBasicCheck}, Icon test: ${iconTest}`);
            applyFallbackIcons();
            return true; // Indicate fallbacks were applied
        }
        return false; // Indicate no fallbacks were needed
    }

    // Attempt to apply fallbacks immediately if DOM is already loaded
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        setTimeout(() => {
            if (checkAndApplyFallbacks()) {
                console.log('Applied fallback icons immediately');
            }
        }, 100);
    }

    // Set up event listeners for various page load states
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            if (checkAndApplyFallbacks()) {
                console.log('Applied fallback icons after DOM content loaded');
            }
        }, 100);
    });

    window.addEventListener('load', () => {
        // Check immediately after load
        setTimeout(() => {
            if (checkAndApplyFallbacks()) {
                console.log('Applied fallback icons on first check');
            } else {
                console.log('Codicons loaded successfully on first check');
            }
        }, 200);

        // Check after a short delay (500ms)
        setTimeout(() => {
            if (checkAndApplyFallbacks()) {
                console.log('Applied fallback icons on second check');
            }
        }, 500);
        
        // Check after a medium delay (1500ms)
        setTimeout(() => {
            if (checkAndApplyFallbacks()) {
                console.log('Applied fallback icons on third check');
            }
        }, 1500);
        
        // Final check after full load expected (3000ms)
        setTimeout(() => {
            if (checkAndApplyFallbacks()) {
                console.log('Applied fallback icons on final check - UI elements missing codicons');
            }
        }, 3000);
    });
    
    // Add a manual trigger for testing
    window._applyFallbackIcons = applyFallbackIcons;
})();
