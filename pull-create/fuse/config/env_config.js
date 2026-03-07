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
exports.TestingConfig = exports.DevelopmentConfig = exports.ProductionConfig = exports.BaseConfig = void 0;
exports.getConfig = getConfig;
const crypto = __importStar(require("crypto"));
class BaseConfig {
}
exports.BaseConfig = BaseConfig;
BaseConfig.DEBUG = false;
BaseConfig.TESTING = false;
BaseConfig.LOG_LEVEL = 'INFO';
BaseConfig.LOG_FORMAT = '%(asctime)s - %(name)s - %(levelname)s - %(message)s';
BaseConfig.SECRET_KEY = process.env.SECRET_KEY || crypto.randomBytes(32).toString('hex');
class ProductionConfig extends BaseConfig {
}
exports.ProductionConfig = ProductionConfig;
ProductionConfig.LOG_LEVEL = 'INFO';
ProductionConfig.LOG_FORMAT = '%(asctime)s - %(name)s - %(levelname)s - %(message)s';
ProductionConfig.REDIS_HOST = process.env.REDIS_HOST || 'redis';
ProductionConfig.REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379', 10);
ProductionConfig.REDIS_DB = parseInt(process.env.REDIS_DB || '0', 10);
class DevelopmentConfig extends BaseConfig {
}
exports.DevelopmentConfig = DevelopmentConfig;
DevelopmentConfig.DEBUG = true;
DevelopmentConfig.LOG_LEVEL = 'DEBUG';
DevelopmentConfig.LOG_FORMAT = '%(asctime)s - %(name)s - %(levelname)s - [%(filename)s:%(lineno)d] - %(message)s';
DevelopmentConfig.REDIS_HOST = process.env.REDIS_HOST || 'localhost';
DevelopmentConfig.REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379', 10);
DevelopmentConfig.REDIS_DB = parseInt(process.env.REDIS_DB || '0', 10);
class TestingConfig extends BaseConfig {
}
exports.TestingConfig = TestingConfig;
TestingConfig.TESTING = true;
TestingConfig.DEBUG = true;
TestingConfig.LOG_LEVEL = 'DEBUG';
TestingConfig.LOG_FORMAT = '%(asctime)s - %(name)s - %(levelname)s - [%(filename)s:%(lineno)d] - %(message)s';
TestingConfig.REDIS_HOST = process.env.TEST_REDIS_HOST || 'localhost';
TestingConfig.REDIS_PORT = parseInt(process.env.TEST_REDIS_PORT || '6379', 10);
TestingConfig.REDIS_DB = parseInt(process.env.TEST_REDIS_DB || '1', 10);
TestingConfig.SECRET_KEY = 'test-secret-key';
function getConfig(env) {
    env = env || process.env.FLASK_ENV || 'development';
    const configs = {
        'development': DevelopmentConfig,
        'production': ProductionConfig,
        'testing': TestingConfig
    };
    return configs[env] || DevelopmentConfig;
}
//# sourceMappingURL=env_config.js.map