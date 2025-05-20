// Data Validation Implementation
export interface ValidationStrategy<T> {
    validate(data: T): Promise<boolean>;
    getErrors(): string[];
}

export class ValidatorFactory {
    private static validators = new Map<string, ValidationStrategy<any>>();

    static register<T>(key: string, validator: ValidationStrategy<T>): void {
        this.validators.set(key, validator);
    }

    static getValidator<T>(key: string): ValidationStrategy<T> {
        const validator = this.validators.get(key);
        if (!validator) {
            throw new Error(`No validator registered for key: ${key}`);
        }
        return validator as ValidationStrategy<T>;
    }
}

export class DataValidation<T> {
    constructor(private readonly strategy: ValidationStrategy<T>) {}

    async validate(data: T): Promise<boolean> {
        return this.strategy.validate(data);
    }

    getErrors(): string[] {
        return this.strategy.getErrors();
    }
}

// Export all components
export default {
    ValidationStrategy,
    ValidatorFactory,
    DataValidation
};
