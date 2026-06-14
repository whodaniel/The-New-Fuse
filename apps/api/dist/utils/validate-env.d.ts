/**
 * Environment Variables Validation for API Service
 * Validates all required environment variables at startup
 * Provides clear error messages for missing or invalid configurations
 */
interface EnvValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
}
interface EnvVarConfig {
    name: string;
    required: boolean;
    defaultValue?: string;
    validator?: (value: string) => boolean;
    description: string;
}
declare const ENV_VARS: EnvVarConfig[];
/**
 * Validates all environment variables
 */
export declare function validateEnvironment(): EnvValidationResult;
/**
 * Validates environment and exits if validation fails
 */
export declare function validateEnvironmentOrExit(): void;
export { ENV_VARS, EnvVarConfig };
//# sourceMappingURL=validate-env.d.ts.map