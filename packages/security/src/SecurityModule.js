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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultConfig = void 0;
// Export all security services and types
__exportStar(require("./EncryptionService"), exports);
__exportStar(require("./SecurityService"), exports);
__exportStar(require("./auth"), exports);
__exportStar(require("./audit"), exports);
__exportStar(require("./rate-limiting"), exports);
__exportStar(require("./middleware"), exports);
// Default configuration
exports.defaultConfig = {
    encryption: {
        algorithm: 'aes-256-gcm',
        iterations: 32768,
        keyLength: 32
    },
    rateLimit: {
        windowMs: 60000,
        maxRequests: 100
    }
};
//# sourceMappingURL=SecurityModule.js.map