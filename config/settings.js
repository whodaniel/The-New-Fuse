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
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConfig = getConfig;
exports.validateConfig = validateConfig;
const path = __importStar(require("path"));
const crypto = __importStar(require("crypto"));
import timedelta_1 from './timedelta.js';
class BaseConfig {
}
BaseConfig.SECRET_KEY = process.env.SECRET_KEY || crypto.randomBytes(32);
BaseConfig.DEBUG = false;
BaseConfig.TESTING = false;
BaseConfig.SESSION_COOKIE_SECURE = true;
BaseConfig.SESSION_COOKIE_HTTPONLY = true;
BaseConfig.SESSION_COOKIE_SAMESITE = 'Lax';
BaseConfig.PERMANENT_SESSION_LIFETIME = new timedelta_1.timedelta({ minutes: 30 });
BaseConfig.MAX_CONTENT_LENGTH = 10 * 1024 * 1024;
BaseConfig.SQLALCHEMY_TRACK_MODIFICATIONS = false;
BaseConfig.REDIS_HOST = process.env.REDIS_HOST || 'localhost';
BaseConfig.REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379', 10);
BaseConfig.REDIS_DB = parseInt(process.env.REDIS_DB || '0', 10);
BaseConfig.REDIS_PASSWORD = process.env.REDIS_PASSWORD;
BaseConfig.RATELIMIT_DEFAULT = "200 per day;50 per hour";
BaseConfig.RATELIMIT_STORAGE_URL = "memory://";
BaseConfig.ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
BaseConfig.TEMPLATES_AUTO_RELOAD = true;
class DevelopmentConfig extends BaseConfig {
}
_a = DevelopmentConfig;
DevelopmentConfig.DEBUG = true;
DevelopmentConfig.INSTANCE_PATH = path.resolve(__dirname, '..', 'instance');
DevelopmentConfig.SQLALCHEMY_DATABASE_URI = `sqlite://${path.join(_a.INSTANCE_PATH, "dashboard.db")}`;
DevelopmentConfig.DATABASE_URL = _a.SQLALCHEMY_DATABASE_URI;
DevelopmentConfig.SESSION_COOKIE_SECURE = false;
DevelopmentConfig.SESSION_COOKIE_HTTPONLY = false;
class TestingConfig extends BaseConfig {
}
_b = TestingConfig;
TestingConfig.TESTING = true;
TestingConfig.DEBUG = true;
TestingConfig.SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:';
TestingConfig.DATABASE_URL = _b.SQLALCHEMY_DATABASE_URI;
TestingConfig.REDIS_DB = 1;
TestingConfig.RATELIMIT_ENABLED = false;
class ProductionConfig extends BaseConfig {
}
_c = ProductionConfig;
ProductionConfig.SQLALCHEMY_DATABASE_URI = process.env.DATABASE_URL || 'sqlite:///instance/dashboard.db';
ProductionConfig.DATABASE_URL = _c.SQLALCHEMY_DATABASE_URI;
ProductionConfig.REDIS_PASSWORD = process.env.REDIS_PASSWORD;
ProductionConfig.SESSION_COOKIE_SECURE = true;
ProductionConfig.PERMANENT_SESSION_LIFETIME = new timedelta_1.timedelta({ hours: 1 });
ProductionConfig.RATELIMIT_DEFAULT = "100 per day;20 per hour";
ProductionConfig.RATELIMIT_STORAGE_URL = process.env.REDIS_URL || "memory://";
const REQUIRED_ENV_VARS = {
    'production': [
        'SECRET_KEY',
        'DATABASE_URL',
        'REDIS_PASSWORD',
        'ENCRYPTION_KEY'
    ],
    'development': [],
    'testing': []
};
function getConfig() {
    const env = process.env.NODE_ENV || 'development';
    const configs = {
        'development': DevelopmentConfig,
        'testing': TestingConfig,
        'production': ProductionConfig
    };
    return configs[env] || DevelopmentConfig;
}
function validateConfig(config) {
    const env = process.env.NODE_ENV || 'development';
    const requiredVars = REQUIRED_ENV_VARS[env] || [];
    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    if (missingVars.length > 0) {
        throw new Error(`Missing required environment variables for ${env} environment: ` +
            missingVars.join(', '));
    }
}
validateConfig(getConfig());
//# sourceMappingURL=settings.js.map