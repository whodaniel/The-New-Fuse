/**
 * Environment Variables Validation for API Gateway Service
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

const ENV_VARS: EnvVarConfig[] = [
  // Server Configuration
  {
    name: 'NODE_ENV',
    required: false,
    defaultValue: 'development',
    validator: (val) => ['development', 'production', 'test'].includes(val),
    description: 'Application environment (development, production, test)',
  },
  {
    name: 'PORT',
    required: false,
    defaultValue: '8080',
    validator: (val) => !isNaN(parseInt(val)) && parseInt(val) > 0 && parseInt(val) < 65536,
    description: 'API Gateway port number',
  },

  // Backend Service URLs
  {
    name: 'BACKEND_SERVICE_URL',
    required: false,
    defaultValue: 'http://api-server:8080',
    validator: (val) => val.startsWith('http://') || val.startsWith('https://'),
    description: 'Backend service URL',
  },
  {
    name: 'WEBHOOKS_SERVICE_URL',
    required: false,
    defaultValue: 'http://api-server:8080',
    validator: (val) => val.startsWith('http://') || val.startsWith('https://'),
    description: 'Webhooks service URL',
  },
  {
    name: 'AGENTS_SERVICE_URL',
    required: false,
    defaultValue: 'http://api-server:8080',
    validator: (val) => val.startsWith('http://') || val.startsWith('https://'),
    description: 'Agents service URL',
  },
  {
    name: 'THEIA_IDE_URL',
    required: false,
    defaultValue: 'http://localhost:3007',
    validator: (val) => val.startsWith('http://') || val.startsWith('https://'),
    description: 'Theia IDE service URL',
  },

  // CORS Configuration
  {
    name: 'CORS_ORIGINS',
    required: false,
    defaultValue: 'http://localhost:3000,http://localhost:5173',
    description: 'Comma-separated list of allowed CORS origins',
  },

  // Logging
  {
    name: 'LOG_LEVEL',
    required: false,
    defaultValue: 'debug',
    validator: (val) => ['error', 'warn', 'log', 'debug', 'verbose'].includes(val),
    description: 'Logging level',
  },

  // Health Check
  {
    name: 'HEALTH_CHECK_INTERVAL',
    required: false,
    defaultValue: '30000',
    validator: (val) => !isNaN(parseInt(val)) && parseInt(val) > 0,
    description: 'Health check interval in milliseconds',
  },
];

/**
 * Validates a single environment variable
 */
function validateEnvVar(config: EnvVarConfig): { valid: boolean; error?: string; warning?: string } {
  const value = process.env[config.name];

  // Check if required variable is missing
  if (config.required && !value) {
    return {
      valid: false,
      error: `❌ Missing required environment variable: ${config.name}\n   Description: ${config.description}`,
    };
  }

  // Use default value if not set
  if (!value && config.defaultValue) {
    process.env[config.name] = config.defaultValue;
    return {
      valid: true,
      warning: `⚠️  Using default value for ${config.name}: ${config.defaultValue}`,
    };
  }

  // Validate value if validator is provided
  if (value && config.validator && !config.validator(value)) {
    return {
      valid: false,
      error: `❌ Invalid value for ${config.name}\n   Description: ${config.description}\n   Current value: ${value.substring(0, 50)}...`,
    };
  }

  return { valid: true };
}

/**
 * Validates all environment variables
 */
export function validateEnvironment(): EnvValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  console.log('🔍 Validating environment variables for API Gateway Service...\n');

  for (const config of ENV_VARS) {
    const result = validateEnvVar(config);

    if (!result.valid && result.error) {
      errors.push(result.error);
    }

    if (result.warning) {
      warnings.push(result.warning);
    }
  }

  // Production-specific warnings
  if (process.env.NODE_ENV === 'production') {
    // Check that backend services use HTTPS in production
    const serviceUrls = [
      'BACKEND_SERVICE_URL',
      'WEBHOOKS_SERVICE_URL',
      'AGENTS_SERVICE_URL',
      'THEIA_IDE_URL',
    ];

    for (const urlVar of serviceUrls) {
      const url = process.env[urlVar];
      if (url && !url.startsWith('https://')) {
        warnings.push(
          `⚠️  ${urlVar} should use HTTPS in production (current: ${url})`
        );
      }
    }

    // Check CORS origins
    if (process.env.CORS_ORIGINS?.includes('localhost')) {
      warnings.push(
        '⚠️  CORS_ORIGINS contains localhost URLs in production. Please update to production URLs.'
      );
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validates environment and exits if validation fails
 */
export function validateEnvironmentOrExit(): void {
  const result = validateEnvironment();

  // Print warnings
  if (result.warnings.length > 0) {
    console.log('⚠️  Warnings:\n');
    result.warnings.forEach(warning => console.log(warning));
    console.log('');
  }

  // Print errors and exit if validation failed
  if (!result.isValid) {
    console.error('❌ Environment validation failed!\n');
    result.errors.forEach(error => console.error(error));
    console.error('\n💡 Tip: Copy .env.example to .env and fill in the required values.\n');
    process.exit(1);
  }

  console.log('✅ Environment validation passed!\n');
}

// Export for testing
export { ENV_VARS, EnvVarConfig };
