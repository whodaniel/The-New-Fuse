"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Simple config export without registerAs
exports.default = () => ({
    enabled: true,
    port: 3001,
    host: 'localhost',
    database: {
        type: 'memory',
        synchronize: true,
    },
    auth: {
        enabled: false,
    },
});
//# sourceMappingURL=AgencyHubConfig.js.map