"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.appConfig = void 0;
exports.appConfig = {
    name: "Browser MCP Server",
    version: "1.0.0",
    description: "Model Context Protocol server for browser automation",
    environment: process.env.NODE_ENV || "development",
    debug: process.env.DEBUG === "true",
    port: parseInt(process.env.PORT || "3000", 10),
    host: process.env.HOST || "localhost",
    cors: {
        enabled: true,
        origins: ["http://localhost:3000", "http://localhost:3001"],
    },
    logging: {
        level: process.env.LOG_LEVEL || "info",
        format: "json",
    },
};
//# sourceMappingURL=app.config.js.map