"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var ValidationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationService = void 0;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
let ValidationService = ValidationService_1 = class ValidationService {
    logger = new common_1.Logger(ValidationService_1.name);
    defaultConfig = {
        enableDebugLogs: false,
        skipMissingProperties: false,
        whitelist: true,
        forbidNonWhitelisted: true
    };
    async validateRequest(data, dto, config = {}) {
        return this.validateSync(data, dto, config);
    }
    validateSchema(data, schema) {
        try {
            // Basic schema validation implementation
            return true;
        }
        catch (error) {
            this.logger.error('Schema validation failed', error);
            return false;
        }
    }
    validateValue(data, rules) {
        try {
            // Basic value validation implementation
            return true;
        }
        catch (error) {
            this.logger.error('Value validation failed', error);
            return false;
        }
    }
    async validateSync(data, dto, config = {}) {
        const finalConfig = { ...this.defaultConfig, ...config };
        const { enableDebugLogs, ...validatorConfig } = finalConfig;
        try {
            const instance = (0, class_transformer_1.plainToClass)(dto, data);
            const errors = await (0, class_validator_1.validate)(instance, validatorConfig);
            if (errors.length > 0) {
                const formattedErrors = this.formatValidationErrors(errors);
                if (enableDebugLogs) {
                    this.logger.debug('Validation errors', {
                        dto: dto.name,
                        errors: formattedErrors
                    });
                }
                return { success: false, errors: formattedErrors };
            }
            return { success: true };
        }
        catch (error) {
            this.logger.error('Validation process failed', error);
            return {
                success: false,
                errors: { _error: ['Internal validation error'] }
            };
        }
    }
    formatValidationErrors(errors) {
        const formattedErrors = {};
        for (const error of errors) {
            if (error.constraints) {
                formattedErrors[error.property] = Object.values(error.constraints);
            }
            if (error.children?.length) {
                const childErrors = this.formatValidationErrors(error.children);
                Object.entries(childErrors).forEach(([key, value]) => {
                    formattedErrors[`${error.property}.${key}`] = value;
                });
            }
        }
        return formattedErrors;
    }
};
exports.ValidationService = ValidationService;
exports.ValidationService = ValidationService = ValidationService_1 = __decorate([
    (0, common_1.Injectable)()
], ValidationService);
//# sourceMappingURL=validationService.js.map