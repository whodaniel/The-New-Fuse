/**
 * Enhanced welcome message functionality for The New Fuse chat
 */
(function() {
    // This will be called by the main chat.js script
    window.showEnhancedWelcomeMessage = function(messagesContainer) {
        if (!messagesContainer || messagesContainer.children.length > 0) {
            return; // Don't show if container doesn't exist or already has messages
        }
            
        const welcomeDiv = document.createElement('div');
        welcomeDiv.className = 'welcome-message';
        welcomeDiv.innerHTML = `
            <h2>Welcome to The New Fuse</h2>
            <p>Your AI assistant is ready to help you with:</p>
            <ul class="welcome-features">
                <li><i class="codicon codicon-code"></i> Code assistance & explanations</li>
                <li><i class="codicon codicon-question"></i> Project questions & support</li>
                <li><i class="codicon codicon-lightbulb"></i> Ideas & suggestions for your work</li>
            </ul>
            <p class="welcome-start">Type a message below to get started</p>
        `;
        messagesContainer.appendChild(welcomeDiv);
        
        // Add subtle animation to welcome message items
        setTimeout(() => {
            const features = welcomeDiv.querySelectorAll('.welcome-features li');
            features.forEach((feature, index) => {
                feature.style.opacity = '0';
                feature.style.transform = 'translateX(-10px)';
                feature.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                
                setTimeout(() => {
                    feature.style.opacity = '1';
                    feature.style.transform = 'translateX(0)';
                }, 300 + (index * 150));
            });
        }, 300);
        
        return welcomeDiv;
    };
})();
