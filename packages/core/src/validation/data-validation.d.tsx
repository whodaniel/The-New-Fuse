export interface ValidationStrategy<T> {
    validate(data: T): Promise<boolean>;
    getErrors(): string[];
}
export declare class ValidatorFactory {
    private static validators;
    static register<T>(key: string, validator: ValidationStrategy<T>): void;
}
export declare class DataValidation<T> {
    private readonly strategy;
    constructor(strategy: ValidationStrategy<T>);
    validate(): Promise<void>;
}
declare const _default: {
    ValidationStrategy: any;
    ValidatorFactory: typeof ValidatorFactory;
    DataValidation: typeof DataValidation;
};
export default _default;
