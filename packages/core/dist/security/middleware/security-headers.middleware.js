var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable } from '@nestjs/common';
import helmet from 'helmet';
let SecurityHeadersMiddleware = class SecurityHeadersMiddleware {
    constructor() {
        this.helmetMiddleware = helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    imgSrc: ["'self'", "data:", "https:"],
                    connectSrc: ["'self'"],
                    objectSrc: ["'none'"],
                    mediaSrc: ["'self'"],
                    frameSrc: ["'none'"],
                },
            },
            dnsPrefetchControl: { allow: false },
            frameguard: { action: 'deny' },
            hsts: { maxAge: 31536000, includeSubDomains: true },
            ieNoOpen: true,
            noSniff: true,
            xssFilter: true,
        });
    }
    use(req, res, next) {
        // Apply Helmet middleware
        this.helmetMiddleware(req, res, (err) => {
            if (err) {
                // Handle Helmet errors if necessary
                return next(err);
            }
            // Add any other custom security headers here
            res.setHeader('X-Powered-By', 'The New Fuse');
            next();
        });
    }
};
SecurityHeadersMiddleware = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [])
], SecurityHeadersMiddleware);
export { SecurityHeadersMiddleware };
//# sourceMappingURL=security-headers.middleware.js.map