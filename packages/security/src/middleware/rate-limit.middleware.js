"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rateLimitMiddleware = (req, res, next) => {
    // Rate limiting implementation would go here
    // For now just pass through
    next();
};
exports.default = rateLimitMiddleware;
//# sourceMappingURL=rate-limit.middleware.js.map