"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigurationService = void 0;
const vscode = __importStar(require("vscode"));
const logging_1 = require("../core/logging");
class ConfigurationService {
    constructor() {
        this.logger = logging_1.Logger.getInstance();
        this.config = vscode.workspace.getConfiguration('thefuse');
    }
    static getInstance() {
        if (!ConfigurationService.instance) {
            ConfigurationService.instance = new ConfigurationService();
        }
        return ConfigurationService.instance;
    }
    getSetting(key, defaultValue) {
        const value = this.config.get(key, defaultValue);
        this.logger.debug(`Retrieved configuration value for ${key}:`, value);
        return value;
    }
    async updateSetting(key, value, target = vscode.ConfigurationTarget.Workspace) {
        try {
            await this.config.update(key, value, target);
            this.logger.info(`Updated configuration value for ${key}:`, value);
        }
        catch (error) {
            this.logger.error(`Failed to update configuration value for ${key}:`, error);
            throw error;
        }
    }
    getDefaultSettings() {
        return {
            mcpPort: 9229,
            heartbeatInterval: 30000,
            logLevel: 'info',
            maxLogFiles: 5,
            maxLogSize: 1048576, // 1MB
            enableDebugMode: false
        };
    }
    async initialize() {
        try {
            const defaults = this.getDefaultSettings();
            for (const [key, defaultValue] of Object.entries(defaults)) {
                if (this.getSetting(key) === undefined) {
                    await this.updateSetting(key, defaultValue);
                }
            }
            this.logger.info('Configuration service initialized with default settings');
        }
        catch (error) {
            this.logger.error('Failed to initialize configuration service:', error);
            throw error;
        }
    }
    dispose() {
        // Clean up any resources if needed
    }
}
exports.ConfigurationService = ConfigurationService;
//# sourceMappingURL=configuration.js.map