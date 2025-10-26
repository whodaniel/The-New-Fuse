#!/usr/bin/env node

/**
 * Theia IDE Development Server
 * Standalone development server with hot reload and debugging
 */

const fs = require('fs');
const path = require('path');
const { spawn, execSync } = require('child_process');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step) {
  log(`\n🔧 ${step}`, 'cyan');
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

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

class TheiaDevServer {
  constructor(options = {}) {
    this.port = options.port || 3000;
    this.host = options.host || '0.0.0.0';
    this.watch = options.watch !== false;
    this.verbose = options.verbose || false;
    this.openBrowser = options.open !== false;
    this.rootDir = process.cwd();
    this.processes = [];
  }

  checkPrerequisites() {
    logStep('Checking development prerequisites');
    
    // Check if Theia is built
    if (!fs.existsSync(path.join(this.rootDir, 'src-gen/backend/main.js'))) {
      logWarning('Theia is not built. Running build first...');
      try {
        execSync('node build-theia-standalone.js', { 
          stdio: 'inherit',
          cwd: this.rootDir 
        });
      } catch (error) {
        logError('Failed to build Theia. Please run build manually first.');
        return false;
      }
    }
    
    // Check if enhanced server exists
    if (!fs.existsSync(path.join(this.rootDir, 'enhanced-server.js'))) {
      logError('enhanced-server.js not found');
      return false;
    }
    
    logSuccess('Prerequisites check passed');
    return true;
  }

  startTheiaBackend() {
    logStep('Starting Theia backend');
    
    const theiaPort = this.port + 1;
    
    try {
      const theiaProcess = spawn('node', [
        './src-gen/backend/main.js',
        `--port=${theiaPort}`,
        '--hostname=0.0.0.0',
        '--plugins=local-dir:../../plugins',
        '--J-Dplugins.auto-install=false'
      ], {
        stdio: this.verbose ? 'inherit' : 'pipe',
        cwd: this.rootDir,
        env: {
          ...process.env,
          NODE_OPTIONS: '--max_old_space_size=4096'
        }
      });
      
      theiaProcess.on('error', (error) => {
        logError(`Theia backend error: ${error.message}`);
      });
      
      theiaProcess.on('exit', (code) => {
        if (code !== 0) {
          logError(`Theia backend exited with code ${code}`);
        }
      });
      
      if (!this.verbose) {
        theiaProcess.stdout?.on('data', (data) => {
          const output = data.toString().trim();
          if (output) {
            log(`[Theia Backend] ${output}`, 'blue');
          }
        });
        
        theiaProcess.stderr?.on('data', (data) => {
          const output = data.toString().trim();
          if (output) {
            log(`[Theia Backend Error] ${output}`, 'yellow');
          }
        });
      }
      
      this.processes.push(theiaProcess);
      logSuccess(`Theia backend started on port ${theiaPort}`);
      return theiaPort;
      
    } catch (error) {
      logError(`Failed to start Theia backend: ${error.message}`);
      return null;
    }
  }

  startEnhancedServer() {
    logStep('Starting enhanced development server');
    
    try {
      const serverProcess = spawn('node', ['enhanced-server.js'], {
        stdio: this.verbose ? 'inherit' : 'pipe',
        cwd: this.rootDir,
        env: {
          ...process.env,
          PORT: this.port.toString(),
          NODE_ENV: 'development'
        }
      });
      
      serverProcess.on('error', (error) => {
        logError(`Enhanced server error: ${error.message}`);
      });
      
      serverProcess.on('exit', (code) => {
        if (code !== 0) {
          logError(`Enhanced server exited with code ${code}`);
        }
      });
      
      if (!this.verbose) {
        serverProcess.stdout?.on('data', (data) => {
          const output = data.toString().trim();
          if (output) {
            log(`[Server] ${output}`, 'green');
          }
        });
        
        serverProcess.stderr?.on('data', (data) => {
          const output = data.toString().trim();
          if (output) {
            log(`[Server Error] ${output}`, 'yellow');
          }
        });
      }
      
      this.processes.push(serverProcess);
      logSuccess(`Enhanced server started on port ${this.port}`);
      return this.port;
      
    } catch (error) {
      logError(`Failed to start enhanced server: ${error.message}`);
      return null;
    }
  }

  startFileWatcher() {
    if (!this.watch) {
      return;
    }
    
    logStep('Starting file watcher');
    
    try {
      const watchProcess = spawn('node', ['scripts/watch-theia.js'], {
        stdio: this.verbose ? 'inherit' : 'pipe',
        cwd: this.rootDir
      });
      
      watchProcess.on('error', (error) => {
        logWarning(`File watcher error: ${error.message}`);
      });
      
      if (!this.verbose) {
        watchProcess.stdout?.on('data', (data) => {
          const output = data.toString().trim();
          if (output) {
            log(`[Watcher] ${output}`, 'magenta');
          }
        });
      }
      
      this.processes.push(watchProcess);
      logSuccess('File watcher started');
      
    } catch (error) {
      logWarning(`Failed to start file watcher: ${error.message}`);
    }
  }

  openBrowser() {
    if (!this.openBrowser) {
      return;
    }
    
    const url = `http://localhost:${this.port}`;
    
    try {
      const start = process.platform === 'darwin' ? 'open' : 
                   process.platform === 'win32' ? 'start' : 'xdg-open';
      
      execSync(`${start} ${url}`, { stdio: 'ignore' });
      logSuccess(`Browser opened at ${url}`);
    } catch (error) {
      logWarning(`Failed to open browser: ${error.message}`);
      logInfo(`Please manually open: ${url}`);
    }
  }

  async start() {
    log('🚀 Starting Theia IDE Development Server', 'bright');
    log(`📡 Server will be available at: http://localhost:${this.port}`, 'blue');
    log(`🔧 Host: ${this.host}`, 'blue');
    log(`👀 File watching: ${this.watch ? 'enabled' : 'disabled'}`, 'blue');
    
    if (!this.checkPrerequisites()) {
      process.exit(1);
    }
    
    // Start Theia backend
    const theiaPort = this.startTheiaBackend();
    if (!theiaPort) {
      process.exit(1);
    }
    
    // Wait a moment for Theia to start
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Start enhanced server
    const serverPort = this.startEnhancedServer();
    if (!serverPort) {
      this.shutdown();
      process.exit(1);
    }
    
    // Start file watcher
    this.startFileWatcher();
    
    // Open browser after a short delay
    setTimeout(() => {
      this.openBrowser();
    }, 2000);
    
    logSuccess('\n🎉 Development server started successfully!');
    logInfo('\nAvailable endpoints:');
    log(`• Main IDE: http://localhost:${this.port}`);
    log(`• Dashboard: http://localhost:${this.port}/dashboard`);
    log(`• Theia Direct: http://localhost:${theiaPort}`);
    log(`• Health Check: http://localhost:${this.port}/health`);
    log('\nPress Ctrl+C to stop the server');
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
      log('\n🛑 Received SIGINT, shutting down gracefully...');
      this.shutdown();
    });
    
    process.on('SIGTERM', () => {
      log('\n🛑 Received SIGTERM, shutting down gracefully...');
      this.shutdown();
    });
  }

  shutdown() {
    log('🔄 Shutting down development server...');
    
    for (const process of this.processes) {
      if (process && !process.killed) {
        process.kill('SIGTERM');
      }
    }
    
    setTimeout(() => {
      log('✅ Development server stopped');
      process.exit(0);
    }, 2000);
  }
}

// CLI interface
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    port: 3000,
    host: '0.0.0.0',
    watch: true,
    verbose: false,
    open: true,
    help: false
  };
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];
    
    switch (arg) {
      case '--port':
      case '-p':
        options.port = parseInt(nextArg) || 3000;
        i++;
        break;
      case '--host':
      case '-h':
        options.host = nextArg || '0.0.0.0';
        i++;
        break;
      case '--no-watch':
        options.watch = false;
        break;
      case '--no-open':
        options.open = false;
        break;
      case '--verbose':
      case '-v':
        options.verbose = true;
        break;
      case '--help':
        options.help = true;
        break;
      default:
        if (arg.startsWith('--')) {
          logError(`Unknown option: ${arg}`);
          options.help = true;
        }
    }
  }
  
  return options;
}

function showHelp() {
  log('\n🚀 Theia IDE Development Server', 'bright');
  log('═══════════════════════════════════════', 'cyan');
  log('\nUsage:');
  log('  node scripts/dev-theia.js [options]', 'blue');
  log('\nOptions:');
  log('  --port, -p <number>     Server port (default: 3000)', 'blue');
  log('  --host, -h <address>    Server host (default: 0.0.0.0)', 'blue');
  log('  --no-watch              Disable file watching', 'blue');
  log('  --no-open               Don\'t open browser automatically', 'blue');
  log('  --verbose, -v           Show detailed output', 'blue');
  log('  --help                  Show this help message', 'blue');
  log('\nExamples:');
  log('  node scripts/dev-theia.js                    # Start with defaults', 'blue');
  log('  node scripts/dev-theia.js --port 3001        # Custom port', 'blue');
  log('  node scripts/dev-theia.js --no-open          # Don\'t open browser', 'blue');
  log('  node scripts/dev-theia.js --verbose          # Verbose output', 'blue');
}

// Main execution
async function main() {
  const options = parseArgs();
  
  if (options.help) {
    showHelp();
    process.exit(0);
  }
  
  const devServer = new TheiaDevServer(options);
  
  try {
    await devServer.start();
  } catch (error) {
    logError(`Failed to start development server: ${error.message}`);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { TheiaDevServer };