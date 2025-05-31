var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
let LoggingMiddleware = (() => {
    let _classDecorators = [Injectable()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var LoggingMiddleware = _classThis = class {
        constructor(logger) {
            this.logger = logger;
        }
        use(req, res, next) {
            const requestId = uuidv4();
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
    __setFunctionName(_classThis, "LoggingMiddleware");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        LoggingMiddleware = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return LoggingMiddleware = _classThis;
})();
export { LoggingMiddleware };
