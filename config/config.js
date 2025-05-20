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
exports.get_settings = get_settings;
const dotenv = __importStar(require("dotenv"));
import timedelta_1 from './timedelta.js';
const crypto = __importStar(require("crypto"));
dotenv.config();
class Config {
    constructor() {
        this.SECRET_KEY = process.env.SECRET_KEY || 'your-secret-key-here';
        this.SQLALCHEMY_DATABASE_URI = process.env.DATABASE_URL ||
            'sqlite:///instance/dashboard.db';
        this.SQLALCHEMY_TRACK_MODIFICATIONS = false;
        this.REDIS_HOST = process.env.REDIS_HOST || 'localhost';
        this.REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379', 10);
        this.REDIS_DB = parseInt(process.env.REDIS_DB || '0', 10);
        this.REDIS_PASSWORD = process.env.REDIS_PASSWORD;
        this.REDIS_SSL = (process.env.REDIS_SSL || 'false').toLowerCase() === 'true';
        this.REDIS_TIMEOUT = parseInt(process.env.REDIS_TIMEOUT || '5', 10);
        this.SESSION_TYPE = 'redis';
        this.PERMANENT_SESSION_LIFETIME = new timedelta_1.timedelta({ days: 1 });
        this.SESSION_REDIS_HOST = this.REDIS_HOST;
        this.SESSION_REDIS_PORT = this.REDIS_PORT;
        this.SESSION_REDIS_DB = this.REDIS_DB;
        this.SESSION_REDIS_PASSWORD = this.REDIS_PASSWORD;
        this.SESSION_REDIS_SSL = this.REDIS_SSL;
        this.RATELIMIT_STORAGE_URL = `redis://${this.REDIS_HOST}:${this.REDIS_PORT}/${this.REDIS_DB}`;
        this.RATELIMIT_STRATEGY = 'fixed-window';
        this.RATELIMIT_DEFAULT = "200 per day;50 per hour;10 per minute";
        this.ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || Buffer.from(crypto.randomBytes(32));
        this.ACCESS_TOKEN_EXPIRE_MINUTES = parseInt(process.env.ACCESS_TOKEN_EXPIRE_MINUTES || '60', 10);
        this.REFRESH_TOKEN_EXPIRE_DAYS = parseInt(process.env.REFRESH_TOKEN_EXPIRE_DAYS || '7', 10);
        this.JWT_ALGORITHM = "HS256";
        this.SMTP_SERVER = process.env.SMTP_SERVER || 'smtp.gmail.com';
        this.SMTP_PORT = parseInt(process.env.SMTP_PORT || '587', 10);
        this.SMTP_USERNAME = process.env.SMTP_USERNAME;
        this.SMTP_PASSWORD = process.env.SMTP_PASSWORD;
        this.SMTP_FROM_EMAIL = process.env.SMTP_FROM_EMAIL || 'noreply@fuse-ai.com';
        this.MIN_PASSWORD_LENGTH = 8;
        this.PASSWORD_REQUIRE_SPECIAL = true;
        this.PASSWORD_REQUIRE_NUMBERS = true;
        this.MAX_LOGIN_ATTEMPTS = 5;
        this.LOCKOUT_DURATION_MINUTES = 30;
        this.REQUIRE_EMAIL_VERIFICATION = true;
    }
}
class DevelopmentConfig extends Config {
    constructor() {
        super(...arguments);
        this.DEBUG = true;
        this.TEMPLATES_AUTO_RELOAD = true;
        this.REQUIRE_EMAIL_VERIFICATION = false;
    }
}
class ProductionConfig extends Config {
    constructor() {
        super(...arguments);
        this.DEBUG = false;
        this.SECRET_KEY = process.env.SECRET_KEY;
        this.ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
        this.REQUIRE_EMAIL_VERIFICATION = true;
    }
}
const config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
};
function get_settings() {
    const env = process.env.FLASK_ENV || 'default';
    return new config[env]();
}
//# sourceMappingURL=config.js.map