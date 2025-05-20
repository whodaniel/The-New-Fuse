import { StateManager } from '../../domain/core/stateManager.js';
import { LoggingService } from '../../services/logging.js';
export class ConfigService {
    constructor() {
        this.config = null;
        this.eventBus = EventBus.getInstance();
        this.stateManager = StateManager.getInstance();
        this.logger = LoggingService.getInstance();
    }
    static getInstance() {
        if (!ConfigService.instance) {
            ConfigService.instance = new ConfigService();
        }
        return ConfigService.instance;
    }
    async initialize() {
        try {
            const response = await fetch('/api/config');
            if (!response.ok) {
                throw new Error('Failed to fetch config');
            }
            const config = await response.json();
            this.config = this.validateConfig(config);
            this.stateManager.setState(['config'], this.config);
            this.eventBus.emit('config_loaded', this.config, 'ConfigService');
            return { success: true, data: undefined };
        }
        catch (error) {
            this.logger.error('Failed to initialize config', error);
            return {
                success: false,
                error: {
                    code: 'CONFIG_INIT_FAILED',
                    message: 'Failed to initialize configuration',
                    details: error
                }
            };
        }
    }
    validateConfig(config) {
        const requiredFields = ['apiUrl', 'wsUrl', 'environment', 'version'];
        for (const field of requiredFields) {
            if (!(field in config)) {
                throw new Error(`Missing required config field: ${field}`);
            }
        }
        if (!['development', 'staging', 'production'].includes(config.environment)) {
            throw new Error('Invalid environment value');
        }
        return {
            apiUrl: config.apiUrl,
            wsUrl: config.wsUrl,
            environment: config.environment,
            version: config.version,
            features: config.features || {},
            settings: config.settings || {}
        };
    }
    getConfig() {
        if (!this.config) {
            throw new Error('Config not initialized');
        }
        return Object.assign({}, this.config);
    }
    isFeatureEnabled(featureKey) {
        var _a, _b;
        return ((_b = (_a = this.config) === null || _a === void 0 ? void 0 : _a.features) === null || _b === void 0 ? void 0 : _b[featureKey]) || false;
    }
    getSetting(key, defaultValue) {
        var _a, _b, _c;
        return (_c = (_b = (_a = this.config) === null || _a === void 0 ? void 0 : _a.settings) === null || _b === void 0 ? void 0 : _b[key]) !== null && _c !== void 0 ? _c : defaultValue;
    }
    async updateSetting(key, value) {
        try {
            const response = await fetch('/api/config/settings', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ key, value })
            });
            if (!response.ok) {
                throw new Error('Failed to update setting');
            }
            if (this.config) {
                this.config.settings = Object.assign(Object.assign({}, this.config.settings), { [key]: value });
                this.stateManager.setState(['config', 'settings', key], value);
            }
            this.eventBus.emit('setting_updated', { key, value }, 'ConfigService');
            return { success: true, data: undefined };
        }
        catch (error) {
            this.logger.error('Failed to update setting', error);
            return {
                success: false,
                error: {
                    code: 'SETTING_UPDATE_FAILED',
                    message: 'Failed to update setting',
                    details: error
                }
            };
        }
    }
    isDevelopment() {
        var _a;
        return ((_a = this.config) === null || _a === void 0 ? void 0 : _a.environment) === 'development';
    }
    isStaging() {
        var _a;
        return ((_a = this.config) === null || _a === void 0 ? void 0 : _a.environment) === 'staging';
    }
    isProduction() {
        var _a;
        return ((_a = this.config) === null || _a === void 0 ? void 0 : _a.environment) === 'production';
    }
    getVersion() {
        var _a;
        return ((_a = this.config) === null || _a === void 0 ? void 0 : _a.version) || '0.0.0';
    }
    subscribeToConfig(callback) {
        return this.stateManager.subscribe(['config'], callback);
    }
    subscribeToSetting(key, callback) {
        return this.stateManager.subscribe(['config', 'settings', key], callback);
    }
}
//# sourceMappingURL=ConfigService.js.map