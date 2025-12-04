/**
 * Environment Variables Validation for Frontend Service
 * Validates all required environment variables at build time
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
 * Validates environment and throws if validation fails (for build-time checks)
 */
export declare function validateEnvironmentOrThrow(): void;
export { ENV_VARS, EnvVarConfig };
