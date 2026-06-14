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
exports.logger = exports.config = exports.constants = void 0;
__exportStar(require("./utils/example.js"), exports);
exports.constants = {
    SERVICE_NAME: 'the-new-fuse',
    VERSION: '1.0.0',
};
exports.config = {
    environment: process.env.NODE_ENV ?? 'development',
    isProduction: process.env.NODE_ENV === 'production',
};
exports.logger = {
    info: (...args) => console.info('[common]', ...args),
    warn: (...args) => console.warn('[common]', ...args),
    error: (...args) => console.error('[common]', ...args),
};
//# sourceMappingURL=index.js.map