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
exports.RequestValidationService = void 0;
const common_1 = require("@nestjs/common");
const LoggingService_1 = require("../services/LoggingService");
const ConfigService_1 = require("../config/ConfigService");
let RequestValidationService = class RequestValidationService {
    logger;
    configService;
    validationRules = new Map();
    constructor(logger, configService) {
        this.logger = logger;
        this.configService = configService;
        this.initializeDefaultRules();
    }
    initializeDefaultRules() {
        // Common validation rules for API endpoints
        this.addSchema('user', {
            email: { type: 'email', required: true },
            name: { type: 'string', required: true, minLength: 2, maxLength: 100 },
            age: { type: 'number', required: false, min: 0, max: 150 },
        });
        this.addSchema('agent', {
            id: { type: 'uuid', required: true },
            name: { type: 'string', required: true, minLength: 1, maxLength: 200 },
            type: { type: 'string', required: true },
            config: { type: 'object', required: false },
        });
        this.addSchema('workflow', {
            name: { type: 'string', required: true, minLength: 1, maxLength: 200 },
            description: { type: 'string', required: false, maxLength: 1000 },
            steps: { type: 'array', required: true, minLength: 1 },
        });
        this.logger.log(`Initialized ${this.validationRules.size} validation schemas, 'RequestValidationService');
  }

  addSchema(name: string, schema: ValidationSchema): void {
    this.validationRules.set(name, schema);`, this.logger.log(`Added validation schema: ${name}`, 'RequestValidationService'));
    }
    removeSchema(name) {
        this.validationRules.delete(name);
        this.logger.debug(Removed, validation, schema, $, { name }, 'RequestValidationService');
    }
    getSchema(name) {
        return this.validationRules.get(name);
    }
    validate(data, schema) {
        try {
            const validationSchema = typeof schema === 'string'
                ? this.validationRules.get(schema)
                : schema;
            if (!validationSchema) {
                `
        throw new Error(Validation schema not found: ${schema}`;
                ;
            }
            const errors = [];
            const sanitizedData = {};
            // Validate each field in the schema
            for (const [fieldName, rules] of Object.entries(validationSchema)) {
                const fieldRules = Array.isArray(rules) ? rules : [rules];
                const fieldValue = this.getNestedValue(data, fieldName);
                for (const rule of fieldRules) {
                    const fieldErrors = this.validateField(fieldName, fieldValue, rule);
                    errors.push(...fieldErrors);
                }
                // Sanitize and add to result if no errors for this field
                if (!errors.some(e => e.field === fieldName)) {
                    sanitizedData[fieldName] = this.sanitizeValue(fieldValue, {});
                }
            }
            const isValid = errors.length === 0;
            this.logger.debug(Validation, $, { isValid, 'passed': 'failed' });
            for ($; { Object, : .keys(validationSchema).length }; fields `, 'RequestValidationService');

      return {
        isValid,
        errors,
        sanitizedData: isValid ? sanitizedData : undefined,
      };
    } catch (error) {
      this.logger.error('Validation failed', error instanceof Error ? error : new Error(String(error)), 'RequestValidationService');
      return {
        isValid: false,
        errors: [{
          field: 'general',
          message: error instanceof Error ? error.message : 'Validation error occurred',
        }],
      };
    }
  }

  private validateField(fieldName: string, value: any, rule: ValidationRule): ValidationError[] {
    const errors: ValidationError[] = [];

    // Check required fields
    if (rule.required && (value === undefined || value === null || value === '')) {
      errors.push({
        field: fieldName,
        message: rule.message || ${fieldName} is required,
        rule: 'required',
      });
      return errors; // Don't continue validation if required field is missing
    }

    // Skip validation if field is not required and value is empty
    if (!rule.required && (value === undefined || value === null || value === '')) {
      return errors;
    }

    // Type validation
    const typeError = this.validateType(fieldName, value, rule.type);
    if (typeError) {
      errors.push(typeError);
      return errors; // Don't continue validation if type is wrong
    }

    // String validations
    if (rule.type === 'string' && typeof value === 'string') {
      if (rule.minLength && value.length < rule.minLength) {
        errors.push({`)
                field: fieldName, `
          message: rule.message || `;
            $;
            {
                fieldName;
            }
            must;
            be;
            at;
            least;
            $;
            {
                rule.minLength;
            }
            characters,
                rule;
            'minLength',
            ;
        }
        finally { }
        ;
    }
    if(rule, maxLength) { }
};
exports.RequestValidationService = RequestValidationService;
exports.RequestValidationService = RequestValidationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [LoggingService_1.LoggingService,
        ConfigService_1.ConfigService])
], RequestValidationService);
 && value.length > rule.maxLength;
{
    errors.push({} `
          field: fieldName,`, message, rule.message || `${fieldName} must be at most ${rule.maxLength} characters,
          rule: 'maxLength',
        });
      }

      if (rule.pattern && !rule.pattern.test(value)) {
        errors.push({`, field, fieldName, `
          message: rule.message || ${fieldName}`, format, is, invalid, rule, 'pattern');
}
;
// Number validations
if (rule.type === 'number' && typeof value === 'number') {
    if (rule.min !== undefined && value < rule.min) {
        errors.push({
            field: fieldName,
            message: rule.message || $
        }, { fieldName }, must, be, at, least, $, { rule, : .min }, rule, 'min');
    }
    ;
}
if (rule.max !== undefined && value > rule.max) {
    `
        errors.push({`;
    field: fieldName, `
          message: rule.message || ${fieldName} must be at most ${rule.max},
          rule: 'max',
        });
      }
    }

    // Custom validation
    if (rule.custom && !rule.custom(value)) {
      errors.push({`;
    field: fieldName, `
        message: rule.message || ${fieldName}`;
    failed;
    custom;
    validation,
        rule;
    'custom',
    ;
}
;
return errors;
validateType(fieldName, string, value, any, expectedType, string);
ValidationError | null;
{
    let actualType = typeof value;
    // Handle special cases
    if (value === null)
        actualType = 'null';
    if (Array.isArray(value))
        actualType = 'array';
    switch (expectedType) {
        case 'email':
            if (actualType !== 'string' || !this.isValidEmail(value)) {
                return {
                    field: fieldName,
                    message: $
                };
                {
                    fieldName;
                }
                must;
                be;
                a;
                valid;
                email;
                address,
                    rule;
                'email',
                ;
            }
            ;
    }
    break;
    'url';
    if (actualType !== 'string' || !this.isValidUrl(value)) {
        return {} `
            field: fieldName,`;
        message: `${fieldName} must be a valid URL,
            rule: 'url',
          };
        }
        break;

      case 'uuid':
        if (actualType !== 'string' || !this.isValidUUID(value)) {
          return {`;
        field: fieldName, `
            message: ${fieldName}`;
        must;
        be;
        a;
        valid;
        UUID,
            rule;
        'uuid',
        ;
    }
    ;
}
break;
if (actualType !== expectedType) {
    return {
        field: fieldName,
        message: $
    };
    {
        fieldName;
    }
    must;
    be;
    of;
    got;
    $;
    {
        actualType;
    }
    rule: 'type',
    ;
}
;
return null;
isValidEmail(email, string);
boolean;
{
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
isValidUrl(url, string);
boolean;
{
    try {
        new URL(url);
        return true;
    }
    catch {
        return false;
    }
}
isValidUUID(uuid, string);
boolean;
{
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
}
getNestedValue(obj, any, path, string);
any;
{
    return path.split('.').reduce((current, key) => current?.[key], obj);
}
sanitizeValue(value, any, options, SanitizationOptions);
any;
{
    if (value === null || value === undefined) {
        return value;
    }
    if (typeof value === 'string') {
        let sanitized = value;
        if (options.trim)
            sanitized = sanitized.trim();
        if (options.lowerCase)
            sanitized = sanitized.toLowerCase();
        if (options.upperCase)
            sanitized = sanitized.toUpperCase();
        if (options.escape)
            sanitized = this.escapeHtml(sanitized);
        if (options.stripTags)
            sanitized = this.stripHtmlTags(sanitized);
        return sanitized;
    }
    if (typeof value === 'object') {
        if (Array.isArray(value)) {
            return value.map(item => this.sanitizeValue(item, options));
        }
        const sanitized = {};
        for (const [key, val] of Object.entries(value)) {
            sanitized[key] = this.sanitizeValue(val, options);
        }
        return sanitized;
    }
    return value;
}
escapeHtml(text, string);
string;
{
    const htmlEscapes = {
        '&': '&',
        '<': '<',
        '>': '>',
        '"': '"',
        "'": '&#x27;',
        '/': '&#x2F;',
    };
    return text.replace(/[&<>"'/]/g, (match) => htmlEscapes[match]);
}
stripHtmlTags(text, string);
string;
{
    return text.replace(/<[^>]*>/g, '');
}
// Utility methods for common validations
validateEmail(email, string);
ValidationResult;
{
    return this.validate({ email }, {
        email: { type: 'email', required: true },
    });
}
validateUUID(uuid, string);
ValidationResult;
{
    return this.validate({ uuid }, {
        uuid: { type: 'uuid', required: true },
    });
}
validateUrl(url, string);
ValidationResult;
{
    return this.validate({ url }, {
        url: { type: 'url', required: true },
    });
}
// Health check method
healthCheck();
{
    status: 'ok' | 'error';
    details ?  : string;
}
{
    try {
        `
      const schemaCount = this.validationRules.size;`;
        return {} `
        status: 'ok',
        details: Active validation schemas: ${schemaCount}`,
        ;
    }
    finally { }
    ;
}
try { }
catch (error) {
    return {
        status: 'error',
        details: error instanceof Error ? error.message : 'Unknown error',
    };
}
// Get validation statistics
getStats();
{
    totalSchemas: number;
    schemaNames: string[];
    timestamp: Date;
}
{
    return {
        totalSchemas: this.validationRules.size,
        schemaNames: Array.from(this.validationRules.keys()),
        timestamp: new Date(),
    };
}
exports.default = RequestValidationService;
//# sourceMappingURL=request-validation.service.js.map