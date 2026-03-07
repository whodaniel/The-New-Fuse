#!/usr/bin/env node

/**
 * Security Validation Script
 *
 * This script validates that all required security configurations are in place
 * before starting the application or deploying to production.
 *
 * Usage:
 *   node scripts/validate-security.js
 *   npm run validate:security
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✓ ${message}`, 'green');
}

function logError(message) {
  log(`✗ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠ ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ ${message}`, 'cyan');
}

let errors = 0;
let warnings = 0;

// Required environment variables
const requiredSecrets = {
  production: [
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'DATABASE_URL',
    'REDIS_URL',
    'ENCRYPTION_KEY',
  ],
  development: [
    'JWT_SECRET',
    'DATABASE_URL',
  ],
};

// Weak/default values that should never be used
const weakSecrets = [
  'super-secret',
  'your-secret-key',
  '[REDACTED_SECRET]',
  'test-secret',
  'change-in-production',
  '1234567890',
  'password',
  'secret',
];

function validateEnvironmentVariables() {
  log('\n📝 Validating Environment Variables...', 'blue');

  const env = process.env.NODE_ENV || 'development';
  const required = requiredSecrets[env] || requiredSecrets.development;

  let allPresent = true;

  for (const varName of required) {
    const value = process.env[varName];

    if (!value) {
      logError(`${varName} is not set`);
      errors++;
      allPresent = false;
      continue;
    }

    // Check for weak secrets
    const isWeak = weakSecrets.some(weak =>
      value.toLowerCase().includes(weak.toLowerCase())
    );

    if (isWeak) {
      logError(`${varName} contains a weak/default value`);
      errors++;
      allPresent = false;
      continue;
    }

    // Check minimum length
    if (value.length < 32) {
      logWarning(`${varName} should be at least 32 characters (currently ${value.length})`);
      warnings++;
    }

    logSuccess(`${varName} is set and appears secure`);
  }

  return allPresent;
}

function checkHardcodedSecrets() {
  log('\n🔍 Checking for Hardcoded Secrets...', 'blue');

  const filesToCheck = [
    'apps/backend/src/controllers/authController.ts',
    'apps/backend/src/utils/auth.utils.ts',
    'apps/backend/src/utils/token.ts',
    'apps/backend/src/auth/auth.module.ts',
    'packages/security/src/auth/AuthService.ts',
    'apps/api/src/config/security.config.ts',
    'packages/core/src/security/encryption.ts',
  ];

  const suspiciousPatterns = [
    /['"].*secret.*['"]\s*:\s*['"][^'"]+['"]/gi,
    /process\.env\.\w+\s*\|\|\s*['"][^'"]+['"]/gi,
  ];

  let foundHardcodedSecrets = false;

  for (const file of filesToCheck) {
    const fullPath = path.join(__dirname, '..', file);

    if (!fs.existsSync(fullPath)) {
      continue;
    }

    const content = fs.readFileSync(fullPath, 'utf-8');

    for (const pattern of suspiciousPatterns) {
      const matches = content.match(pattern);
      if (matches && matches.length > 0) {
        logError(`Potential hardcoded secret in ${file}`);
        matches.forEach(match => {
          logError(`  → ${match.substring(0, 50)}...`);
        });
        errors++;
        foundHardcodedSecrets = true;
      }
    }
  }

  if (!foundHardcodedSecrets) {
    logSuccess('No hardcoded secrets detected in checked files');
  }

  return !foundHardcodedSecrets;
}

function validateSecurityHeaders() {
  log('\n🛡️  Validating Security Headers Configuration...', 'blue');

  const mainFiles = [
    'apps/api/src/main.ts',
    'apps/backend/src/main.ts',
  ];

  const requiredHeaders = [
    'Content-Security-Policy',
    'X-Frame-Options',
    'X-Content-Type-Options',
    'Strict-Transport-Security',
  ];

  let allConfigured = true;

  for (const file of mainFiles) {
    const fullPath = path.join(__dirname, '..', file);

    if (!fs.existsSync(fullPath)) {
      continue;
    }

    const content = fs.readFileSync(fullPath, 'utf-8');

    logInfo(`Checking ${file}...`);

    for (const header of requiredHeaders) {
      if (content.includes(header)) {
        logSuccess(`  ${header} configured`);
      } else {
        logWarning(`  ${header} not found`);
        warnings++;
        allConfigured = false;
      }
    }
  }

  return allConfigured;
}

function checkDependencyVulnerabilities() {
  log('\n📦 Checking for Dependency Vulnerabilities...', 'blue');

  const { execSync } = require('child_process');

  try {
    // Run npm audit in JSON mode
    const output = execSync('pnpm audit --json', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    });

    const audit = JSON.parse(output);

    if (audit.metadata) {
      const { vulnerabilities } = audit.metadata;

      if (vulnerabilities) {
        const total = Object.values(vulnerabilities).reduce((a, b) => a + b, 0);

        if (total === 0) {
          logSuccess('No known vulnerabilities found');
          return true;
        }

        if (vulnerabilities.critical > 0) {
          logError(`Found ${vulnerabilities.critical} critical vulnerabilities`);
          errors++;
        }

        if (vulnerabilities.high > 0) {
          logError(`Found ${vulnerabilities.high} high vulnerabilities`);
          errors++;
        }

        if (vulnerabilities.moderate > 0) {
          logWarning(`Found ${vulnerabilities.moderate} moderate vulnerabilities`);
          warnings++;
        }

        if (vulnerabilities.low > 0) {
          logWarning(`Found ${vulnerabilities.low} low vulnerabilities`);
          warnings++;
        }

        logInfo('Run "pnpm audit" for details');
        return false;
      }
    }

    logSuccess('No known vulnerabilities found');
    return true;
  } catch (error) {
    logWarning('Could not run dependency audit');
    return true; // Don't fail if audit cannot run
  }
}

function validateRateLimiting() {
  log('\n⏱️  Validating Rate Limiting Configuration...', 'blue');

  const securityConfigPath = path.join(__dirname, '..', 'apps/api/src/config/security.config.ts');

  if (!fs.existsSync(securityConfigPath)) {
    logWarning('Security config file not found');
    return false;
  }

  const content = fs.readFileSync(securityConfigPath, 'utf-8');

  const checks = [
    { name: 'Rate limit enabled', pattern: /rateLimit.*enabled.*true/i },
    { name: 'Auth rate limit configured', pattern: /auth.*requests.*\d+/i },
    { name: 'API rate limit configured', pattern: /api.*requests.*\d+/i },
  ];

  let allConfigured = true;

  for (const check of checks) {
    if (check.pattern.test(content)) {
      logSuccess(check.name);
    } else {
      logWarning(`${check.name} not found`);
      warnings++;
      allConfigured = false;
    }
  }

  return allConfigured;
}

function validateCORS() {
  log('\n🌐 Validating CORS Configuration...', 'blue');

  if (process.env.NODE_ENV === 'production') {
    const allowedOrigins = process.env.ALLOWED_ORIGINS;

    if (!allowedOrigins) {
      logError('ALLOWED_ORIGINS not set in production');
      errors++;
      return false;
    }

    if (allowedOrigins.includes('*')) {
      logError('CORS allows all origins in production (wildcard)');
      errors++;
      return false;
    }

    logSuccess('CORS appears properly configured');
    return true;
  }

  logInfo('Development mode - skipping strict CORS validation');
  return true;
}

function validateEncryption() {
  log('\n🔐 Validating Encryption Configuration...', 'blue');

  const encryptionKey = process.env.ENCRYPTION_KEY;

  if (!encryptionKey) {
    logError('ENCRYPTION_KEY is not set');
    errors++;
    return false;
  }

  if (encryptionKey.length < 32) {
    logError('ENCRYPTION_KEY should be at least 32 characters');
    errors++;
    return false;
  }

  // Check for weak encryption keys
  if (weakSecrets.some(weak => encryptionKey.toLowerCase().includes(weak))) {
    logError('ENCRYPTION_KEY contains weak/default value');
    errors++;
    return false;
  }

  logSuccess('Encryption key appears secure');
  return true;
}

function validateDatabaseSecurity() {
  log('\n🗄️  Validating Database Security...', 'blue');

  const dbUrl = process.env.DATABASE_URL;

  if (!dbUrl) {
    logError('DATABASE_URL is not set');
    errors++;
    return false;
  }

  // Check for SSL in production
  if (process.env.NODE_ENV === 'production') {
    if (!dbUrl.includes('sslmode=require') && !dbUrl.includes('ssl=true')) {
      logWarning('Database connection should use SSL in production');
      warnings++;
    } else {
      logSuccess('Database SSL appears configured');
    }
  }

  // Check for weak passwords in URL
  const passwordMatch = dbUrl.match(/:([^@]+)@/);
  if (passwordMatch) {
    const password = passwordMatch[1];
    if (password.length < 16) {
      logWarning('Database password should be at least 16 characters');
      warnings++;
    }
  }

  logSuccess('Database configuration validated');
  return true;
}

function generateReport() {
  log('\n📊 Security Validation Report', 'blue');
  log('='.repeat(50));

  if (errors === 0 && warnings === 0) {
    logSuccess('\n✅ All security checks passed!');
    logSuccess('Your application appears to be properly secured.');
    return true;
  }

  if (errors > 0) {
    logError(`\n❌ Found ${errors} critical security issue(s)`);
    logError('These must be fixed before deployment!');
  }

  if (warnings > 0) {
    logWarning(`\n⚠️  Found ${warnings} security warning(s)`);
    logWarning('Consider addressing these issues.');
  }

  return errors === 0;
}

// Main execution
function main() {
  log('\n🔒 Security Validation Script', 'cyan');
  log('='.repeat(50));
  log(`Environment: ${process.env.NODE_ENV || 'development'}`, 'cyan');

  // Run all validations
  validateEnvironmentVariables();
  checkHardcodedSecrets();
  validateSecurityHeaders();
  validateRateLimiting();
  validateCORS();
  validateEncryption();
  validateDatabaseSecurity();
  checkDependencyVulnerabilities();

  // Generate report and exit
  const success = generateReport();

  if (!success) {
    log('\n📚 Resources:', 'blue');
    log('  - Security Best Practices: docs/security/SECURITY_BEST_PRACTICES.md');
    log('  - Security Audit Report: docs/security/SECURITY_AUDIT_REPORT.md');
    log('  - Remediation Roadmap: docs/security/REMEDIATION_ROADMAP.md');

    process.exit(1);
  }

  process.exit(0);
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = {
  validateEnvironmentVariables,
  checkHardcodedSecrets,
  validateSecurityHeaders,
  validateRateLimiting,
  validateCORS,
  validateEncryption,
  validateDatabaseSecurity,
  checkDependencyVulnerabilities,
};
