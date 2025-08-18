#!/usr/bin/env node

/**
 * Memory-Optimized Development Script
 * Uses the build optimization system for memory-efficient development builds
 */

const { BuildOrchestrator, SystemResourceDetector, MemoryMonitor } = require('@tnf/build-optimization');
const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

// ANSI color codes for better output
const colors = {
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    red: '\x1b[31m',
    reset: '\x1b[0m',
    bold: '\x1b[1m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkBuildStatus() {
    const buildMarkers = [
        {
            name: 'Theia IDE',
            path: 'apps/theia-ide/lib/build-info.json',
            required: true
        },
        {
            name: 'API Gateway',
            path: 'apps/api-gateway/dist',
            required: false
        },
        {
            name: 'Frontend App',
            path: 'apps/frontend/dist',
            required: false
        },
        {
            name: 'Electron Desktop',
            path: 'apps/electron-desktop/dist',
            required: false
        }
    ];

    const buildStatus = {
        hasBuilt: false,
        builtComponents: [],
        missingComponents: [],
        needsFullBuild: false
    };

    log('\n🔍 Checking build status...', 'blue');

    for (const marker of buildMarkers) {
        const fullPath = path.join(process.cwd(), marker.path);
        const exists = fs.existsSync(fullPath);
        
        if (exists) {
            buildStatus.builtComponents.push(marker.name);
            
            // Check if it's a JSON file with build info
            if (marker.path.endsWith('.json')) {
                try {
                    const buildInfo = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
                    log(`  ✅ ${marker.name} - Built on ${buildInfo.timestamp}`, 'green');
                } catch (e) {
                    log(`  ✅ ${marker.name} - Built (no timestamp)`, 'green');
                }
            } else {
                log(`  ✅ ${marker.name} - Built`, 'green');
            }
        } else {
            buildStatus.missingComponents.push(marker.name);
            log(`  ❌ ${marker.name} - Not built`, 'red');
            
            if (marker.required) {
                buildStatus.needsFullBuild = true;
            }
        }
    }

    buildStatus.hasBuilt = buildStatus.builtComponents.length > 0;
    
    return buildStatus;
}

function runBuild() {
    log('\n🔨 Running memory-optimized build...', 'yellow');
    log('This includes building Theia IDE which may take a few minutes...', 'yellow');
    
    try {
        execSync('bun run build', { 
            stdio: 'inherit',
            cwd: process.cwd()
        });
        log('\n✅ Build completed successfully!', 'green');
        return true;
    } catch (error) {
        log('\n❌ Build failed!', 'red');
        console.error(error.message);
        return false;
    }
}

// Wait for Theia to be fully ready
async function waitForTheiaReady() {
  const maxAttempts = 30; // 30 attempts = 60 seconds max wait
  const delay = 2000; // 2 seconds between attempts
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      // Check if Theia server is responding
      const response = await fetch('http://localhost:3007', { 
        method: 'GET',
        timeout: 5000 
      });
      
      if (response.ok) {
        console.log('✅ Theia IDE is fully functional and ready!');
        return true;
      }
    } catch (error) {
      // Theia not ready yet
    }
    
    console.log(`⏳ Waiting for Theia IDE... (attempt ${attempt}/${maxAttempts})`);
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  
  console.warn('⚠️  Theia IDE may not be fully ready, but continuing...');
  return false;
}

// Service readiness check function
async function checkServiceReadiness() {
    const services = [
        { name: 'API Gateway', port: 3005 },
        { name: 'Backend API', port: 3004 },
        { name: 'Frontend App', port: 3000 },
        { name: 'Theia IDE', port: 3007 },
        { name: 'Electron Desktop', port: null }
    ];
    
    log('\n🔍 Checking service readiness...', 'blue');
    
    for (const service of services) {
        if (service.port) {
            try {
                execSync(`lsof -i :${service.port}`, { stdio: 'pipe' });
                log(`  ✅ ${service.name} (port ${service.port}) - Process detected`, 'green');
            } catch (error) {
                log(`  ⚠️  ${service.name} (port ${service.port}) - Not yet ready`, 'yellow');
            }
        } else {
            log(`  ✅ ${service.name} - Will launch automatically`, 'green');
        }
    }
    
    log('\n💡 Services are starting up with memory optimization.', 'blue');
    log('📋 Access services at:', 'blue');
    log('   • API Gateway: http://localhost:3005', 'blue');
    log('   • Backend API: http://localhost:3004', 'blue');
    log('   • Frontend App: http://localhost:3000', 'blue');
    log('   • Theia IDE: http://localhost:3007', 'blue');
    log('   • Browser Hub: Electron app will launch automatically', 'blue');
}

async function main() {
  console.log('🚀 Starting memory-optimized development environment...');
  
  try {
    // Check build status first (similar to smart-dev.cjs)
    const buildStatus = checkBuildStatus();
    
    if (buildStatus.needsFullBuild) {
      console.log('\n⚠️  Required components are missing. Running yarn-based Theia build first...');
      
      // Use the optimized build for Theia
      try {
        execSync('./scripts/build-with-yarn-theia.sh', { 
          stdio: 'inherit',
          cwd: process.cwd()
        });
        log('\n✅ Optimized Theia build completed successfully!', 'green');
      } catch (error) {
        log('\n❌ Optimized Theia build failed!', 'red');
        console.error(error.message);
        process.exit(1);
      }
    } else if (buildStatus.hasBuilt) {
      console.log('\n✅ Build artifacts found. Proceeding with development servers.');
      console.log(`Built components: ${buildStatus.builtComponents.join(', ')}`);
      
      // Verify Theia is actually functional
      try {
        execSync('node scripts/verify-theia-build.cjs', { 
          stdio: 'inherit',
          cwd: process.cwd()
        });
      } catch (error) {
        log('\n⚠️  Theia build verification failed, rebuilding...', 'yellow');
        execSync('./scripts/build-with-yarn-theia.sh', { 
          stdio: 'inherit',
          cwd: process.cwd()
        });
      }
    }

    // Clear ports first
    console.log('🧹 Clearing ports...');
    const clearPorts = spawn('node', ['scripts/clear-ports.js'], {
      stdio: 'inherit',
      cwd: path.resolve(__dirname, '..')
    });
    
    await new Promise((resolve, reject) => {
      clearPorts.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`Port clearing failed with code ${code}`));
      });
    });

    // Detect system resources
    const detector = SystemResourceDetector.getInstance();
    const systemResources = await detector.getSystemResources();
    console.log(`📊 System Resources:`, {
      totalMemory: `${Math.round(systemResources.totalMemory / 1024)}GB`,
      availableMemory: `${Math.round(systemResources.availableMemory / 1024)}GB`,
      cpuCores: systemResources.cpuCores
    });

    // Initialize memory monitor
    const memoryMonitor = new MemoryMonitor();
    memoryMonitor.setThreshold(80); // 80% memory threshold
    
    memoryMonitor.onThresholdExceeded(() => {
      console.warn('⚠️  Memory usage high! Consider reducing concurrent processes.');
    });

    await memoryMonitor.startMonitoring();

    // Determine optimal development strategy
    const orchestrator = new BuildOrchestrator();
    const strategy = await orchestrator.determineOptimalStrategy(systemResources);
    
    // Adjust strategy for development (lower concurrency, faster feedback)
    const devStrategy = {
      ...strategy,
      maxConcurrency: Math.max(Math.min(strategy.maxConcurrency, 6), 6), // Min 6, Cap at 6 for dev (we need at least 6 for 5 services)
      memoryThreshold: strategy.memoryThreshold * 0.8 // Use 80% of threshold for dev
    };

    console.log(`🎯 Development strategy: ${devStrategy.name}`);
    console.log(`   - Max concurrency: ${devStrategy.maxConcurrency}`);
    console.log(`   - Memory threshold: ${devStrategy.memoryThreshold}MB`);

    // Set environment variables
    process.env.BUILD_MEMORY_LIMIT = devStrategy.memoryThreshold.toString();
    process.env.BUILD_CONCURRENCY = devStrategy.maxConcurrency.toString();
    process.env.BUILD_ENABLE_MONITORING = 'true';
    process.env.NODE_ENV = 'development';

    // Start services in stages to ensure Theia is ready before Browser Hub
    console.log('📋 Starting services in optimized sequence:');
    console.log('   Stage 1: Core services (API Gateway, Backend, Frontend)');
    console.log('   Stage 2: Theia IDE (ensuring full functionality)');
    console.log('   Stage 3: Browser Hub (after Theia is ready)');
    
    // Stage 1: Start core services first
    const coreServices = [
      'turbo', 'run', 'dev',
      '--filter=@the-new-fuse/api-gateway',
      '--filter=@the-new-fuse/backend-app',
      '--filter=@the-new-fuse/frontend-app',
      `--concurrency=4`
    ];
    
    console.log(`🔨 Stage 1: Starting core services...`);
    const coreProcess = spawn(coreServices[0], coreServices.slice(1), {
      stdio: 'inherit',
      cwd: path.resolve(__dirname, '..'),
      env: { ...process.env }
    });
    
    // Wait for core services to stabilize
    await new Promise(resolve => setTimeout(resolve, 8000));
    
    // Stage 2: Start Theia IDE
    console.log(`🔨 Stage 2: Starting Theia IDE...`);
    const theiaProcess = spawn('turbo', ['run', 'dev', '--filter=@the-new-fuse/theia-ide'], {
      stdio: 'inherit',
      cwd: path.resolve(__dirname, '..'),
      env: { ...process.env }
    });
    
    // Wait for Theia to be fully ready
    console.log('⏳ Waiting for Theia IDE to be fully functional...');
    await waitForTheiaReady();
    
    // Stage 3: Start Browser Hub after Theia is ready
    console.log(`🔨 Stage 3: Starting Browser Hub...`);
    const hubProcess = spawn('turbo', ['run', 'dev', '--filter=@the-new-fuse/electron-desktop'], {
      stdio: 'inherit',
      cwd: path.resolve(__dirname, '..'),
      env: { ...process.env }
    });

    // Check service readiness after all stages
    setTimeout(() => {
      checkServiceReadiness();
    }, 3000);

    // Handle process termination
    const processes = [coreProcess, theiaProcess, hubProcess].filter(Boolean);
    
    process.on('SIGINT', async () => {
      console.log('\n🛑 Shutting down development environment...');
      
      // Stop memory monitoring
      await memoryMonitor.stopMonitoring();
      
      // Kill all processes
      processes.forEach(proc => {
        if (proc && !proc.killed) {
          proc.kill('SIGTERM');
        }
      });
      
      // Force cleanup after delay
      setTimeout(() => {
        processes.forEach(proc => {
          if (proc && !proc.killed) {
            proc.kill('SIGKILL');
          }
        });
        process.exit(0);
      }, 5000);
    });

    // Monitor all processes
    processes.forEach((proc, index) => {
      if (proc) {
        proc.on('close', async (code) => {
          console.log(`Process ${index + 1} exited with code ${code}`);
          if (code !== 0) {
            console.log('🔄 A service failed, shutting down all services...');
            await memoryMonitor.stopMonitoring();
            processes.forEach(p => {
              if (p && !p.killed) p.kill('SIGTERM');
            });
            process.exit(code);
          }
        });
      }
    });

  } catch (error) {
    console.error('❌ Memory-optimized development failed:', error.message);
    
    // Fallback to original dev behavior
    console.log('🔄 Falling back to original development process...');
    try {
      const { execSync } = require('child_process');
      execSync('node scripts/smart-dev.cjs', { 
        stdio: 'inherit',
        cwd: path.resolve(__dirname, '..')
      });
    } catch (fallbackError) {
      console.error('❌ Fallback development also failed:', fallbackError.message);
      
      if (error.message.includes('out of memory') || error.message.includes('heap')) {
        console.log('💡 Memory-related failure detected. Try:');
        console.log('   - npm run dev:low-memory');
        console.log('   - Close other applications to free memory');
        console.log('   - Restart your system to clear memory leaks');
      }
      
      process.exit(1);
    }
  }
}

// Handle CLI arguments
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Memory-Optimized Development Script

Usage: node scripts/memory-optimized-dev.js [options]

Options:
  --memory-limit <mb>  Set memory limit in MB
  --concurrency <n>    Set max concurrency
  --services <list>    Comma-separated list of services to start
  --help, -h          Show this help message

Examples:
  node scripts/memory-optimized-dev.js
  node scripts/memory-optimized-dev.js --memory-limit=2048
  node scripts/memory-optimized-dev.js --services=api-gateway,frontend-app
`);
  process.exit(0);
}

main().catch(console.error);