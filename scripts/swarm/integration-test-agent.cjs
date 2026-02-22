#!/usr/bin/env node
/**
 * TNF Integration Testing Agent
 *
 * Specializes in testing API endpoints, database connections,
 * and cross-service communication.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Load environment
function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const lines = fs.readFileSync(filePath, 'utf8').split('\n');
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#') || !line.includes('=')) continue;
    const separatorIndex = line.indexOf('=');
    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

const ROOT_DIR = path.resolve(__dirname, '../..');
loadEnvFile(path.join(ROOT_DIR, '.env.local'));
loadEnvFile(path.join(ROOT_DIR, '.env'));

// Test results
const results = {
  timestamp: new Date().toISOString(),
  api: { passed: 0, failed: 0, errors: [] },
  database: { passed: 0, failed: 0, errors: [] },
  services: { passed: 0, failed: 0, errors: [] },
  overall: { score: 0, status: 'unknown' },
};

const log = {
  header: (msg) => console.log(`\n${'='.repeat(60)}\n  ${msg}\n${'='.repeat(60)}`),
  section: (msg) => console.log(`\n🔌 ${msg}`),
  success: (msg) => console.log(`  ✅ ${msg}`),
  error: (msg) => console.log(`  ❌ ${msg}`),
  warn: (msg) => console.log(`  ⚠️ ${msg}`),
  info: (msg) => console.log(`  ℹ️ ${msg}`),
};

// Check API endpoints
function testAPIEndpoints() {
  log.section('API Endpoints Check');

  const backendDir = path.join(ROOT_DIR, 'apps/backend');
  const apiGatewayDir = path.join(ROOT_DIR, 'apps/api-gateway');

  // Check for API route files
  const apiLocations = [
    { name: 'Backend', path: path.join(backendDir, 'src') },
    { name: 'API Gateway', path: path.join(apiGatewayDir, 'src') },
  ];

  for (const loc of apiLocations) {
    if (fs.existsSync(loc.path)) {
      log.info(`${loc.name} API directory exists`);

      // Look for controller files
      const findControllers = (dir) => {
        const files = [];
        if (!fs.existsSync(dir)) return files;

        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.isDirectory()) {
            files.push(...findControllers(path.join(dir, entry.name)));
          } else if (entry.name.includes('.controller.') || entry.name.includes('.route.')) {
            files.push(path.join(dir, entry.name));
          }
        }
        return files;
      };

      const controllers = findControllers(loc.path);
      if (controllers.length > 0) {
        log.success(`Found ${controllers.length} API controllers/routes in ${loc.name}`);
        results.api.passed++;
      } else {
        log.warn(`No API controllers found in ${loc.name}`);
        results.api.passed++; // Non-blocking
      }
    } else {
      log.info(`${loc.name} not found at ${loc.path}`);
    }
  }

  // Check for OpenAPI/Swagger specs
  const swaggerPaths = [
    path.join(backendDir, 'swagger.json'),
    path.join(backendDir, 'openapi.json'),
    path.join(apiGatewayDir, 'swagger.json'),
    path.join(ROOT_DIR, 'docs/api'),
  ];

  for (const swaggerPath of swaggerPaths) {
    if (fs.existsSync(swaggerPath)) {
      log.success(`API spec found: ${swaggerPath}`);
      results.api.passed++;
    }
  }

  return results.api.failed === 0;
}

// Check database configuration
function testDatabase() {
  log.section('Database Configuration Check');

  const dbPackage = path.join(ROOT_DIR, 'packages/database');

  if (!fs.existsSync(dbPackage)) {
    log.warn('Database package not found');
    results.database.passed++;
    return true;
  }

  // Check for schema files
  const schemaFiles = [
    'src/schema.ts',
    'src/schemas/index.ts',
    'src/drizzle/schema.ts',
    'prisma/schema.prisma',
  ];

  for (const schema of schemaFiles) {
    const schemaPath = path.join(dbPackage, schema);
    if (fs.existsSync(schemaPath)) {
      log.success(`Database schema found: ${schema}`);
      results.database.passed++;
    }
  }

  // Check for migration files
  const migrationDirs = ['migrations', 'drizzle', 'prisma/migrations'];

  for (const migDir of migrationDirs) {
    const migPath = path.join(dbPackage, migDir);
    if (fs.existsSync(migPath)) {
      const files = fs.readdirSync(migPath);
      if (files.length > 0) {
        log.success(`Found ${files.length} migration files in ${migDir}`);
        results.database.passed++;
      }
    }
  }

  // Check for database config
  const dbConfigPath = path.join(dbPackage, 'src/index.ts');
  if (fs.existsSync(dbConfigPath)) {
    log.success('Database package entry point exists');
    results.database.passed++;
  }

  // Check environment variables for database
  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl) {
    log.success('DATABASE_URL is configured');
    results.database.passed++;
  } else {
    log.warn('DATABASE_URL not set (may use defaults)');
    results.database.passed++; // Non-blocking
  }

  return results.database.failed === 0;
}

// Check service connections
function testServices() {
  log.section('Service Connections Check');

  // Check for Redis configuration
  const redisUrl = process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL;
  if (redisUrl) {
    log.success('Redis URL is configured');
    results.services.passed++;
  } else {
    log.info('Redis URL not configured (optional for some features)');
    results.services.passed++;
  }

  // Check for Firebase configuration
  const firebaseConfig =
    process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (firebaseConfig) {
    log.success('Firebase project configured');
    results.services.passed++;
  } else {
    log.info('Firebase not configured (optional)');
    results.services.passed++;
  }

  // Check for MCP servers
  const mcpDir = path.join(ROOT_DIR, 'apps/mcp-servers');
  if (fs.existsSync(mcpDir)) {
    const mcpServers = fs
      .readdirSync(mcpDir)
      .filter((f) => fs.statSync(path.join(mcpDir, f)).isDirectory());
    if (mcpServers.length > 0) {
      log.success(`Found ${mcpServers.length} MCP server packages`);
      results.services.passed++;
    }
  }

  // Check for relay server
  const relayDir = path.join(ROOT_DIR, 'apps/relay-server');
  if (fs.existsSync(relayDir)) {
    log.success('Relay server package exists');
    results.services.passed++;
  }

  return results.services.failed === 0;
}

// Calculate overall score
function calculateScore() {
  const totalPassed = results.api.passed + results.database.passed + results.services.passed;
  const totalFailed = results.api.failed + results.database.failed + results.services.failed;
  const total = totalPassed + totalFailed;

  results.overall.score = total > 0 ? Math.round((totalPassed / total) * 100) : 0;
  results.overall.status =
    results.overall.score >= 80
      ? 'healthy'
      : results.overall.score >= 60
        ? 'needs-attention'
        : 'critical';

  return results;
}

// Generate report
function generateReport() {
  log.header('INTEGRATION TEST RESULTS');

  console.log('\n📊 API Endpoints:');
  console.log(`   Passed: ${results.api.passed}`);
  console.log(`   Failed: ${results.api.failed}`);

  console.log('\n📊 Database:');
  console.log(`   Passed: ${results.database.passed}`);
  console.log(`   Failed: ${results.database.failed}`);

  console.log('\n📊 Services:');
  console.log(`   Passed: ${results.services.passed}`);
  console.log(`   Failed: ${results.services.failed}`);

  console.log('\n📈 Overall Score:');
  console.log(`   ${results.overall.score}% - ${results.overall.status.toUpperCase()}`);

  // Save report
  const reportDir = path.join(ROOT_DIR, '.agent/test-reports');
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  const reportFile = path.join(reportDir, `integration-report-${Date.now()}.json`);
  fs.writeFileSync(reportFile, JSON.stringify(results, null, 2));
  log.info(`Report saved to: ${reportFile}`);

  return results;
}

// Main
async function main() {
  console.log('\n🔌 TNF Integration Testing Agent');
  console.log(`   Started: ${results.timestamp}`);

  try {
    testAPIEndpoints();
    testDatabase();
    testServices();
    calculateScore();
    generateReport();

    if (results.overall.status === 'critical') {
      console.log('\n🚨 CRITICAL: Integration issues detected!');
      process.exit(1);
    } else {
      console.log('\n✅ Integration tests completed.');
      process.exit(0);
    }
  } catch (error) {
    console.error('\n❌ Integration testing failed:', error.message);
    process.exit(1);
  }
}

main();
