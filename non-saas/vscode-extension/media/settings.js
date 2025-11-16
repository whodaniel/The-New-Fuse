// Settings Management for The New Fuse Chat
(function() {
    let settingsContainer;
    let isSettingsOpen = false;
    
    // Default settings
    const defaultSettings = {
        theme: 'auto',
        notifications: true,
        autoSave: true,
        maxMessages: 100,
        showTimestamps: true,
        showMessageActions: true,
        enableStarring: true,
        exportFormat: 'json'
    };
    
    let currentSettings = { ...defaultSettings };
    
    // Initialize settings system
    function initializeSettings() {
        createSettingsUI();
        loadSettings();
        
        // Add settings button to command menu if it doesn't exist
        addSettingsButton();
    }
    
    // Create settings UI
    function createSettingsUI() {
        if (document.querySelector('.settings-overlay')) {return;}
        
        // Create overlay
        const overlay = document.createElement('div');
        overlay.className = 'settings-overlay';
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closeSettings();
            }
        });
        
        // Create settings panel
        settingsContainer = document.createElement('div');
        settingsContainer.className = 'settings-panel';
        
        // Settings header
        const header = document.createElement('div');
        header.className = 'settings-header';
        header.innerHTML = `
            <h3>Settings</h3>
            <button class="settings-close" title="Close Settings">
                <i class="codicon codicon-close"></i>
            </button>
        `;
        
        // Settings content
        const content = document.createElement('div');
        content.className = 'settings-content';
        content.innerHTML = createSettingsHTML();
        
        // Settings footer
        const footer = document.createElement('div');
        footer.className = 'settings-footer';
        footer.innerHTML = `
            <button class="settings-button secondary" id="resetSettings">Reset to Defaults</button>
            <button class="settings-button primary" id="saveSettings">Save Settings</button>
        `;
        
        settingsContainer.appendChild(header);
        settingsContainer.appendChild(content);
        settingsContainer.appendChild(footer);
        overlay.appendChild(settingsContainer);
        
        document.body.appendChild(overlay);
        
        // Add event listeners
        header.querySelector('.settings-close').addEventListener('click', closeSettings);
        footer.querySelector('#resetSettings').addEventListener('click', resetSettings);
        footer.querySelector('#saveSettings').addEventListener('click', saveSettings);
        
        // Add input event listeners
        content.addEventListener('change', handleSettingChange);
        content.addEventListener('input', handleSettingChange);
    }
    
    // Create settings HTML
    function createSettingsHTML() {
        return `
            <div class="settings-section">
                <h4>Appearance</h4>
                <div class="settings-item">
                    <label for="theme">Theme</label>
                    <select id="theme" name="theme">
                        <option value="auto">Auto (Follow VS Code)</option>
                        <option value="light">Light</option>
                        <option value="dark">Dark</option>
                    </select>
                </div>
                <div class="settings-item">
                    <label>
                        <input type="checkbox" id="showTimestamps" name="showTimestamps">
                        Show message timestamps
                    </label>
                </div>
                <div class="settings-item">
                    <label>
                        <input type="checkbox" id="showMessageActions" name="showMessageActions">
                        Show message actions (star, copy, etc.)
                    </label>
                </div>
            </div>
            
            <div class="settings-section">
                <h4>Features</h4>
                <div class="settings-item">
                    <label>
                        <input type="checkbox" id="notifications" name="notifications">
                        Enable notifications
                    </label>
                </div>
                <div class="settings-item">
                    <label>
                        <input type="checkbox" id="enableStarring" name="enableStarring">
                        Enable message starring
                    </label>
                </div>
                <div class="settings-item">
                    <label>
                        <input type="checkbox" id="autoSave" name="autoSave">
                        Auto-save chat sessions
                    </label>
                </div>
            </div>
            
            <div class="settings-section">
                <h4>Performance</h4>
                <div class="settings-item">
                    <label for="maxMessages">Maximum messages to keep</label>
                    <input type="number" id="maxMessages" name="maxMessages" min="10" max="1000" step="10">
                </div>
            </div>
            
            <div class="settings-section">
                <h4>Export</h4>
                <div class="settings-item">
                    <label for="exportFormat">Default export format</label>
                    <select id="exportFormat" name="exportFormat">
                        <option value="json">JSON</option>
                        <option value="markdown">Markdown</option>
                        <option value="txt">Plain Text</option>
                    </select>
                </div>
            </div>
        `;
    }
    
    // Add settings button to UI
    function addSettingsButton() {
        const commandsDropdown = document.getElementById('commandsDropdown');
        if (!commandsDropdown) {return;}
        
        // Check if settings button already exists
        if (commandsDropdown.querySelector('[data-command="openSettings"]')) {return;}
        
        const settingsButton = document.createElement('button');
        settingsButton.className = 'command-item';
        settingsButton.setAttribute('data-command', 'openSettings');
        settingsButton.innerHTML = '<i class="codicon codicon-settings"></i> Settings';
        settingsButton.addEventListener('click', openSettings);
        
        // Add to the UI category
        const uiCategory = Array.from(commandsDropdown.children).find(el => 
            el.textContent.includes('UI') && el.className === 'command-category'
        );
        
        if (uiCategory && uiCategory.nextElementSibling) {
            commandsDropdown.insertBefore(settingsButton, uiCategory.nextElementSibling.nextElementSibling);
        } else {
            commandsDropdown.appendChild(settingsButton);
        }
    }
    
    // Open settings
    function openSettings() {
        if (!settingsContainer) {
            createSettingsUI();
        }
        
        const overlay = document.querySelector('.settings-overlay');
        if (overlay) {
            overlay.style.display = 'flex';
            isSettingsOpen = true;
            
            // Populate current settings
            populateSettings();
            
            // Focus first input
            setTimeout(() => {
                const firstInput = settingsContainer.querySelector('input, select');
                if (firstInput) {firstInput.focus();}
            }, 100);
        }
    }
    
    // Close settings
    function closeSettings() {
        const overlay = document.querySelector('.settings-overlay');
        if (overlay) {
            overlay.style.display = 'none';
            isSettingsOpen = false;
        }
    }
    
    // Populate settings form with current values
    function populateSettings() {
        Object.keys(currentSettings).forEach(key => {
            const element = document.getElementById(key);
            if (element) {
                if (element.type === 'checkbox') {
                    element.checked = currentSettings[key];
                } else {
                    element.value = currentSettings[key];
                }
            }
        });
    }
    
    // Handle setting changes
    function handleSettingChange(event) {
        const { name, value, type, checked } = event.target;
        if (!name) {return;}
        
        currentSettings[name] = type === 'checkbox' ? checked : value;
        
        // Apply immediate changes for some settings
        applySettingChange(name, currentSettings[name]);
    }
    
    // Apply setting changes immediately
    function applySettingChange(settingName, value) {
        switch (settingName) {
            case 'showTimestamps':
                toggleTimestamps(value);
                break;
            case 'showMessageActions':
                toggleMessageActions(value);
                break;
            case 'notifications':
                // Could disable/enable notification system
                break;
        }
    }
    
    // Toggle timestamp visibility
    function toggleTimestamps(show) {
        const timestamps = document.querySelectorAll('.message-time');
        timestamps.forEach(timestamp => {
            timestamp.style.display = show ? 'block' : 'none';
        });
    }
    
    // Toggle message actions visibility
    function toggleMessageActions(show) {
        const actions = document.querySelectorAll('.message-actions');
        actions.forEach(action => {
            action.style.display = show ? 'flex' : 'none';
        });
    }
    
    // Save settings
    function saveSettings() {
        // Send settings to extension
        if (typeof vscode !== 'undefined') {
            vscode.postMessage({
                type: 'saveSettings',
                settings: currentSettings
            });
        }
        
        // Save to localStorage as backup
        try {
            localStorage.setItem('theNewFuseSettings', JSON.stringify(currentSettings));
        } catch (e) {
            console.warn('Failed to save settings to localStorage:', e);
        }
        
        closeSettings();
        
        // Show confirmation
        if (window.notifications) {
            window.notifications.show('Settings saved successfully', 'success');
        }
    }
    
    // Reset settings to defaults
    function resetSettings() {
        if (confirm('Are you sure you want to reset all settings to their defaults?')) {
            currentSettings = { ...defaultSettings };
            populateSettings();
            
            // Apply changes immediately
            Object.keys(currentSettings).forEach(key => {
                applySettingChange(key, currentSettings[key]);
            });
            
            if (window.notifications) {
                window.notifications.show('Settings reset to defaults', 'info');
            }
        }
    }
    
    // Load settings
    function loadSettings() {
        // Try to load from localStorage first
        try {
            const saved = localStorage.getItem('theNewFuseSettings');
            if (saved) {
                const parsed = JSON.parse(saved);
                currentSettings = { ...defaultSettings, ...parsed };
            }
        } catch (e) {
            console.warn('Failed to load settings from localStorage:', e);
        }
        
        // Request settings from extension
        if (typeof vscode !== 'undefined') {
            vscode.postMessage({
                type: 'loadSettings'
            });
        }
        
        // Apply loaded settings
        Object.keys(currentSettings).forEach(key => {
            applySettingChange(key, currentSettings[key]);
        });
    }
    
    // Export settings functions
    window.settingsManager = {
        initialize: initializeSettings,
        open: openSettings,
        close: closeSettings,
        getCurrentSettings: () => ({ ...currentSettings }),
        updateSettings: (newSettings) => {
            currentSettings = { ...currentSettings, ...newSettings };
            Object.keys(newSettings).forEach(key => {
                applySettingChange(key, newSettings[key]);
            });
        }
    };
    
    // Auto-initialize
    document.addEventListener('DOMContentLoaded', initializeSettings);
    
    // Handle settings messages from extension
    window.addEventListener('message', (event) => {
        const message = event.data;
        
        switch (message.type) {
            case 'settingsLoaded':
                if (message.settings) {
                    currentSettings = { ...defaultSettings, ...message.settings };
                    if (isSettingsOpen) {
                        populateSettings();
                    }
                    // Apply loaded settings
                    Object.keys(currentSettings).forEach(key => {
                        applySettingChange(key, currentSettings[key]);
                    });
                }
                break;
        }
    });
})();
