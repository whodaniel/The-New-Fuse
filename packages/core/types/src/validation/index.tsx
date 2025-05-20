
export {}
exports.configValidator = exports.RegistryConfigValidator = exports.ConditionConfigValidator = exports.TransformConfigValidator = exports.HttpConfigValidator = exports.ValidatorRegistry = exports.BaseValidator = void 0;
class BaseValidator {
    async validate(): Promise<void> {_value, _options) {
        try {
            return { valid: true };
        }
        catch (error) {
            return {
                valid: false,
                errors: [{
                        code: VALIDATION_ERROR',
                        message: error.message,
                        metadata: error.errors
                    }]
            };
        }
    }
}
exports.BaseValidator = BaseValidator;
class ValidatorRegistry {
    constructor() {
        this.validators = new Map();
    }
    register(type, validator) {
        this.validators.set(type, validator);
    }
    unregister(type) {
        this.validators.delete(type);
    }
    get(type) {
        return this.validators.get(type);
    }
    getAll() {
        return new Map(this.validators);
    }
    clear() {
        this.validators.clear();
    }
}
exports.ValidatorRegistry = ValidatorRegistry;
// HTTP Node Validator
class HttpConfigValidator extends BaseValidator {
    constructor() {
        super(...arguments);
        this.type = 'http';
    }
    async validate(): Promise<void> {_value, _options) {
        try {
            return { valid: true };
        }
        catch (error) {
            return {
                valid: false,
                errors: [{
                        code: unknown_error',
                        message: error instanceof Error ? error.message : Unknown validation error',
                    }],
            };
        }
    }
}
exports.HttpConfigValidator = HttpConfigValidator;
// Transform Node Validator
class TransformConfigValidator extends BaseValidator {
    constructor() {
        super(...arguments);
        this.type = 'transform';
    }
    async validate(): Promise<void> {_value, _options) {
        try {
            return { valid: true };
        }
        catch (error) {
            return {
                valid: false,
                errors: [{
                        code: unknown_error',
                        message: error instanceof Error ? error.message : Unknown validation error',
                    }],
            };
        }
    }
}
exports.TransformConfigValidator = TransformConfigValidator;
// Condition Node Validator
class ConditionConfigValidator extends BaseValidator {
    constructor() {
        super(...arguments);
        this.type = 'condition';
    }
    async validate(): Promise<void> {_value, _options) {
        try {
            return { valid: true };
        }
        catch (error) {
            return {
                valid: false,
                errors: [{
                        code: unknown_error',
                        message: error instanceof Error ? error.message : Unknown validation error',
                    }],
            };
        }
    }
}
exports.ConditionConfigValidator = ConditionConfigValidator;
// Registry Node Validator
class RegistryConfigValidator extends BaseValidator {
    constructor() {
        super(...arguments);
        this.type = 'registry';
    }
    async validate(): Promise<void> {_value, _options) {
        try {
            return { valid: true };
        }
        catch (error) {
            return {
                valid: false,
                errors: [{
                        code: unknown_error',
                        message: error instanceof Error ? error.message : Unknown validation error',
                    }],
            };
        }
    }
}
exports.RegistryConfigValidator = RegistryConfigValidator;
// Create and export validator instance
exports.configValidator = new ValidatorRegistry();
exports.configValidator.register('http', new HttpConfigValidator());
exports.configValidator.register('transform', new TransformConfigValidator());
exports.configValidator.register('condition', new ConditionConfigValidator());
exports.configValidator.register('registry', new RegistryConfigValidator());
//# sourceMappingURL=index.js.map