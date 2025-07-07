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
exports.LoggingMiddleware = void 0;
const common_1 = require("@nestjs/common");
const uuid_1 = require("uuid");
const loggingService_1 = require("../services/loggingService");
let LoggingMiddleware = class LoggingMiddleware {
    logger;
    constructor(logger) {
        this.logger = logger;
    }
    use(req, res, next) {
        const requestId = (0, uuid_1.v4)();
        const startTime = Date.now();
        // Add request ID to response headers
        res.setHeader('X-Request-ID', requestId);
        // Log request
        this.logger.logRequest({
            requestId,
            method: req.method,
            path: req.path,
            query: req.query,
            headers: this.sanitizeHeaders(req.headers),
            ip: req.ip,
            userId: req.user?.id
        });
        // Capture response data
        const originalEnd = res.end;
        const originalWrite = res.write;
        const chunks = [];
        res.write = function (chunk) {
            if (chunk) {
                chunks.push(Buffer.from(chunk));
            }
            return originalWrite.apply(res, arguments);
        };
        res.end = function (chunk) {
            if (chunk) {
                chunks.push(Buffer.from(chunk));
            }
            const responseBody = Buffer.concat(chunks).toString('utf8');
            const duration = Date.now() - startTime;
            // Log response
            this.logger.logRequest({
                requestId,
                method: req.method,
                path: req.path,
                statusCode: res.statusCode,
                duration,
                responseSize: Buffer.byteLength(responseBody, 'utf8'),
                userId: req.user?.id
            });
            // Log performance if duration exceeds threshold
            if (duration > 1000) {
                this.logger.logPerformance('http_request', duration, {
                    requestId,
                    method: req.method,
                    path: req.path
                });
            }
            originalEnd.apply(res, arguments);
        }.bind(this);
        next();
    }
    sanitizeHeaders(headers) {
        const sanitized = { ...headers };
        const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];
        sensitiveHeaders.forEach(header => {
            if (sanitized[header]) {
                sanitized[header] = '[REDACTED]';
            }
        });
        return sanitized;
    }
};
exports.LoggingMiddleware = LoggingMiddleware;
exports.LoggingMiddleware = LoggingMiddleware = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [loggingService_1.LoggingService])
], LoggingMiddleware);
