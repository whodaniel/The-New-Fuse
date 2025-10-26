#!/usr/bin/env node

/**
 * Independent Theia IDE Build System
 * Complete standalone build process for Theia with proper error handling
 * and Node.js version management
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
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
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

// Build configuration
const CONFIG = {
  theiaVersion: '1.59.0',
  minNodeVersion: '18.17.0',
  maxNodeVersion: '20.999.999',
  defaultPort: 3000,
  buildTimeout: 10 * 60 * 1000, // 10 minutes
  memoryLimit: '8192'
};

class TheiaBuilder {
  constructor() {
    this.rootDir = process.cwd();
    this.packageJson = this.loadPackageJson();
    this.buildMode = 'development';
    this.verbose = false;
  }

  loadPackageJson() {
    try {
      return JSON.parse(fs.readFileSync('package.json', 'utf8'));
    } catch (error) {
      logError('Failed to load package.json');
      process.exit(1);
    }
  }

  checkNodeVersion() {
    logStep('Checking Node.js version compatibility');
    
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
    
    logInfo(`Current Node.js version: ${nodeVersion}`);
    
    if (majorVersion < 18 || majorVersion > 20) {
      logError(`Theia ${CONFIG.theiaVersion} requires Node.js >= ${CONFIG.minNodeVersion} and < 21`);
      logError(`Current version: ${nodeVersion} is incompatible`);
      
      log('\nTo fix this issue:');
      log('1. Install a compatible Node.js version:');
      log('   nvm install 20');
      log('   nvm use 20');
      log('2. Or install Node.js 18:');
      log('   nvm install 18');
      log('   nvm use 18');
      log('3. Then run this script again');
      
      return false;
    }
    
    logSuccess(`Node.js version ${nodeVersion} is compatible`);
    return true;
  }

  checkPackageManager() {
    logStep('Checking package manager availability');
    
    const packageManagers = ['yarn', 'npm', 'pnpm'];
    let availableManager = null;
    
    for (const manager of packageManagers) {
      try {
        execSync(`${manager} --version`, { stdio: 'ignore' });
        availableManager = manager;
        logSuccess(`${manager} is available`);
        break;
      } catch (error) {
        logWarning(`${manager} not found`);
      }
    }
    
    if (!availableManager) {
      logError('No compatible package manager found (yarn, npm, or pnpm)');
      return false;
    }
    
    this.packageManager = availableManager;
    return true;
  }

  installDependencies() {
    logStep('Installing Theia dependencies');
    
    const installCmd = this.packageManager === 'yarn' ? 'yarn install' : 
                      this.packageManager === 'pnpm' ? 'pnpm install' : 'npm install';
    
    try {
      logInfo(`Running: ${installCmd}`);
      execSync(installCmd, { 
        stdio: this.verbose ? 'inherit' : 'pipe',
        cwd: this.rootDir 
      });
      logSuccess('Dependencies installed successfully');
      return true;
    } catch (error) {
      logError(`Failed to install dependencies: ${error.message}`);
      return false;
    }
  }

  cleanBuild() {
    logStep('Cleaning previous build artifacts');
    
    const dirsToClean = ['lib', 'dist', 'src-gen', 'node_modules/.cache'];
    
    for (const dir of dirsToClean) {
      const fullPath = path.join(this.rootDir, dir);
      if (fs.existsSync(fullPath)) {
        try {
          fs.rmSync(fullPath, { recursive: true, force: true });
          logInfo(`Cleaned ${dir}`);
        } catch (error) {
          logWarning(`Failed to clean ${dir}: ${error.message}`);
        }
      }
    }
    
    logSuccess('Build artifacts cleaned');
  }

  generateTheiaFiles() {
    logStep('Generating Theia application files');
    
    try {
      // Check if Theia CLI is available
      let theiaCmd;
      if (fs.existsSync('./node_modules/.bin/theia')) {
        theiaCmd = './node_modules/.bin/theia';
      } else if (this.packageManager === 'yarn') {
        theiaCmd = 'yarn theia';
      } else {
        theiaCmd = 'npx @theia/cli';
      }
      
      logInfo('Generating Theia application...');
      execSync(`${theiaCmd} generate`, { 
        stdio: this.verbose ? 'inherit' : 'pipe',
        cwd: this.rootDir 
      });
      
      logSuccess('Theia files generated successfully');
      return true;
    } catch (error) {
      logError(`Failed to generate Theia files: ${error.message}`);
      return false;
    }
  }

  buildTheia() {
    logStep(`Building Theia in ${this.buildMode} mode`);
    
    try {
      // Set environment variables for build
      const env = {
        ...process.env,
        NODE_OPTIONS: `--max_old_space_size=${CONFIG.memoryLimit}`,
        BUILD_CONCURRENCY: '2'
      };
      
      // Determine Theia build command
      let theiaCmd;
      if (fs.existsSync('./node_modules/.bin/theia')) {
        theiaCmd = './node_modules/.bin/theia';
      } else if (this.packageManager === 'yarn') {
        theiaCmd = 'yarn theia';
      } else {
        theiaCmd = 'npx @theia/cli';
      }
      
      const buildArgs = this.buildMode === 'production' ? 
        ['build', '--mode', 'production'] : 
        ['build', '--mode', 'development'];
      
      logInfo(`Running: ${theiaCmd} ${buildArgs.join(' ')}`);
      
      // Run build with timeout
      const buildProcess = spawn(theiaCmd, buildArgs, {
        stdio: this.verbose ? 'inherit' : 'pipe',
        env,
        cwd: this.rootDir
      });
      
      return new Promise((resolve, reject) => {
        let output = '';
        
        if (!this.verbose) {
          buildProcess.stdout?.on('data', (data) => {
            output += data.toString();
          });
          
          buildProcess.stderr?.on('data', (data) => {
            output += data.toString();
          });
        }
        
        const timeout = setTimeout(() => {
          buildProcess.kill('SIGTERM');
          reject(new Error('Build timed out after 10 minutes'));
        }, CONFIG.buildTimeout);
        
        buildProcess.on('close', (code) => {
          clearTimeout(timeout);
          
          if (code === 0) {
            logSuccess('Theia build completed successfully');
            resolve(true);
          } else {
            logError(`Theia build failed with exit code ${code}`);
            if (!this.verbose && output) {
              log('\nBuild output:');
              log(output);
            }
            reject(new Error(`Build failed with exit code ${code}`));
          }
        });
        
        buildProcess.on('error', (error) => {
          clearTimeout(timeout);
          logError(`Build process error: ${error.message}`);
          reject(error);
        });
      });
      
    } catch (error) {
      logError(`Build failed: ${error.message}`);
      return false;
    }
  }

  verifyBuild() {
    logStep('Verifying build output');
    
    const requiredFiles = [
      'src-gen/backend/main.js',
      'src-gen/frontend/index.html'
    ];
    
    let allFilesExist = true;
    
    for (const file of requiredFiles) {
      const fullPath = path.join(this.rootDir, file);
      if (fs.existsSync(fullPath)) {
        logSuccess(`✓ ${file}`);
      } else {
        logError(`✗ Missing ${file}`);
        allFilesExist = false;
      }
    }
    
    if (allFilesExist) {
      logSuccess('Build verification passed');
      return true;
    } else {
      logError('Build verification failed - missing required files');
      return false;
    }
  }

  async runBuild(options = {}) {
    this.buildMode = options.mode || 'development';
    this.verbose = options.verbose || false;
    
    if (options.clean) {
      this.cleanBuild();
    }
    
    log(`🚀 Starting Theia IDE Build Process`, 'bright');
    log(`📦 Build Mode: ${this.buildMode}`, 'blue');
    log(`🔧 Package Manager: ${this.packageManager}`, 'blue');
    log(`📊 Memory Limit: ${CONFIG.memoryLimit}MB`, 'blue');
    
    const steps = [
      () => this.checkNodeVersion(),
      () => this.checkPackageManager(),
      () => this.installDependencies(),
      () => this.generateTheiaFiles(),
      () => this.buildTheia(),
      () => this.verifyBuild()
    ];
    
    for (const step of steps) {
      try {
        const result = await step();
        if (result === false) {
          logError('Build process failed');
          process.exit(1);
        }
      } catch (error) {
        logError(`Build step failed: ${error.message}`);
        process.exit(1);
      }
    }
    
    logSuccess('\n🎉 Theia IDE build completed successfully!');
    logInfo('\nNext steps:');
    log(`• Start development server: npm run dev`);
    log(`• Start production server: npm run start`);
    log(`• Access IDE at: http://localhost:${CONFIG.defaultPort}`);
    
    if (this.buildMode === 'production') {
      log(`• Production files are in: ./lib/`);
    }
  }
}

// CLI interface
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    mode: 'development',
    clean: false,
    verbose: false,
    help: false
  };
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--prod':
      case '--production':
        options.mode = 'production';
        break;
      case '--dev':
      case '--development':
        options.mode = 'development';
        break;
      case '--clean':
        options.clean = true;
        break;
      case '--verbose':
      case '-v':
        options.verbose = true;
        break;
      case '--help':
      case '-h':
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
  log('\n🚀 Theia IDE Standalone Build System', 'bright');
  log('═══════════════════════════════════════', 'cyan');
  log('\nUsage:');
  log('  node build-theia-standalone.js [options]', 'blue');
  log('\nOptions:');
  log('  --prod, --production    Build in production mode', 'blue');
  log('  --dev, --development    Build in development mode (default)', 'blue');
  log('  --clean                 Clean build artifacts before building', 'blue');
  log('  --verbose, -v           Show detailed build output', 'blue');
  log('  --help, -h              Show this help message', 'blue');
  log('\nExamples:');
  log('  node build-theia-standalone.js                    # Development build', 'blue');
  log('  node build-theia-standalone.js --prod             # Production build', 'blue');
  log('  node build-theia-standalone.js --clean --prod     # Clean production build', 'blue');
  log('  node build-theia-standalone.js --verbose          # Verbose output', 'blue');
  log('\nEnvironment Variables:');
  log('  NODE_OPTIONS            Set Node.js options (e.g., --max_old_space_size)', 'blue');
  log('  BUILD_CONCURRENCY       Set build concurrency (default: 2)', 'blue');
}

// Main execution
async function main() {
  const options = parseArgs();
  
  if (options.help) {
    showHelp();
    process.exit(0);
  }
  
  const builder = new TheiaBuilder();
  
  try {
    await builder.runBuild(options);
  } catch (error) {
    logError(`Build failed: ${error.message}`);
    process.exit(1);
  }
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logError(`Uncaught exception: ${error.message}`);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logError(`Unhandled rejection at ${promise}: ${reason}`);
  process.exit(1);
});

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { TheiaBuilder };