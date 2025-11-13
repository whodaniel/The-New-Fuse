"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityMiddleware = void 0;
const common_1 = require("@nestjs/common");
const SecurityService_1 = require("../SecurityService");
let SecurityMiddleware = class SecurityMiddleware {
    securityService;
    config;
    // private logger: Logger;
    constructor(securityService, config) {
        this.securityService = securityService;
        this.config = config;
        // this.logger = new Logger('SecurityMiddleware');
    }
    async use(req, res, next) {
        try {
            // Check for authentication token
            const token = this.extractToken(req);
            if (!token) {
                return res.status(401).json({
                    status: 'error',
                    message: 'Authentication required'
                });
            }
            // Verify token and validate request
            try {
                const isValid = await this.securityService.validateRequest({
                    req,
                    resource: req.path,
                    action: 'access'
                });
                if (!isValid) {
                    return res.status(429).json({ error: 'Too many requests' });
                }
            }
            catch {
                return res.status(401).json({
                    status: 'error',
                    message: 'Invalid token'
                });
            }
            // Extract resource and action
            const resource = this.getResourceFromRequest(req);
            // Check resource access
            try {
                const hasAccess = await this.securityService.validateRequest({
                    req,
                    resource,
                    action: 'access'
                });
                if (!hasAccess) {
                    return res.status(403).json({
                        status: 'error',
                        message: 'Access denied'
                    });
                }
            }
            catch {
                return res.status(403).json({
                    status: 'error',
                    message: 'Access denied'
                });
            }
            next();
        }
        catch {
            // this.logger.error('Security middleware error:', error);
            return res.status(500).json({
                status: 'error',
                message: 'Internal server error'
            });
        }
    }
    extractToken(req) {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            return authHeader.substring(7);
        }
        return null;
    }
    getResourceFromRequest(req) {
        const parts = req.path.split('/').filter(Boolean);
        return parts[0] || 'unknown';
    }
    getActionFromRequest(req) {
        const methodToAction = {
            GET: 'read',
            POST: 'create',
            PUT: 'update',
            PATCH: 'update',
            DELETE: 'delete'
        };
        return methodToAction[req.method] || 'unknown';
    }
};
exports.SecurityMiddleware = SecurityMiddleware;
exports.SecurityMiddleware = SecurityMiddleware = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [SecurityService_1.SecurityService, Object])
], SecurityMiddleware);
//# sourceMappingURL=SecurityMiddleware.js.map