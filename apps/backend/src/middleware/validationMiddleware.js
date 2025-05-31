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
import { Injectable, BadRequestException } from '@nestjs/common';
let ValidationMiddleware = (() => {
    let _classDecorators = [Injectable()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var ValidationMiddleware = _classThis = class {
        constructor(validationService, logger) {
            this.validationService = validationService;
            this.logger = logger;
        }
        use(options) {
            return async (req, res, next) => {
                try {
                    const validationPromises = [];
                    // Validate request body
                    if (options.validateBody && req.body) {
                        if (options.dto) {
                            const result = await this.validationService.validateRequest(req.body, options.dto);
                            if (!result.isValid) {
                                throw new BadRequestException({
                                    message: 'Validation failed',
                                    errors: result.errors
                                });
                            }
                        }
                        if (options.schema) {
                            const isValid = this.validationService.validateSchema(req.body, options.schema);
                            if (!isValid) {
                                throw new BadRequestException('Request body does not match schema');
                            }
                        }
                        if (options.rules) {
                            validationPromises.push(this.validationService.validateValue(req.body, options.rules));
                        }
                    }
                    // Validate query parameters
                    if (options.validateQuery && req.query) {
                        if (options.schema) {
                            const isValid = this.validationService.validateSchema(req.query, options.schema);
                            if (!isValid) {
                                throw new BadRequestException('Query parameters do not match schema');
                            }
                        }
                        if (options.rules) {
                            validationPromises.push(this.validationService.validateValue(req.query, options.rules));
                        }
                    }
                    // Validate route parameters
                    if (options.validateParams && req.params) {
                        if (options.schema) {
                            const isValid = this.validationService.validateSchema(req.params, options.schema);
                            if (!isValid) {
                                throw new BadRequestException('Route parameters do not match schema');
                            }
                        }
                        if (options.rules) {
                            validationPromises.push(this.validationService.validateValue(req.params, options.rules));
                        }
                    }
                    // Wait for all validation promises to resolve
                    const results = await Promise.all(validationPromises);
                    if (results.some(result => !result)) {
                        throw new BadRequestException('Validation rules failed');
                    }
                    next();
                }
                catch (error) {
                    this.logger.error('Request validation failed', {
                        path: req.path,
                        method: req.method,
                        error
                    });
                    if (error instanceof BadRequestException) {
                        throw error;
                    }
                    throw new BadRequestException('Request validation failed');
                }
            };
        }
    };
    __setFunctionName(_classThis, "ValidationMiddleware");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        ValidationMiddleware = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return ValidationMiddleware = _classThis;
})();
export { ValidationMiddleware };
