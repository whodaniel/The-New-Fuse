/**
 * Environment Variables Validation for Backend Service
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
    defaultValue: '5000',
    validator: (val) => !isNaN(parseInt(val)) && parseInt(val) > 0 && parseInt(val) < 65536,
    description: 'Server port number',
  },

  // JWT Configuration
  {
    name: 'JWT_SECRET',
    required: true,
    validator: (val) => val.length >= 32,
    description: 'JWT secret key (minimum 32 characters)',
  },

  // Database Configuration
  {
    name: 'DATABASE_URL',
    required: true,
    validator: (val) => val.startsWith('postgresql://') || val.startsWith('postgres://'),
    description: 'PostgreSQL database connection URL',
  },

  // Redis Configuration
  {
    name: 'REDIS_HOST',
    required: false,
    defaultValue: 'localhost',
    description: 'Redis server host',
  },
  {
    name: 'REDIS_PORT',
    required: false,
    defaultValue: '6379',
    validator: (val) => !isNaN(parseInt(val)) && parseInt(val) > 0,
    description: 'Redis server port',
  },
  {
    name: 'REDIS_URL',
    required: false,
    validator: (val) => val.startsWith('redis://') || val.startsWith('rediss://'),
    description: 'Redis connection URL (alternative to REDIS_HOST/PORT)',
  },

  // Google OAuth
  {
    name: 'GOOGLE_CLIENT_ID',
    required: false,
    description: 'Google OAuth client ID',
  },
  {
    name: 'GOOGLE_CLIENT_SECRET',
    required: false,
    description: 'Google OAuth client secret',
  },
  {
    name: 'GOOGLE_CALLBACK_URL',
    required: false,
    description: 'Google OAuth callback URL',
  },

  // Frontend URL
  {
    name: 'FRONTEND_URL',
    required: true,
    validator: (val) => val.startsWith('http://') || val.startsWith('https://'),
    description: 'Frontend application URL for CORS',
  },

  // Email Configuration (Optional)
  {
    name: 'SMTP_HOST',
    required: false,
    description: 'SMTP server host for email sending',
  },
  {
    name: 'SMTP_PORT',
    required: false,
    validator: (val) => !isNaN(parseInt(val)),
    description: 'SMTP server port',
  },
  {
    name: 'SMTP_USER',
    required: false,
    description: 'SMTP username',
  },
  {
    name: 'SMTP_PASS',
    required: false,
    description: 'SMTP password',
  },

  // AWS Configuration (Optional)
  {
    name: 'AWS_ACCESS_KEY_ID',
    required: false,
    description: 'AWS access key ID for S3 storage',
  },
  {
    name: 'AWS_SECRET_ACCESS_KEY',
    required: false,
    description: 'AWS secret access key',
  },
  {
    name: 'AWS_REGION',
    required: false,
    defaultValue: 'us-east-1',
    description: 'AWS region',
  },
  {
    name: 'S3_BUCKET_NAME',
    required: false,
    description: 'S3 bucket name for file uploads',
  },

  // Blockchain Configuration (Optional)
  {
    name: 'RPC_URL',
    required: false,
    description: 'Blockchain RPC URL',
  },
  {
    name: 'PRIVATE_KEY',
    required: false,
    description: 'Blockchain private key',
  },
  {
    name: 'AGENT_NFT_CONTRACT_ADDRESS',
    required: false,
    description: 'Agent NFT smart contract address',
  },
  {
    name: 'MARKETPLACE_CONTRACT_ADDRESS',
    required: false,
    description: 'Marketplace smart contract address',
  },
  {
    name: 'REVENUE_DISTRIBUTOR_CONTRACT_ADDRESS',
    required: false,
    description: 'Revenue distributor smart contract address',
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

  console.log('🔍 Validating environment variables for Backend Service...\n');

  for (const config of ENV_VARS) {
    const result = validateEnvVar(config);

    if (!result.valid && result.error) {
      errors.push(result.error);
    }

    if (result.warning) {
      warnings.push(result.warning);
    }
  }

  // Additional validation: Check for conflicting configurations
  if (process.env.REDIS_URL && (process.env.REDIS_HOST || process.env.REDIS_PORT)) {
    warnings.push(
      '⚠️  Both REDIS_URL and REDIS_HOST/PORT are set. REDIS_URL will take precedence.'
    );
  }

  // Check for OAuth configuration completeness
  const hasAnyOAuth = process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_SECRET;
  const hasCompleteOAuth = process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_CALLBACK_URL;

  if (hasAnyOAuth && !hasCompleteOAuth) {
    warnings.push(
      '⚠️  Incomplete Google OAuth configuration. All of GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_CALLBACK_URL are required for OAuth to work.'
    );
  }

  // Production-specific warnings
  if (process.env.NODE_ENV === 'production') {
    if (process.env.JWT_SECRET === 'your-secret-key') {
      errors.push(
        '❌ Using default JWT_SECRET in production is a security risk! Please set a strong secret.'
      );
    }

    if (!process.env.FRONTEND_URL?.startsWith('https://')) {
      warnings.push(
        '⚠️  FRONTEND_URL should use HTTPS in production for security.'
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
