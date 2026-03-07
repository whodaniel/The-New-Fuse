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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseConfig = void 0;
const path = __importStar(require("path"));
const crypto = __importStar(require("crypto"));
class BaseConfig {
    static asDict() {
        return Object.entries(this)
            .filter(([key, value]) => !key.startsWith('_') && key.toUpperCase() === key)
            .reduce((acc, [key, value]) => (Object.assign(Object.assign({}, acc), { [key]: value })), {});
    }
}
exports.BaseConfig = BaseConfig;
_a = BaseConfig;
BaseConfig.PROJECT_ROOT = path.resolve(__dirname, '..', '..');
BaseConfig.SRC_DIR = path.join(_a.PROJECT_ROOT, 'src');
BaseConfig.AGENCY_HUB_PORT = parseInt(process.env.AGENCY_HUB_PORT || '8000', 10);
BaseConfig.CASCADE_BRIDGE_PORT = parseInt(process.env.CASCADE_BRIDGE_PORT || '8001', 10);
BaseConfig.CLINE_BRIDGE_PORT = parseInt(process.env.CLINE_BRIDGE_PORT || '8002', 10);
BaseConfig.REDIS_HOST = process.env.REDIS_HOST || 'localhost';
BaseConfig.REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379', 10);
BaseConfig.REDIS_DB = parseInt(process.env.REDIS_DB || '0', 10);
BaseConfig.REDIS_PASSWORD = process.env.REDIS_PASSWORD;
BaseConfig.LOG_LEVEL = process.env.LOG_LEVEL || 'INFO';
BaseConfig.LOG_FORMAT = '%(asctime)s - %(name)s - %(levelname)s - %(message)s';
BaseConfig.SECRET_KEY = process.env.SECRET_KEY || crypto.randomBytes(32).toString('hex');
//# sourceMappingURL=base_config.js.map