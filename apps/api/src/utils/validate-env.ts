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
    name: 'API_PORT',
    required: false,
    defaultValue: '3001',
    validator: (val) => !isNaN(parseInt(val)) && parseInt(val) > 0 && parseInt(val) < 65536,
    description: 'API server port number',
  },

  // Database Configuration
  {
    name: 'DATABASE_URL',
    required: true,
    validator: (val) => val.startsWith('postgresql://') || val.startsWith('postgres://'),
    description: 'PostgreSQL database connection URL',
  },
  {
    name: 'DATABASE_TYPE',
    required: false,
    defaultValue: 'postgres',
    description: 'Database type (postgres, mysql, sqlite)',
  },
  {
    name: 'MONGODB_URL',
    required: false,
    validator: (val) => val.startsWith('mongodb://') || val.startsWith('mongodb+srv://'),
    description: 'MongoDB connection URL (optional)',
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

  // JWT Configuration
  {
    name: 'JWT_SECRET',
    required: true,
    validator: (val) => val.length >= 32,
    description: 'JWT secret key (minimum 32 characters)',
  },
  {
    name: 'JWT_REFRESH_SECRET',
    required: true,
    validator: (val) => val.length >= 32,
    description: 'JWT refresh token secret (minimum 32 characters)',
  },
  {
    name: 'JWT_EXPIRATION',
    required: false,
    defaultValue: '1h',
    description: 'JWT token expiration time',
  },
  {
    name: 'JWT_REFRESH_EXPIRATION',
    required: false,
    defaultValue: '7d',
    description: 'JWT refresh token expiration time',
  },
  {
    name: 'JWT_ISSUER',
    required: false,
    defaultValue: 'the-new-fuse-api',
    description: 'JWT issuer identifier',
  },
  {
    name: 'JWT_AUDIENCE',
    required: false,
    defaultValue: 'the-new-fuse-clients',
    description: 'JWT audience identifier',
  },

  // CORS Configuration
  {
    name: 'ALLOWED_ORIGINS',
    required: false,
    description: 'Comma-separated list of allowed CORS origins',
  },
  {
    name: 'FRONTEND_URL',
    required: false,
    validator: (val) => val.startsWith('http://') || val.startsWith('https://'),
    description: 'Frontend application URL',
  },

  // External Services
  {
    name: 'OPENAI_API_KEY',
    required: false,
    validator: (val) => val.startsWith('sk-'),
    description: 'OpenAI API key',
  },
  {
    name: 'ANTHROPIC_API_KEY',
    required: false,
    description: 'Anthropic API key',
  },

  // Web3Auth Configuration
  {
    name: 'WEB3AUTH_CLIENT_ID',
    required: false,
    description: 'Web3Auth client ID',
  },
  {
    name: 'WEB3AUTH_JWT_SECRET',
    required: false,
    description: 'Web3Auth JWT secret',
  },
  {
    name: 'WEB3AUTH_VERIFIER_DOMAIN',
    required: false,
    description: 'Web3Auth verifier domain',
  },
  {
    name: 'ETHEREUM_RPC_URL',
    required: false,
    validator: (val) => val.startsWith('http://') || val.startsWith('https://') || val.startsWith('wss://'),
    description: 'Ethereum RPC URL',
  },

  // Blockchain & Smart Contracts
  {
    name: 'BUNDLER_URL',
    required: false,
    description: 'Account abstraction bundler URL',
  },
  {
    name: 'ENTRY_POINT_ADDRESS',
    required: false,
    validator: (val) => /^0x[a-fA-F0-9]{40}$/.test(val),
    description: 'ERC-4337 entry point contract address',
  },
  {
    name: 'TNF_PAYMASTER_ADDRESS',
    required: false,
    validator: (val) => /^0x[a-fA-F0-9]{40}$/.test(val),
    description: 'The New Fuse paymaster contract address',
  },
  {
    name: 'SMART_ACCOUNT_FACTORY_ADDRESS',
    required: false,
    validator: (val) => /^0x[a-fA-F0-9]{40}$/.test(val),
    description: 'Smart account factory contract address',
  },

  // MCP Configuration
  {
    name: 'MCP_REGISTRY_PORT',
    required: false,
    defaultValue: '3002',
    validator: (val) => !isNaN(parseInt(val)),
    description: 'MCP Registry WebSocket server port',
  },
  {
    name: 'MCP_REGISTRY_API_KEY',
    required: false,
    description: 'MCP Registry API authentication key',
  },

  // Rate Limiting
  {
    name: 'RATE_LIMIT_DEFAULT',
    required: false,
    defaultValue: '100',
    validator: (val) => !isNaN(parseInt(val)) && parseInt(val) > 0,
    description: 'Default rate limit (requests per window)',
  },
  {
    name: 'RATE_LIMIT_WINDOW',
    required: false,
    defaultValue: '60000',
    validator: (val) => !isNaN(parseInt(val)) && parseInt(val) > 0,
    description: 'Rate limit window in milliseconds',
  },

  // Monitoring
  {
    name: 'LOG_LEVEL',
    required: false,
    defaultValue: 'info',
    validator: (val) => ['error', 'warn', 'info', 'debug'].includes(val),
    description: 'Logging level',
  },
  {
    name: 'SENTRY_DSN',
    required: false,
    description: 'Sentry error tracking DSN',
  },
  {
    name: 'NEW_RELIC_LICENSE_KEY',
    required: false,
    description: 'New Relic monitoring license key',
  },

  // Feature Flags
  {
    name: 'ENABLE_WEBSOCKET',
    required: false,
    defaultValue: 'true',
    validator: (val) => ['true', 'false'].includes(val.toLowerCase()),
    description: 'Enable WebSocket support',
  },
  {
    name: 'ENABLE_MONITORING',
    required: false,
    defaultValue: 'true',
    validator: (val) => ['true', 'false'].includes(val.toLowerCase()),
    description: 'Enable monitoring features',
  },

  // Email Configuration
  {
    name: 'SMTP_HOST',
    required: false,
    description: 'SMTP server host',
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

  console.log('🔍 Validating environment variables for API Service...\n');

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

  // Production-specific warnings
  if (process.env.NODE_ENV === 'production') {
    if (process.env.JWT_SECRET === 'your-secret-key' || process.env.JWT_SECRET?.length < 32) {
      errors.push(
        '❌ JWT_SECRET must be at least 32 characters in production!'
      );
    }

    if (process.env.JWT_REFRESH_SECRET === 'your-jwt-refresh-secret-key' || process.env.JWT_REFRESH_SECRET?.length < 32) {
      errors.push(
        '❌ JWT_REFRESH_SECRET must be at least 32 characters in production!'
      );
    }

    if (!process.env.DATABASE_URL?.startsWith('postgres')) {
      errors.push(
        '❌ DATABASE_URL must be a valid PostgreSQL connection string in production!'
      );
    }

    // Check for allowed origins in production
    if (!process.env.ALLOWED_ORIGINS) {
      warnings.push(
        '⚠️  ALLOWED_ORIGINS is not set in production. This may cause CORS issues.'
      );
    }
  }

  // Check for Web3Auth completeness
  const hasAnyWeb3Auth = process.env.WEB3AUTH_CLIENT_ID || process.env.WEB3AUTH_JWT_SECRET;
  const hasCompleteWeb3Auth = process.env.WEB3AUTH_CLIENT_ID && process.env.WEB3AUTH_JWT_SECRET && process.env.ETHEREUM_RPC_URL;

  if (hasAnyWeb3Auth && !hasCompleteWeb3Auth) {
    warnings.push(
      '⚠️  Incomplete Web3Auth configuration. All of WEB3AUTH_CLIENT_ID, WEB3AUTH_JWT_SECRET, and ETHEREUM_RPC_URL are required.'
    );
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
