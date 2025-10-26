#!/usr/bin/env node

/**
 * Theia Database Setup Script
 * 
 * Sets up database integration for Theia IDE, including:
 * - Environment validation
 * - Database connection testing
 * - Schema verification
 * - Initial data setup
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n${step}. ${message}`, 'cyan');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

async function setupTheiaDatabase() {
  log('\n🚀 Setting up Theia IDE Database Integration', 'bright');
  log('=' .repeat(60), 'blue');

  try {
    // Step 1: Validate environment
    logStep(1, 'Validating Environment Configuration');
    await validateEnvironment();
    logSuccess('Environment validation passed');

    // Step 2: Check database connection
    logStep(2, 'Testing Database Connection');
    await testDatabaseConnection();
    logSuccess('Database connection successful');

    // Step 3: Verify schema
    logStep(3, 'Verifying Database Schema');
    await verifyDatabaseSchema();
    logSuccess('Database schema verified');

    // Step 4: Setup Theia-specific tables
    logStep(4, 'Setting up Theia Tables');
    await setupTheiaTables();
    logSuccess('Theia tables created/verified');

    // Step 5: Create initial configuration
    logStep(5, 'Creating Initial Configuration');
    await createInitialConfiguration();
    logSuccess('Initial configuration created');

    log('\n🎉 Theia Database Integration Setup Complete!', 'green');
    log('=' .repeat(60), 'blue');
    
    log('\nNext steps:', 'bright');
    log('1. Start Theia IDE: npm run dev', 'cyan');
    log('2. Check database connection in Theia logs', 'cyan');
    log('3. Verify workspace persistence is working', 'cyan');

  } catch (error) {
    logError(`Setup failed: ${error.message}`);
    process.exit(1);
  }
}

async function validateEnvironment() {
  // Check if .env.theia exists
  const envPath = path.join(__dirname, '../.env.theia');
  if (!fs.existsSync(envPath)) {
    throw new Error('.env.theia file not found. Please create it from the template.');
  }

  // Load environment variables
  require('dotenv').config({ path: envPath });

  // Check required variables
  const requiredVars = ['DATABASE_URL'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }

  // Validate DATABASE_URL format
  try {
    new URL(process.env.DATABASE_URL);
  } catch {
    throw new Error('Invalid DATABASE_URL format');
  }

  log(`📊 Database URL: ${maskDatabaseUrl(process.env.DATABASE_URL)}`, 'blue');
}

async function testDatabaseConnection() {
  try {
    // Use pg to test connection directly
    const { Client } = require('pg');
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
    });

    await client.connect();
    const result = await client.query('SELECT version()');
    await client.end();

    log(`📊 PostgreSQL Version: ${result.rows[0].version.split(' ')[1]}`, 'blue');
  } catch (error) {
    throw new Error(`Database connection failed: ${error.message}`);
  }
}

async function verifyDatabaseSchema() {
  try {
    const { Client } = require('pg');
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
    });

    await client.connect();

    // Check if main tables exist
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'agents', 'tasks')
    `);

    await client.end();

    const existingTables = result.rows.map(row => row.table_name);
    log(`📋 Found tables: ${existingTables.join(', ')}`, 'blue');

    if (existingTables.length === 0) {
      logWarning('Main application tables not found. Make sure the main database is set up.');
    }
  } catch (error) {
    throw new Error(`Schema verification failed: ${error.message}`);
  }
}

async function setupTheiaTables() {
  try {
    const { Client } = require('pg');
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
    });

    await client.connect();

    // Read and execute Theia schema
    const schemaPath = path.join(__dirname, '../../../database-backups/theia_database_schema.sql');
    
    if (fs.existsSync(schemaPath)) {
      const schema = fs.readFileSync(schemaPath, 'utf8');
      await client.query(schema);
      log('📋 Theia schema applied successfully', 'blue');
    } else {
      logWarning('Theia schema file not found. Tables may need to be created manually.');
    }

    // Verify Theia tables were created
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE 'theia_%'
    `);

    await client.end();

    const theiaTables = result.rows.map(row => row.table_name);
    log(`📋 Theia tables: ${theiaTables.join(', ')}`, 'blue');

  } catch (error) {
    throw new Error(`Theia tables setup failed: ${error.message}`);
  }
}

async function createInitialConfiguration() {
  // Create directories
  const configDirs = [
    path.join(__dirname, '../.theia'),
    path.join(__dirname, '../.theia/logs'),
    path.join(__dirname, '../.theia/workspaces'),
    path.join(__dirname, '../.theia/user-preferences'),
  ];

  configDirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      log(`📁 Created directory: ${path.relative(process.cwd(), dir)}`, 'blue');
    }
  });

  // Create initial MCP configuration if it doesn't exist
  const mcpConfigPath = path.join(__dirname, '../mcp-config.json');
  if (!fs.existsSync(mcpConfigPath)) {
    const defaultMcpConfig = {
      name: "The New Fuse IDE MCP Configuration",
      version: "1.63.3",
      servers: {
        filesystem: {
          command: "npx",
          args: ["-y", "@modelcontextprotocol/server-filesystem", "."],
          description: "File system access for The New Fuse workspace",
          autostart: true,
          env: {
            NODE_ENV: "production",
            WORKSPACE_ROOT: "."
          }
        }
      }
    };

    fs.writeFileSync(mcpConfigPath, JSON.stringify(defaultMcpConfig, null, 2));
    log('📋 Created default MCP configuration', 'blue');
  }
}

function maskDatabaseUrl(url) {
  try {
    const urlObj = new URL(url);
    if (urlObj.password) {
      urlObj.password = '***';
    }
    return urlObj.toString();
  } catch {
    return 'postgresql://***:***@localhost:5432/fuse';
  }
}

// Run the setup
if (require.main === module) {
  setupTheiaDatabase().catch(error => {
    logError(`Setup failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { setupTheiaDatabase };
