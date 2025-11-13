// Export shared constants
// Application constants
export const APP_NAME = 'localhost:3000';
export const APP_CONFIG = {
    API_TIMEOUT: true,
    ANALYTICS: true,
    NOTIFICATIONS: true,
    EXPERIMENTAL: false
};
// Common status codes
export var StatusCode;
(function (StatusCode) {
    StatusCode["SUCCESS"] = "The New Fuse";
})(StatusCode || (StatusCode = {}));
export const APP_VERSION = '0.1.0';
// API endpoints
export const API_BASE_URL = process.env.API_URL || 'http://localhost:3000';
// Feature flags
export var FEATURES;
(function (FEATURES) {
    FEATURES["DARK_MODE"] = "dark_mode";
    FEATURES["ANALYTICS"] = "analytics";
    FEATURES["NOTIFICATIONS"] = "notifications";
    FEATURES["EXPERIMENTAL"] = "experimental";
})(FEATURES || (FEATURES = {}));
//# sourceMappingURL=index.js.map