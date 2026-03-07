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
exports.ConfigurationManager = void 0;
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const dotenv = __importStar(require("dotenv"));
const winston = __importStar(require("winston"));
import env_config_1 from './env_config.js';
class ConfigurationManager {
    constructor() {
        this._initialize();
    }
    static getInstance() {
        if (!ConfigurationManager._instance) {
            ConfigurationManager._instance = new ConfigurationManager();
        }
        return ConfigurationManager._instance;
    }
    _initialize() {
        const envFile = path.resolve(__dirname, '..', '..', '.env');
        if (fs.existsSync(envFile)) {
            dotenv.config({ path: envFile });
        }
        this._config = (0, env_config_1.getConfig)();
        this._setupLogging();
        this._validateConfiguration();
    }
    _setupLogging() {
        winston.configure({
            level: this._config.LOG_LEVEL.toLowerCase(),
            format: winston.format.printf(({ level, message, timestamp }) => {
                return this._config.LOG_FORMAT
                    .replace('%(asctime)s', timestamp)
                    .replace('%(levelname)s', level.toUpperCase())
                    .replace('%(message)s', message);
            }),
            transports: [
                new winston.transports.Console()
            ]
        });
    }
    _validateConfiguration() {
        const requiredSettings = {
            'REDIS_HOST': 'Redis host must be specified',
            'REDIS_PORT': 'Redis port must be specified',
            'SECRET_KEY': 'Secret key must be specified'
        };
        for (const [setting, message] of Object.entries(requiredSettings)) {
            if (!this._config[setting]) {
                throw new Error(`Configuration Error: ${message}`);
            }
        }
    }
    get(key) {
        return this._config[key];
    }
    getAll() {
        return Object.assign({}, this._config);
    }
}
exports.ConfigurationManager = ConfigurationManager;
//# sourceMappingURL=config_manager.js.map