export {}
exports.settingsManager = void 0;
class SettingsManager {
    constructor() {
        this.storageKey = 'user_settings';
        this.settings = this.loadSettings();
    }
    static getInstance() {
        if (!SettingsManager.instance) {
            SettingsManager.instance = new SettingsManager();
        }
        return SettingsManager.instance;
    }
    loadSettings() {
        const savedSettings = localStorage.getItem(this.storageKey);
        return savedSettings ? JSON.parse(savedSettings) : this.getDefaultSettings();
    }
    getDefaultSettings() {
        return {
            notifications: {
                email: true,
                desktop: true,
                weeklyReports: true
            },
            api: {
                key: '',
                webhookUrl: ''
            },
            profile: {
                fullName: '',
                email: '',
                avatar: ''
            }
        };
    }
    async updateSettings(newSettings) {
        this.settings = Object.assign(Object.assign({}, this.settings), newSettings);
        await this.saveSettings();
        this.notifySettingsChanged();
    }
    async saveSettings() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.settings));
            await this.syncWithServer();
        }
        catch (error) {
            console.error('Failed to save settings:', error);
            throw new Error('Failed to save settings');
        }
    }
    async syncWithServer() {
        try {
            const response = await fetch('/api/settings', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(this.settings),
            });
            if (!response.ok) {
                throw new Error('Failed to sync settings with server');
            }
        }
        catch (error) {
            console.error('Failed to sync settings:', error);
            throw error;
        }
    }
    async generateNewApiKey() {
        try {
            const response = await fetch('/api/generate-key', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            if (!response.ok) {
                throw new Error('Failed to generate new API key');
            }
            const { apiKey } = await response.json();
            await this.updateSettings({
                api: Object.assign(Object.assign({}, this.settings.api), { key: apiKey })
            });
            return apiKey;
        }
        catch (error) {
            console.error('Failed to generate API key:', error);
            throw error;
        }
    }
    notifySettingsChanged() {
        const event = new CustomEvent('settingsChanged', {
            detail: this.settings
        });
        window.dispatchEvent(event);
    }
    getNotificationSettings() {
        return this.settings.notifications;
    }
    getApiSettings() {
        return this.settings.api;
    }
    getProfileSettings() {
        return this.settings.profile;
    }
}
const settingsManager = SettingsManager.getInstance();
exports.settingsManager = settingsManager;
export {};
//# sourceMappingURL=settingsManager.js.map