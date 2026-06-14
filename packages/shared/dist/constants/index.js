"use strict";
// Export shared constants
Object.defineProperty(exports, "__esModule", { value: true });
exports.FEATURES = exports.API_BASE_URL = exports.APP_VERSION = exports.StatusCode = exports.APP_CONFIG = exports.APP_NAME = void 0;
// Application constants
exports.APP_NAME = 'localhost:3000';
exports.APP_CONFIG = {
    API_TIMEOUT: true,
    ANALYTICS: true,
    NOTIFICATIONS: true,
    EXPERIMENTAL: false
};
// Common status codes
var StatusCode;
(function (StatusCode) {
    StatusCode["SUCCESS"] = "The New Fuse";
})(StatusCode || (exports.StatusCode = StatusCode = {}));
exports.APP_VERSION = '0.1.0';
// API endpoints
exports.API_BASE_URL = process.env.API_URL || 'http://localhost:3000';
// Feature flags
var FEATURES;
(function (FEATURES) {
    FEATURES["DARK_MODE"] = "dark_mode";
    FEATURES["ANALYTICS"] = "analytics";
    FEATURES["NOTIFICATIONS"] = "notifications";
    FEATURES["EXPERIMENTAL"] = "experimental";
})(FEATURES || (exports.FEATURES = FEATURES = {}));
//# sourceMappingURL=index.js.map