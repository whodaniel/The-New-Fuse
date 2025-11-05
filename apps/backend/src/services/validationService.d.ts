interface ValidationConfig {
    enableDebugLogs: boolean;
    skipMissingProperties: boolean;
    whitelist: boolean;
    forbidNonWhitelisted: boolean;
}
interface ValidationResult {
    success: boolean;
    errors?: Record<string, string[]>;
}
export declare class ValidationService {
    private readonly logger;
    private readonly defaultConfig;
    validateRequest<T extends object>(data: unknown, dto: new () => T, config?: Partial<ValidationConfig>): Promise<ValidationResult>;
    validateSchema(data: unknown, schema: object): boolean;
    validateValue(data: unknown, rules: object): boolean;
    validateSync<T extends object>(data: unknown, dto: new () => T, config?: Partial<ValidationConfig>): Promise<ValidationResult>;
    private formatValidationErrors;
}
export {};
//# sourceMappingURL=validationService.d.ts.map