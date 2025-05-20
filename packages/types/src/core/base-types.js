"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomError = void 0;
/**
 * Core base types used throughout the application
 */
require("reflect-metadata");
/**
 * Base custom error class that can be extended
 */
class CustomError extends Error {
    constructor(message, context) {
        super(message);
        this.name = this.constructor.name; // Replaced 'as any'
        this.context = {
            timestamp: new Date().toISOString(),
            source: 'unknown',
            severity: 'medium',
            ...context
        };
    }
}
exports.CustomError = CustomError;
//# sourceMappingURL=base-types.js.map