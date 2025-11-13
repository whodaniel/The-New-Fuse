"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const securityHeadersMiddleware = (req, res, next) => {
    // Security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    next();
};
exports.default = securityHeadersMiddleware;
//# sourceMappingURL=security-headers.middleware.js.map