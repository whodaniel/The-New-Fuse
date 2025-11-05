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
exports.ValidationMiddleware = void 0;
const common_1 = require("@nestjs/common");
const validationService_1 = require("../services/validationService");
const loggingService_1 = require("../services/loggingService");
let ValidationMiddleware = class ValidationMiddleware {
    validationService;
    logger;
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
                        if (!result.success) {
                            throw new common_1.BadRequestException({
                                message: 'Validation failed',
                                errors: result.errors
                            });
                        }
                    }
                    if (options.schema) {
                        const isValid = this.validationService.validateSchema(req.body, options.schema);
                        if (!isValid) {
                            throw new common_1.BadRequestException('Request body does not match schema');
                        }
                    }
                    if (options.rules) {
                        validationPromises.push(Promise.resolve(this.validationService.validateValue(req.body, options.rules)));
                    }
                }
                // Validate query parameters
                if (options.validateQuery && req.query) {
                    if (options.schema) {
                        const isValid = this.validationService.validateSchema(req.query, options.schema);
                        if (!isValid) {
                            throw new common_1.BadRequestException('Query parameters do not match schema');
                        }
                    }
                    if (options.rules) {
                        validationPromises.push(Promise.resolve(this.validationService.validateValue(req.query, options.rules)));
                    }
                }
                // Validate route parameters
                if (options.validateParams && req.params) {
                    if (options.schema) {
                        const isValid = this.validationService.validateSchema(req.params, options.schema);
                        if (!isValid) {
                            throw new common_1.BadRequestException('Route parameters do not match schema');
                        }
                    }
                    if (options.rules) {
                        validationPromises.push(Promise.resolve(this.validationService.validateValue(req.params, options.rules)));
                    }
                }
                // Wait for all validation promises to resolve
                const results = await Promise.all(validationPromises);
                if (results.some(result => !result)) {
                    throw new common_1.BadRequestException('Validation rules failed');
                }
                next();
            }
            catch (error) {
                this.logger.error('Request validation failed', {
                    path: req.path,
                    method: req.method,
                    error: error
                });
                if (error instanceof common_1.BadRequestException) {
                    throw error;
                }
                throw new common_1.BadRequestException('Request validation failed');
            }
        };
    }
};
exports.ValidationMiddleware = ValidationMiddleware;
exports.ValidationMiddleware = ValidationMiddleware = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [validationService_1.ValidationService,
        loggingService_1.LoggingService])
], ValidationMiddleware);
//# sourceMappingURL=validationMiddleware.js.map