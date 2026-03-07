#!/usr/bin/env node

/**
 * Quick Build Status Checker
 * 
 * This script quickly checks if the build has been completed
 * without running any build or dev commands.
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes
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
            critical: true
        },
        {
            name: 'API Gateway',
            path: 'apps/api-gateway/dist',
            critical: false
        },
        {
            name: 'Frontend App',
            path: 'apps/frontend/dist',
            critical: false
        },
        {
            name: 'Electron Desktop',
            path: 'apps/electron-desktop/dist',
            critical: false
        }
    ];

    log(`${colors.bold}🔍 Build Status Check${colors.reset}`, 'blue');
    log('');

    let allCriticalBuilt = true;
    let totalBuilt = 0;

    for (const marker of buildMarkers) {
        const fullPath = path.join(process.cwd(), marker.path);
        const exists = fs.existsSync(fullPath);
        
        if (exists) {
            totalBuilt++;
            
            if (marker.path.endsWith('.json')) {
                try {
                    const buildInfo = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
                    log(`  ✅ ${marker.name} - Built on ${buildInfo.timestamp}`, 'green');
                } catch (e) {
                    log(`  ✅ ${marker.name} - Built`, 'green');
                }
            } else {
                log(`  ✅ ${marker.name} - Built`, 'green');
            }
        } else {
            log(`  ❌ ${marker.name} - Not built`, 'red');
            if (marker.critical) {
                allCriticalBuilt = false;
            }
        }
    }

    log('');
    
    if (allCriticalBuilt && totalBuilt > 0) {
        log('✅ Ready for development! You can run:', 'green');
        log('   bun run dev', 'green');
    } else if (totalBuilt > 0) {
        log('⚠️  Partial build detected. You can run:', 'yellow');
        log('   bun run dev (will build missing components)', 'yellow');
    } else {
        log('❌ No build detected. You need to run:', 'red');
        log('   bun run build', 'red');
        log('   bun run dev', 'red');
    }

    log('');
    log(`Build status: ${totalBuilt}/${buildMarkers.length} components built`, totalBuilt === buildMarkers.length ? 'green' : 'yellow');
    
    return {
        allCriticalBuilt,
        totalBuilt,
        totalComponents: buildMarkers.length
    };
}

// Run the check
const status = checkBuildStatus();
process.exit(status.allCriticalBuilt ? 0 : 1);