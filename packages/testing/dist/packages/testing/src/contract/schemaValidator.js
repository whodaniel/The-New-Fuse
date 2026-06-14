"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchemaValidator = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class SchemaValidator {
    /**
     * Validates a request/response object against its TypeScript interface
     * @param schema The class/interface to validate against
     * @param data The data to validate
     */
    static async validateSchema(schema, data) {
        try {
            // Convert plain object to class instance
            const instance = (0, class_transformer_1.plainToClass)(schema, data);
            // Validate the instance
            const errors = await (0, class_validator_1.validate)(instance);
            if (errors.length > 0) {
                return {
                    isValid: false,
                    errors: errors.map(error => Object.values(error.constraints || {}).join(', '))
                };
            }
            return { isValid: true, errors: [] };
        }
        catch (error) {
            return {
                isValid: false,
                errors: [error.message]
            };
        }
    }
    /**
     * Validates nested objects and arrays recursively
     * @param schema The schema to validate against
     * @param data The data to validate
     */
    static async validateNested(schema, data) {
        const errors = [];
        if (Array.isArray(data)) {
            for (const item of data) {
                const result = await this.validateSchema(schema, item);
                errors.push(...result.errors);
            }
        }
        else if (typeof data === 'object') {
            const result = await this.validateSchema(schema, data);
            errors.push(...result.errors);
        }
        return {
            isValid: errors.length === 0,
            errors
        };
    }
}
exports.SchemaValidator = SchemaValidator;
//# sourceMappingURL=schemaValidator.js.map