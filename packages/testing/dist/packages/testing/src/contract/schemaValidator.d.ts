import { Type } from '@nestjs/common';
export declare class SchemaValidator {
    /**
     * Validates a request/response object against its TypeScript interface
     * @param schema The class/interface to validate against
     * @param data The data to validate
     */
    static validateSchema<T extends object>(schema: Type<T>, data: any): Promise<{
        isValid: boolean;
        errors: string[];
    }>;
    /**
     * Validates nested objects and arrays recursively
     * @param schema The schema to validate against
     * @param data The data to validate
     */
    static validateNested<T extends object>(schema: Type<T>, data: any): Promise<{
        isValid: boolean;
        errors: string[];
    }>;
}
//# sourceMappingURL=schemaValidator.d.ts.map