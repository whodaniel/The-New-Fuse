"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIError = void 0;
/**
 * Temporary stub for AIError until core package is built
 */
class AIError extends Error {
    constructor(message) {
        super(message);
        this.name = 'AIError';
    }
}
exports.AIError = AIError;
