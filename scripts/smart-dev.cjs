#!/usr/bin/env node

/**
 * Smart Development Script for The New Fuse
 * 
 * This script checks if `bun run build` has already been completed
 * before running `bun run dev`. It specifically checks if Theia IDE
 * has been built to avoid unnecessary rebuilds.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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
    log('\n🔨 Running full build...', 'yellow');
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

function runDev() {
    log('\n🚀 Starting development servers with browser hub integration...', 'blue');
    
    try {
        // Clear ports first
        log('🧹 Clearing ports...', 'blue');
        execSync('node scripts/clear-ports.js', { 
            stdio: 'inherit',
            cwd: process.cwd()
        });
        
        // Start all development servers including browser hub dependencies
        log('🚀 Starting all services (API Gateway, Theia IDE, Backend, Frontend, Electron)...', 'blue');
        log('📋 Services starting:', 'blue');
        log('   • API Gateway (port 3005) - Unified API endpoints', 'blue');
        log('   • Theia IDE (port 3007) - Development environment', 'blue');
        log('   • Backend API (port 3004) - Agent management', 'blue');
        log('   • Frontend App (port 3000) - Web dashboard', 'blue');
        log('   • Electron Desktop - Browser hub interface', 'blue');
        log('');
        
        execSync('turbo run dev --filter=@the-new-fuse/api-gateway --filter=@the-new-fuse/electron-desktop --filter=@the-new-fuse/theia-ide --filter=@the-new-fuse/backend-app --filter=@the-new-fuse/frontend-app --concurrency=1', { 
            stdio: 'inherit',
            cwd: process.cwd(),
            shell: true
        });
    } catch (error) {
        log('\n❌ Development servers failed to start!', 'red');
        console.error(error.message);
        process.exit(1);
    }
}

function main() {
    const buildOnly = process.argv.includes('--build-only');
    
    log(`${colors.bold}🚀 The New Fuse - Smart Development Script${colors.reset}`, 'blue');
    
    const buildStatus = checkBuildStatus();
    
    if (buildStatus.needsFullBuild) {
        log('\n⚠️  Required components are missing. Running full build first...', 'yellow');
        
        const buildSuccess = runBuild();
        if (!buildSuccess) {
            log('\n❌ Cannot proceed without successful build. Exiting.', 'red');
            process.exit(1);
        }
        
        if (buildOnly) {
            log('\n✅ Build completed. Exiting as requested.', 'green');
            process.exit(0);
        }
    } else if (buildStatus.hasBuilt) {
        log('\n✅ Build artifacts found. Skipping build step.', 'green');
        log(`Built components: ${buildStatus.builtComponents.join(', ')}`, 'green');
        
        if (buildStatus.missingComponents.length > 0) {
            log(`Missing components: ${buildStatus.missingComponents.join(', ')}`, 'yellow');
            log('These will be built during development if needed.', 'yellow');
        }
        
        if (buildOnly) {
            log('\n✅ Build check completed. Exiting as requested.', 'green');
            process.exit(0);
        }
    } else {
        log('\n⚠️  No build artifacts found. Running full build...', 'yellow');
        
        const buildSuccess = runBuild();
        if (!buildSuccess) {
            log('\n❌ Cannot proceed without successful build. Exiting.', 'red');
            process.exit(1);
        }
        
        if (buildOnly) {
            log('\n✅ Build completed. Exiting as requested.', 'green');
            process.exit(0);
        }
    }
    
    // Run dev servers unless build-only was requested
    if (!buildOnly) {
        runDev();
        
        // Check service readiness after a brief delay
        setTimeout(() => {
            checkServiceReadiness();
        }, 5000);
    }
}

// Service readiness check function
async function checkServiceReadiness() {
    const services = [
        { name: 'API Gateway', url: 'http://localhost:3005/health', port: 3005 },
        { name: 'Theia IDE', url: 'http://localhost:3007', port: 3007 },
        { name: 'Backend API', url: 'http://localhost:3004/api/agents', port: 3004 },
        { name: 'Frontend App', url: 'http://localhost:3000', port: 3000 }
    ];
    
    log('\n🔍 Checking service readiness...', 'blue');
    
    for (const service of services) {
        try {
            // Simple port check using netstat-like approach
            const { execSync: syncExec } = require('child_process');
            syncExec(`lsof -i :${service.port}`, { stdio: 'pipe' });
            log(`  ✅ ${service.name} (port ${service.port}) - Process detected`, 'green');
        } catch (error) {
            log(`  ⚠️  ${service.name} (port ${service.port}) - Not yet ready`, 'yellow');
        }
    }
    
    log('\n💡 Services are starting up. The browser hub will connect automatically.', 'blue');
    log('📋 Access services at:', 'blue');
    log('   • Browser Hub: Electron app will launch automatically', 'blue');
    log('   • API Gateway: http://localhost:3005', 'blue');
    log('   • Theia IDE: http://localhost:3007', 'blue');
    log('   • Backend API: http://localhost:3004', 'blue');
    log('   • Frontend App: http://localhost:3000', 'blue');
}

// Handle process interruption gracefully
process.on('SIGINT', () => {
    log('\n\n👋 Development servers stopped.', 'yellow');
    process.exit(0);
});

process.on('SIGTERM', () => {
    log('\n\n👋 Development servers stopped.', 'yellow');
    process.exit(0);
});

// Run the main function
main();