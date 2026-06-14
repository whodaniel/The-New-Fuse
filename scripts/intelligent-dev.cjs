#!/usr/bin/env node

/**
 * Intelligent Development Server for The New Fuse
 * Provides smart, memory-aware development server startup with enhanced cleanup and monitoring
 */

const { execSync, spawn } = require('child_process');
const os = require('os');
const path = require('path');
const fs = require('fs');

// ANSI Colors
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

class IntelligentDevServer {
  constructor() {
    this.systemInfo = this.getSystemInfo();
    this.devStrategy = this.determineStrategy();
    this.startTime = Date.now();
  }

  log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }

  getSystemInfo() {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const cpus = os.cpus().length;
    
    return {
      totalMem: totalMem,
      freeMem: freeMem,
      usedMem: totalMem - freeMem,
      memoryUsage: ((totalMem - freeMem) / totalMem) * 100,
      cpus: cpus,
      platform: os.platform(),
      arch: os.arch()
    };
  }

  formatBytes(bytes) {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  }

  determineStrategy() {
    const { memoryUsage, freeMem, cpus } = this.systemInfo;
    
    // All services available with dev scripts
    const allServices = ['electron-desktop', 'api-gateway', 'frontend-app', 'theia-ide'];
    
    // High memory pressure - conservative approach (Browser Hub + API only)
    if (memoryUsage > 80 || freeMem < 1024 * 1024 * 1024) {
      return {
        name: 'conservative',
        concurrency: Math.min(4, Math.max(1, Math.floor(cpus / 2))),
        services: ['electron-desktop', 'api-gateway'], // Browser Hub + essential API
        memoryLimit: '2048',
        description: 'Conservative mode - Browser Hub + essential services'
      };
    }
    
    // Medium memory - balanced approach (Browser Hub + core services)
    if (memoryUsage > 60 || freeMem < 2048 * 1024 * 1024) {
      return {
        name: 'balanced',
        concurrency: Math.min(4, Math.max(2, Math.floor(cpus * 0.75))),
        services: ['electron-desktop', 'api-gateway', 'frontend-app'],
        memoryLimit: '3072',
        description: 'Balanced mode - Browser Hub + core services'
      };
    }
    
    // Good memory - full development (all services)
    return {
      name: 'full',
      concurrency: Math.min(4, cpus),
      services: allServices,  // All available dev services
      memoryLimit: '4096',
      description: 'Full mode - Browser Hub + all development services'
    };
  }

  async preflightChecks() {
    this.log('🔍 Running preflight checks...', 'blue');
    
    // 1. Check if ports are clear
    const ports = [3000, 3001, 3002, 3005, 3006, 3007];
    const busyPorts = [];
    
    for (const port of ports) {
      try {
        execSync(`lsof -i:${port}`, { stdio: 'pipe' });
        busyPorts.push(port);
      } catch {
        // Port is free
      }
    }
    
    if (busyPorts.length > 0) {
      this.log(`⚠️  Ports ${busyPorts.join(', ')} are busy. Clearing...`, 'yellow');
      try {
        execSync('bun run clear-ports', { stdio: 'inherit' });
        this.log('✅ Ports cleared', 'green');
      } catch (error) {
        this.log('❌ Could not clear ports. Manual intervention needed.', 'red');
        return false;
      }
    }
    
    // 2. Check native modules
    try {
      const result = execSync('node scripts/pre-build-check.cjs 2>/dev/null', { encoding: 'utf8' });
      if (result.includes('✅ Native modules ready')) {
        this.log('✅ Native modules verified', 'green');
      } else {
        this.log('🔧 Fixing native modules...', 'yellow');
        execSync('bun run fix:native-modules', { stdio: 'inherit' });
      }
    } catch (error) {
      this.log('⚠️  Native module check failed, proceeding anyway', 'yellow');
    }
    
    // 3. Quick cleanup
    this.log('🧹 Quick cleanup...', 'blue');
    try {
      execSync('find . -name "*.tsbuildinfo" -delete 2>/dev/null || true', { stdio: 'pipe' });
      execSync('find . -name ".turbo" -type d -exec rm -rf {} + 2>/dev/null || true', { stdio: 'pipe' });
      this.log('✅ Quick cleanup complete', 'green');
    } catch {
      // Ignore cleanup errors
    }
    
    return true;
  }

  async buildFirst() {
    this.log(`🔨 Building all packages first...`, 'cyan');
    
    try {
      const { execSync } = require('child_process');
      execSync('bun run build', { 
        stdio: 'inherit',
        env: { 
          ...process.env, 
          BUILD_MEMORY_LIMIT: this.devStrategy.memoryLimit,
          TURBO_CONCURRENCY: this.devStrategy.concurrency.toString()
        }
      });
      this.log(`✅ Build completed successfully`, 'green');
      return true;
    } catch (error) {
      this.log(`⚠️  Build completed with warnings, continuing...`, 'yellow');
      return true; // Continue even if build has warnings
    }
  }

  async startServices() {
    const { name, services, memoryLimit, description } = this.devStrategy;
    const concurrency = services.length + 1;
    
    // First run build
    const buildSuccess = await this.buildFirst();
    if (!buildSuccess) {
      this.log(`❌ Build failed, cannot start development services`, 'red');
      return null;
    }
    
    this.log(`🚀 Starting development services...`, 'cyan');
    this.log(`📋 Strategy: ${description}`, 'blue');
    this.log(`⚙️  Services: ${services.join(', ')}`, 'blue');
    this.log(`🔧 Concurrency: ${concurrency}, Memory limit: ${memoryLimit}MB`, 'blue');
    this.log(`🎯 Main Interface: Browser Hub Electron App`, 'magenta');
    this.log('', 'reset');
    
    // Build filter string for Turbo
    const filters = services.map(service => `--filter=@the-new-fuse/${service}`).join(' ');
    
    // Set memory environment variables
    process.env.BUILD_MEMORY_LIMIT = memoryLimit;
    process.env.TURBO_CONCURRENCY = concurrency.toString();
    process.env.NODE_OPTIONS = `--max-old-space-size=${memoryLimit}`;
    
    // Start development servers
    const command = `turbo run dev ${filters}`;
    
    this.log(`🔄 Executing: ${command}`, 'cyan');
    this.log('', 'reset');
    
    try {
      const child = spawn('bun', ['exec', 'turbo', 'run', 'dev', ...filters.split(' ')], {
        stdio: 'inherit',
        env: { ...process.env }
      });
      
      // Handle graceful shutdown
      process.on('SIGINT', () => {
        this.log('\n🛑 Shutting down development servers...', 'yellow');
        child.kill('SIGTERM');
        setTimeout(() => {
          child.kill('SIGKILL');
        }, 5000);
      });
      
      child.on('close', (code) => {
        const duration = Math.round((Date.now() - this.startTime) / 1000);
        if (code === 0) {
          this.log(`✅ Development servers stopped cleanly after ${duration}s`, 'green');
        } else {
          this.log(`⚠️  Development servers exited with code ${code} after ${duration}s`, 'yellow');
          this.suggestTroubleshooting(code);
        }
      });
      
      return child;
      
    } catch (error) {
      this.log(`❌ Failed to start development servers: ${error.message}`, 'red');
      return null;
    }
  }

  suggestTroubleshooting(exitCode) {
    this.log('', 'reset');
    this.log('💡 Troubleshooting suggestions:', 'cyan');
    
    if (exitCode === 137) {
      this.log('  • Code 137 indicates memory pressure (SIGKILL)', 'yellow');
      this.log('  • Try: bun run dev:conservative (uses fewer services)', 'reset');
      this.log('  • Or: bun run clean:aggressive (free up memory)', 'reset');
    } else if (exitCode === 1) {
      this.log('  • Check for TypeScript errors: bun run type-check', 'reset');
      this.log('  • Verify ports are free: bun run clear-ports', 'reset');
      this.log('  • Try legacy mode: bun run dev:original', 'reset');
    }
    
    this.log('  • Full cleanup: bun run clean:aggressive', 'reset');
    this.log('  • System status: bun run build:status', 'reset');
  }

  async run() {
    this.log('🎯 Intelligent Development Server', 'cyan');
    this.log('🚀 Build-First Full Development Environment', 'magenta');
    this.log('='.repeat(50), 'cyan');
    this.log('', 'reset');
    
    // Display system information
    this.log('💻 System Information:', 'blue');
    this.log(`   Platform: ${this.systemInfo.platform} ${this.systemInfo.arch}`, 'reset');
    this.log(`   CPUs: ${this.systemInfo.cpus}`, 'reset');
    this.log(`   Memory: ${this.formatBytes(this.systemInfo.freeMem)} free / ${this.formatBytes(this.systemInfo.totalMem)} total`, 'reset');
    this.log(`   Usage: ${this.systemInfo.memoryUsage.toFixed(1)}%`, this.systemInfo.memoryUsage > 80 ? 'red' : 'reset');
    this.log('', 'reset');
    
    // Run preflight checks
    const preflightOk = await this.preflightChecks();
    if (!preflightOk) {
      this.log('❌ Preflight checks failed', 'red');
      process.exit(1);
    }
    
    this.log('', 'reset');
    
    // Start services
    const child = await this.startServices();
    if (!child) {
      process.exit(1);
    }
    
    // Keep process alive
    return new Promise((resolve) => {
      child.on('close', resolve);
    });
  }
}

// Handle different modes
const mode = process.argv[2];

if (mode === 'conservative') {
  const server = new IntelligentDevServer();
  server.devStrategy = {
    name: 'conservative',
    concurrency: 1,
    services: ['electron-desktop', 'api-gateway'],  // Browser Hub + essential API
    memoryLimit: '2048',
    description: 'Conservative mode - Browser Hub + essential services (forced)'
  };
  server.run().catch(console.error);
} else if (mode === 'balanced') {
  const server = new IntelligentDevServer();
  server.devStrategy = {
    name: 'balanced',
    concurrency: 2,
    services: ['electron-desktop', 'api-gateway', 'frontend-app'],  // Browser Hub + core services
    memoryLimit: '3072',
    description: 'Balanced mode - Browser Hub + core services (forced)'
  };
  server.run().catch(console.error);
} else {
  // Auto-detect mode
  const server = new IntelligentDevServer();
  server.run().catch(console.error);
}

module.exports = IntelligentDevServer;