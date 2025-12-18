// Notification System for The New Fuse Chat
(function() {
    let notificationContainer;
    
    // Initialize notification system
    function initializeNotifications() {
        // Create notification container if it doesn't exist
        if (!document.querySelector('.notification-container')) {
            notificationContainer = document.createElement('div');
            notificationContainer.className = 'notification-container';
            document.body.appendChild(notificationContainer);
        } else {
            notificationContainer = document.querySelector('.notification-container');
        }
    }
    
    // Show a notification
    function showNotification(message, type = 'info', duration = 4000) {
        if (!notificationContainer) {
            initializeNotifications();
        }
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        const messageSpan = document.createElement('span');
        messageSpan.textContent = message;
        
        const closeButton = document.createElement('button');
        closeButton.className = 'notification-close';
        closeButton.innerHTML = '<i class="codicon codicon-close"></i>';
        closeButton.setAttribute('aria-label', 'Close notification');
        
        notification.appendChild(messageSpan);
        notification.appendChild(closeButton);
        
        // Add to container
        notificationContainer.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // Auto-remove after duration
        const autoRemove = setTimeout(() => {
            removeNotification(notification);
        }, duration);
        
        // Manual close handler
        closeButton.addEventListener('click', () => {
            clearTimeout(autoRemove);
            removeNotification(notification);
        });
        
        return notification;
    }
    
    // Remove a notification
    function removeNotification(notification) {
        if (!notification || !notification.parentNode) {
            return;
        }
        
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }
    
    // Clear all notifications
    function clearAllNotifications() {
        if (!notificationContainer) {
            return;
        }
        
        const notifications = notificationContainer.querySelectorAll('.notification');
        notifications.forEach(removeNotification);
    }
    
    // Export to global scope
    window.notifications = {
        show: showNotification,
        remove: removeNotification,
        clear: clearAllNotifications,
        initialize: initializeNotifications
    };
    
    // Auto-initialize when DOM is ready
    document.addEventListener('DOMContentLoaded', initializeNotifications);
    
    // Also initialize immediately if DOM is already loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeNotifications);
    } else {
        initializeNotifications();
    }
})();
