// Enhanced Tabbed Container JavaScript
(function() {
    const vscode = acquireVsCodeApi();
    let currentTab = 'chat';
    let isInitialized = false;

    // Utility functions
    function postMessageToExtension(command, payload, expectsResponse = false) {
        const message = { command, payload };
        if (expectsResponse) {
            message.requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        }
        vscode.postMessage(message);
    }

    function showNotification(message, type = 'info', duration = 5000) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="codicon codicon-${getNotificationIcon(type)}"></i>
            <span>${message}</span>
            <button class="notification-close" onclick="this.parentElement.remove()">
                <i class="codicon codicon-close"></i>
            </button>
        `;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 16px;
            border-radius: 8px;
            color: white;
            font-size: 14px;
            z-index: 1000;
            display: flex;
            align-items: center;
            gap: 8px;
            animation: slideInRight 0.3s ease;
            ${getNotificationStyle(type)}
        `;
        
        document.body.appendChild(notification);
        
        if (duration > 0) {
            setTimeout(() => {
                notification.style.animation = 'slideOutRight 0.3s ease';
                setTimeout(() => notification.remove(), 300);
            }, duration);
        }
    }

    function getNotificationIcon(type) {
        const icons = {
            info: 'info',
            success: 'check',
            warning: 'warning',
            error: 'error'
        };
        return icons[type] || 'info';
    }

    function getNotificationStyle(type) {
        const styles = {
            info: 'background: var(--vscode-textLink-foreground);',
            success: 'background: var(--vscode-terminal-ansiGreen);',
            warning: 'background: var(--vscode-inputValidation-warningBackground); color: var(--vscode-inputValidation-warningForeground);',
            error: 'background: var(--vscode-errorForeground);'
        };
        return styles[type] || styles.info;
    }

    function setActiveTab(tabId) {
        const tabButtons = document.querySelectorAll('.tab-button');
        const tabPanels = document.querySelectorAll('.tab-panel');
        
        tabButtons.forEach(button => {
            const isActive = button.dataset.tab === tabId;
            button.classList.toggle('active', isActive);
            button.setAttribute('aria-selected', isActive);
        });
        
        tabPanels.forEach(panel => {
            const isActive = panel.id === `${tabId}-tab`;
            panel.classList.toggle('active', isActive);
            panel.setAttribute('aria-hidden', !isActive);
        });
        
        currentTab = tabId;
        
        // Notify extension of tab change
        postMessageToExtension('tabChanged', { tabId });
        
        // Focus management
        const activePanel = document.querySelector('.tab-panel.active');
        if (activePanel) {
            const focusable = activePanel.querySelector('[tabindex], input, textarea, button');
            if (focusable) focusable.focus();
        }
    }

    function initializeTabs() {
        const tabButtons = document.querySelectorAll('.tab-button');
        
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tabId = button.dataset.tab;
                setActiveTab(tabId);
            });
            
            // Keyboard navigation
            button.addEventListener('keydown', (e) => {
                const tabs = Array.from(tabButtons);
                const currentIndex = tabs.indexOf(e.target);
                
                switch (e.key) {
                    case 'ArrowLeft':
                        e.preventDefault();
                        const prevIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1;
                        tabs[prevIndex].click();
                        break;
                    case 'ArrowRight':
                        e.preventDefault();
                        const nextIndex = currentIndex < tabs.length - 1 ? currentIndex + 1 : 0;
                        tabs[nextIndex].click();
                        break;
                    case 'Home':
                        e.preventDefault();
                        tabs[0].click();
                        break;
                    case 'End':
                        e.preventDefault();
                        tabs[tabs.length - 1].click();
                        break;
                }
            });
        });
        
        // Set initial tab
        setActiveTab('chat');
    }

    function handleResize() {
        const container = document.querySelector('.tabbed-container');
        if (container) {
            const isCompact = window.innerWidth < 400;
            container.classList.toggle('compact', isCompact);
        }
    }

    function initializeKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case '1':
                        e.preventDefault();
                        setActiveTab('chat');
                        break;
                    case '2':
                        e.preventDefault();
                        setActiveTab('communication');
                        break;
                    case '3':
                        e.preventDefault();
                        setActiveTab('dashboard');
                        break;
                    case '4':
                        e.preventDefault();
                        setActiveTab('settings');
                        break;
                }
            }
        });
    }

    // Message handling
    window.addEventListener('message', event => {
        const { command, payload } = event.data;
        
        switch (command) {
            case 'switchTab':
                if (payload?.tab) {
                    setActiveTab(payload.tab);
                }
                break;
                
            case 'showNotification':
                if (payload) {
                    showNotification(payload.message, payload.type, payload.duration);
                }
                break;
                
            case 'updateConnectionStatus':
                updateConnectionStatus(payload?.isConnected);
                break;
                
            case 'initialize':
                if (!isInitialized) {
                    initializeTabs();
                    initializeKeyboardShortcuts();
                    handleResize();
                    isInitialized = true;
                }
                break;
                
            case 'focusTab':
                if (payload?.tab) {
                    setActiveTab(payload.tab);
                }
                break;
        }
    });

    function updateConnectionStatus(isConnected) {
        const indicators = document.querySelectorAll('.connection-status');
        indicators.forEach(indicator => {
            indicator.textContent = isConnected ? 'Connected' : 'Disconnected';
            indicator.className = `connection-status ${isConnected ? 'connected' : 'disconnected'}`;
        });
    }

    // Initialize on DOM ready
    document.addEventListener('DOMContentLoaded', () => {
        // Add CSS animations
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOutRight {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
            .notification-close {
                background: none;
                border: none;
                color: inherit;
                cursor: pointer;
                margin-left: 8px;
                opacity: 0.8;
            }
            .notification-close:hover {
                opacity: 1;
            }
        `;
        document.head.appendChild(style);
        
        // Initialize
        initializeTabs();
        initializeKeyboardShortcuts();
        handleResize();
        
        // Handle window resize
        window.addEventListener('resize', handleResize);
        
        // Notify extension that webview is ready
        postMessageToExtension('webviewReady');
    });
})();
