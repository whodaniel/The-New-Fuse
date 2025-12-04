/**
 * Environment Variables Validation for Frontend Service
 * Validates all required environment variables at build time
 * Provides clear error messages for missing or invalid configurations
 */
var ENV_VARS = [
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
        validator: function (val) { return !isNaN(parseInt(val)) && parseInt(val) > 0 && parseInt(val) < 65536; },
        description: 'Development server port',
    },
    // API Configuration
    {
        name: 'VITE_API_URL',
        required: false,
        defaultValue: 'http://localhost:3001',
        validator: function (val) { return val.startsWith('http://') || val.startsWith('https://') || val.startsWith('/'); },
        description: 'API server URL',
    },
    {
        name: 'VITE_WS_URL',
        required: false,
        defaultValue: 'ws://localhost:3001',
        validator: function (val) { return val.startsWith('ws://') || val.startsWith('wss://'); },
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
        validator: function (val) { return val.startsWith('http://') || val.startsWith('https://'); },
        description: 'Theia IDE URL',
    },
    // Feature Flags
    {
        name: 'VITE_ENABLE_ANALYTICS',
        required: false,
        defaultValue: 'false',
        validator: function (val) { return ['true', 'false'].includes(val.toLowerCase()); },
        description: 'Enable analytics',
    },
    {
        name: 'VITE_ENABLE_DEBUG',
        required: false,
        defaultValue: 'true',
        validator: function (val) { return ['true', 'false'].includes(val.toLowerCase()); },
        description: 'Enable debug mode',
    },
    {
        name: 'VITE_ENABLE_HOT_RELOAD',
        required: false,
        defaultValue: 'true',
        validator: function (val) { return ['true', 'false'].includes(val.toLowerCase()); },
        description: 'Enable hot module reload',
    },
    // Security
    {
        name: 'VITE_ALLOWED_ORIGINS',
        required: false,
        description: 'Comma-separated list of allowed origins',
    },
    // Firebase Configuration (Optional)
    {
        name: 'VITE_FIREBASE_API_KEY',
        required: false,
        description: 'Firebase API key',
    },
    {
        name: 'VITE_FIREBASE_AUTH_DOMAIN',
        required: false,
        description: 'Firebase auth domain',
    },
    {
        name: 'VITE_FIREBASE_PROJECT_ID',
        required: false,
        description: 'Firebase project ID',
    },
    {
        name: 'VITE_FIREBASE_STORAGE_BUCKET',
        required: false,
        description: 'Firebase storage bucket',
    },
    {
        name: 'VITE_FIREBASE_MESSAGING_SENDER_ID',
        required: false,
        description: 'Firebase messaging sender ID',
    },
    {
        name: 'VITE_FIREBASE_APP_ID',
        required: false,
        description: 'Firebase app ID',
    },
    // Supabase Configuration (Optional)
    {
        name: 'VITE_SUPABASE_URL',
        required: false,
        validator: function (val) { return val.startsWith('https://'); },
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
function validateEnvVar(config) {
    // For frontend, check import.meta.env
    var value = typeof import.meta !== 'undefined' && import.meta.env
        ? import.meta.env[config.name]
        : undefined;
    // Check if required variable is missing
    if (config.required && !value) {
        return {
            valid: false,
            error: "\u274C Missing required environment variable: ".concat(config.name, "\n   Description: ").concat(config.description),
        };
    }
    // Note default values (import.meta.env doesn't support runtime defaults)
    if (!value && config.defaultValue) {
        return {
            valid: true,
            warning: "\u26A0\uFE0F  ".concat(config.name, " not set, code will use default: ").concat(config.defaultValue),
        };
    }
    // Validate value if validator is provided
    if (value && config.validator && !config.validator(value)) {
        return {
            valid: false,
            error: "\u274C Invalid value for ".concat(config.name, "\n   Description: ").concat(config.description, "\n   Current value: ").concat(value.substring(0, 50), "..."),
        };
    }
    return { valid: true };
}
/**
 * Validates all environment variables
 */
export function validateEnvironment() {
    var errors = [];
    var warnings = [];
    console.log('🔍 Validating environment variables for Frontend Service...\n');
    for (var _i = 0, ENV_VARS_1 = ENV_VARS; _i < ENV_VARS_1.length; _i++) {
        var config = ENV_VARS_1[_i];
        var result = validateEnvVar(config);
        if (!result.valid && result.error) {
            errors.push(result.error);
        }
        if (result.warning) {
            warnings.push(result.warning);
        }
    }
    // Check for complete Firebase configuration
    var firebaseVars = [
        'VITE_FIREBASE_API_KEY',
        'VITE_FIREBASE_AUTH_DOMAIN',
        'VITE_FIREBASE_PROJECT_ID',
        'VITE_FIREBASE_STORAGE_BUCKET',
        'VITE_FIREBASE_MESSAGING_SENDER_ID',
        'VITE_FIREBASE_APP_ID',
    ];
    var hasAnyFirebase = firebaseVars.some(function (varName) {
        return typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[varName];
    });
    var hasAllFirebase = firebaseVars.every(function (varName) {
        return typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[varName];
    });
    if (hasAnyFirebase && !hasAllFirebase) {
        warnings.push('⚠️  Incomplete Firebase configuration. All Firebase variables must be set together.');
    }
    // Check for complete Supabase configuration
    var hasSupabaseUrl = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_URL;
    var hasSupabaseKey = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_ANON_KEY;
    if ((hasSupabaseUrl || hasSupabaseKey) && !(hasSupabaseUrl && hasSupabaseKey)) {
        warnings.push('⚠️  Incomplete Supabase configuration. Both VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are required.');
    }
    // Production-specific checks
    var isProduction = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.MODE === 'production';
    if (isProduction) {
        var apiUrl = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL;
        var wsUrl = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_WS_URL;
        if (apiUrl && !apiUrl.startsWith('https://') && !apiUrl.startsWith('/')) {
            warnings.push('⚠️  VITE_API_URL should use HTTPS in production for security.');
        }
        if (wsUrl && !wsUrl.startsWith('wss://')) {
            warnings.push('⚠️  VITE_WS_URL should use WSS (secure WebSocket) in production.');
        }
    }
    return {
        isValid: errors.length === 0,
        errors: errors,
        warnings: warnings,
    };
}
/**
 * Validates environment and throws if validation fails (for build-time checks)
 */
export function validateEnvironmentOrThrow() {
    var result = validateEnvironment();
    // Print warnings
    if (result.warnings.length > 0) {
        console.log('⚠️  Warnings:\n');
        result.warnings.forEach(function (warning) { return console.log(warning); });
        console.log('');
    }
    // Throw error if validation failed
    if (!result.isValid) {
        console.error('❌ Environment validation failed!\n');
        result.errors.forEach(function (error) { return console.error(error); });
        console.error('\n💡 Tip: Copy .env.example to .env.local and fill in the required values.\n');
        throw new Error('Environment validation failed');
    }
    console.log('✅ Environment validation passed!\n');
}
// Export for testing
export { ENV_VARS };
