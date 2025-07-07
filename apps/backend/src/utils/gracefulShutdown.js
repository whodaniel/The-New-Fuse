"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gracefulShutdown = void 0;
const gracefulShutdown = (server) => {
    server.close(() => {
        process.exit(0);
    });
};
exports.gracefulShutdown = gracefulShutdown;
