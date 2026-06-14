"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.backCompatMiddleware = backCompatMiddleware;
const common_1 = require("@nestjs/common");
const logger = new common_1.Logger('BackCompatMiddleware');
function backCompatMiddleware(req, _res, next) {
    const originalUrl = req.url;
    if (originalUrl.startsWith('/api/auth/')) {
        req.url = originalUrl.replace('/api/auth', '/api/v1/auth');
        logger.log(`Rewrote: ${originalUrl} -> ${req.url}`);
    }
    else if (originalUrl === '/api/auth') {
        req.url = '/api/v1/auth';
        logger.log(`Rewrote: ${originalUrl} -> ${req.url}`);
    }
    next();
}
//# sourceMappingURL=back-compat.middleware.js.map