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

const ENV_VARS: EnvVarConfig[] = [
  // Vite Configuration
  {
    name: 'VITE_HOST',
    required: false,
    defaultValue: 'localhost',
    description: 'Development server host',
  },
  {
    name: 'VITE_PORT',
    required: false,
    defaultValue: '3000',
    validator: (val) => !isNaN(parseInt(val)) && parseInt(val) > 0 && parseInt(val) < 65536,
    description: 'Development server port',
  },

  // API Configuration
  {
    name: 'VITE_API_URL',
    required: false,
    defaultValue: 'http://localhost:3001',
    validator: (val) =>
      val.startsWith('http://') || val.startsWith('https://') || val.startsWith('/'),
    description: 'API server URL',
  },
  {
    name: 'VITE_WS_URL',
    required: false,
    defaultValue: 'ws://localhost:3001',
    validator: (val) => val.startsWith('ws://') || val.startsWith('wss://'),
    description: 'WebSocket server URL',
  },
  {
    name: 'VITE_API_BASE_URL',
    required: false,
    defaultValue: '/api',
    description: 'API base path',
  },

  // IDE Configuration
  {
    name: 'VITE_THEIA_IDE_URL',
    required: false,
    defaultValue: 'http://localhost:3007',
    validator: (val) => val.startsWith('http://') || val.startsWith('https://'),
    description: 'Theia IDE URL',
  },

  // Feature Flags
  {
    name: 'VITE_ENABLE_ANALYTICS',
    required: false,
    defaultValue: 'false',
    validator: (val) => ['true', 'false'].includes(val.toLowerCase()),
    description: 'Enable analytics',
  },
  {
    name: 'VITE_ENABLE_DEBUG',
    required: false,
    defaultValue: 'true',
    validator: (val) => ['true', 'false'].includes(val.toLowerCase()),
    description: 'Enable debug mode',
  },
  {
    name: 'VITE_ENABLE_HOT_RELOAD',
    required: false,
    defaultValue: 'true',
    validator: (val) => ['true', 'false'].includes(val.toLowerCase()),
    description: 'Enable hot module reload',
  },
  {
    name: 'VITE_ENABLE_FAIRTABLE',
    required: false,
    defaultValue: 'true',
    validator: (val) => ['true', 'false'].includes(val.toLowerCase()),
    description: 'Enable fairtable routes',
  },
  {
    name: 'VITE_ENABLE_FAIRTABLE_COMPONENTS',
    required: false,
    defaultValue: 'true',
    validator: (val) => ['true', 'false'].includes(val.toLowerCase()),
    description: 'Enable fairtable component preview integration',
  },

  // Security
  {
    name: 'VITE_ALLOWED_ORIGINS',
    required: false,
    description: 'Comma-separated list of allowed origins',
  },

  // Supabase Configuration (Optional)
  {
    name: 'VITE_SUPABASE_URL',
    required: false,
    validator: (val) => val.startsWith('https://'),
    description: 'Supabase project URL',
  },
  {
    name: 'VITE_SUPABASE_ANON_KEY',
    required: false,
    description: 'Supabase anonymous key',
  },

  // OAuth Configuration (Optional)
  {
    name: 'VITE_GOOGLE_CLIENT_ID',
    required: false,
    description: 'Google OAuth client ID',
  },
  {
    name: 'VITE_GITHUB_CLIENT_ID',
    required: false,
    description: 'GitHub OAuth client ID',
  },

  // Monitoring (Optional)
  {
    name: 'VITE_SENTRY_DSN',
    required: false,
    description: 'Sentry error tracking DSN',
  },
  {
    name: 'VITE_GOOGLE_ANALYTICS_ID',
    required: false,
    description: 'Google Analytics tracking ID',
  },

  // Build Information
  {
    name: 'VITE_BUILD_ID',
    required: false,
    description: 'Build identifier',
  },
  {
    name: 'VITE_VERSION',
    required: false,
    description: 'Application version',
  },
  {
    name: 'VITE_APP_VERSION',
    required: false,
    description: 'Application version (alternative)',
  },
];

/**
 * Validates a single environment variable
 */
function validateEnvVar(config: EnvVarConfig): {
  valid: boolean;
  error?: string;
  warning?: string;
} {
  // For frontend, check import.meta.env
  const value =
    typeof import.meta !== 'undefined' && import.meta.env
      ? (import.meta.env[config.name] as string | undefined)
      : undefined;

  // Check if required variable is missing
  if (config.required && !value) {
    return {
      valid: false,
      error: `❌ Missing required environment variable: ${config.name}\n   Description: ${config.description}`,
    };
  }

  // Note default values (import.meta.env doesn't support runtime defaults)
  if (!value && config.defaultValue) {
    return {
      valid: true,
      warning: `⚠️  ${config.name} not set, code will use default: ${config.defaultValue}`,
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

  console.log('🔍 Validating environment variables for Frontend Service...\n');

  for (const config of ENV_VARS) {
    const result = validateEnvVar(config);

    if (!result.valid && result.error) {
      errors.push(result.error);
    }

    if (result.warning) {
      warnings.push(result.warning);
    }
  }

  // Check for complete Supabase configuration
  const hasSupabaseUrl =
    typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_URL;
  const hasSupabaseKey =
    typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_ANON_KEY;

  if ((hasSupabaseUrl || hasSupabaseKey) && !(hasSupabaseUrl && hasSupabaseKey)) {
    warnings.push(
      '⚠️  Incomplete Supabase configuration. Both VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are required.'
    );
  }

  // Production-specific checks
  const isProduction =
    typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.MODE === 'production';

  if (isProduction) {
    const apiUrl =
      typeof import.meta !== 'undefined' &&
      import.meta.env &&
      (import.meta.env.VITE_API_URL as string | undefined);
    const wsUrl =
      typeof import.meta !== 'undefined' &&
      import.meta.env &&
      (import.meta.env.VITE_WS_URL as string | undefined);

    if (apiUrl && !apiUrl.startsWith('https://') && !apiUrl.startsWith('/')) {
      warnings.push('⚠️  VITE_API_URL should use HTTPS in production for security.');
    }

    if (wsUrl && !wsUrl.startsWith('wss://')) {
      warnings.push('⚠️  VITE_WS_URL should use WSS (secure WebSocket) in production.');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validates environment and throws if validation fails (for build-time checks)
 */
export function validateEnvironmentOrThrow(): void {
  const result = validateEnvironment();

  // Print warnings
  if (result.warnings.length > 0) {
    console.log('⚠️  Warnings:\n');
    result.warnings.forEach((warning) => console.log(warning));
    console.log('');
  }

  // Throw error if validation failed
  if (!result.isValid) {
    console.error('❌ Environment validation failed!\n');
    result.errors.forEach((error) => console.error(error));
    console.error('\n💡 Tip: Copy .env.example to .env.local and fill in the required values.\n');
    throw new Error('Environment validation failed');
  }

  console.log('✅ Environment validation passed!\n');
}

// Export for testing
export { ENV_VARS };
export type { EnvVarConfig };
