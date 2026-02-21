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
exports.ConfigService = void 0;
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function")
        r = Reflect.decorate(decorators, target, key, desc);
    else
        for (var i = decorators.length - 1; i >= 0; i--)
            if (d = decorators[i])
                r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function")
        return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); };
};
var _a;
import inversify_1 from 'inversify';
import types_1 from '../di/types.js';
import event_bus_1 from '../events/event-bus.js';
const dotenv = __importStar(require("dotenv"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
import lodash_1 from 'lodash';
let ConfigService = class ConfigService {
    constructor(logger, eventBus) {
        Object.defineProperty(this, "logger", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: logger
        });
        Object.defineProperty(this, "eventBus", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: eventBus
        });
        Object.defineProperty(this, "config", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: {}
        });
        Object.defineProperty(this, "watcher", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
    }
}(), Promise;
exports.ConfigService = ConfigService;
(options = {});
{
    const env = options.env || process.env.NODE_ENV || 'development';
    // Load environment variables
    dotenv.config({
        path: path.resolve(process.cwd(), `.env.${env}`)
    });
    // Load base configuration
    this.config = {
        env,
        app: {
            name: 'The New Fuse',
            version: process.env.npm_package_version || '1.0.0',
            port: parseInt(process.env.PORT || '3000', 10)
        },
        auth: {
            tokenSecret: process.env.JWT_SECRET || 'your-secret-key',
            refreshTokenSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key',
            tokenExpiry: process.env.JWT_EXPIRY || '1h',
            refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
            maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5', 10),
            lockoutDuration: parseInt(process.env.LOCKOUT_DURATION || '1800000', 10), // 30 minutes
            password: {
                minLength: parseInt(process.env.PASSWORD_MIN_LENGTH || '8', 10),
                requireUppercase: process.env.PASSWORD_REQUIRE_UPPERCASE !== 'false',
                requireLowercase: process.env.PASSWORD_REQUIRE_LOWERCASE !== 'false',
                requireNumbers: process.env.PASSWORD_REQUIRE_NUMBERS !== 'false',
                requireSpecial: process.env.PASSWORD_REQUIRE_SPECIAL !== 'false'
            },
            mfa: {
                secretLength: parseInt(process.env.MFA_SECRET_LENGTH || '20', 10),
                setupTTL: parseInt(process.env.MFA_SETUP_TTL || '300000', 10), // 5 minutes
                backupCodes: parseInt(process.env.MFA_BACKUP_CODES || '10', 10)
            }
        },
        session: {
            duration: parseInt(process.env.SESSION_DURATION || '86400000', 10), // 24 hours
            inactivityTimeout: parseInt(process.env.SESSION_INACTIVITY_TIMEOUT || '1800000', 10), // 30 minutes
            maxConcurrentSessions: parseInt(process.env.MAX_CONCURRENT_SESSIONS || '5', 10)
        },
        database: {
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '5432', 10),
            username: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            ssl: process.env.DB_SSL === 'true'
        },
        redis: {
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379', 10),
            password: process.env.REDIS_PASSWORD,
            ssl: process.env.REDIS_SSL === 'true'
        },
        logging: {
            console: {
                enabled: process.env.LOG_CONSOLE !== 'false',
                level: process.env.LOG_CONSOLE_LEVEL || 'info',
                format: process.env.LOG_CONSOLE_FORMAT || 'pretty'
            },
            file: {
                enabled: process.env.LOG_FILE !== 'false',
                path: process.env.LOG_FILE_PATH || 'logs/app.log',
                level: process.env.LOG_FILE_LEVEL || 'info',
                maxSize: process.env.LOG_FILE_MAX_SIZE || '10m',
                maxFiles: process.env.LOG_FILE_MAX_FILES || '7d',
                format: process.env.LOG_FILE_FORMAT || 'json'
            },
            security: {
                enabled: process.env.LOG_SECURITY !== 'false',
                path: process.env.LOG_SECURITY_PATH || 'logs/security.log',
                level: process.env.LOG_SECURITY_LEVEL || 'info',
                maxSize: process.env.LOG_SECURITY_MAX_SIZE || '10m',
                maxFiles: process.env.LOG_SECURITY_MAX_FILES || '30d'
            }
        },
        rateLimit: {
            windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '60000', 10), // 1 minute
            max: parseInt(process.env.RATE_LIMIT_MAX || '60', 10), // 60 requests per minute
            message: process.env.RATE_LIMIT_MESSAGE || 'Too many requests, please try again later'
        }
    };
    // Load environment-specific configuration if available
    const envConfigPath = options.configPath || path.resolve(process.cwd(), `config/${env}.json`);
    if (fs.existsSync(envConfigPath)) {
        const envConfig = JSON.parse(fs.readFileSync(envConfigPath, 'utf8'));
        (0, lodash_1.merge)(this.config, envConfig);
    }
    // Watch for configuration changes if enabled
    if (options.watchConfig && envConfigPath) {
        this.watchConfig(envConfigPath);
    }
    this.logger.info('Configuration loaded', { env });
}
(0, lodash_1.get)(key, defaultValue);
{
    return (0, lodash_1.get)(this.config, key, defaultValue);
}
(0, lodash_1.set)(key, value);
{
    (0, lodash_1.set)(this.config, key, value);
    this.eventBus.publish('config.changed', { key, value });
}
watchConfig(configPath);
{
    if (this.watcher) {
        this.watcher.close();
    }
    this.watcher = fs.watch(configPath, (eventType) => {
        if (eventType === 'change') {
            try {
                const newConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
                (0, lodash_1.merge)(this.config, newConfig);
                this.eventBus.publish('config.reloaded', { source: configPath });
                this.logger.info('Configuration reloaded', { source: configPath });
            }
            catch (error) {
                this.logger.error('Failed to reload configuration', { error });
            }
        }
    });
}
dispose();
{
    if (this.watcher) {
        this.watcher.close();
        this.watcher = null;
    }
}
;
exports.ConfigService = ConfigService = __decorate([
    (0, inversify_1.injectable)(),
    __param(0, (0, inversify_1.inject)(types_1.TYPES.Logger)),
    __param(1, (0, inversify_1.inject)(types_1.TYPES.EventBus)),
    __metadata("design:paramtypes", [typeof (_a = typeof winston_1.Logger !== "undefined" && winston_1.Logger) === "function" ? _a : Object, event_bus_1.EventBus])
], ConfigService);
//# sourceMappingURL=config.service.js.map
