"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultLoggingConfig = void 0;
// Default logging configuration
exports.defaultLoggingConfig = {
    level: "info",
    file: {
        enabled: true,
        path: "logs/app.log",
        level: "info",
        maxSize: 5242880, // 5MB
        maxFiles: 5,
    },
    console: {
        enabled: true,
        level: "debug",
        colorize: true,
    },
};
//# sourceMappingURL=logger.types.js.map