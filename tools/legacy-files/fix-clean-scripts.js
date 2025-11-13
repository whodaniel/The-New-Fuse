#!/usr/bin/env node
/**
 * Fix Destructive Clean Commands
 * Updates package.json clean scripts to be safe and non-destructive
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

function findPackageJsonFiles() {
    return glob.sync('**/package.json', {
        ignore: ['node_modules/**', 'dist/**', '.turbo/**']
    });
}

function updateCleanScript(packageJsonPath) {
    try {
        const content = fs.readFileSync(packageJsonPath, 'utf8');
        const packageJson = JSON.parse(content);
        
        if (!packageJson.scripts || !packageJson.scripts.clean) {
            return { updated: false, original: 'none' };
        }
        
        const originalClean = packageJson.scripts.clean;
        
        // Identify dangerous patterns
        const dangerousPatterns = [
            /rm\s+-rf\s+node_modules/,
            /rimraf\s+node_modules/,
            /rm\s+-rf\s+src/,
            /rimraf\s+src/,
            /rm\s+-rf\s+\.\w+/  // Hidden files/directories like .turbo
        ];
        
        // Safe clean command that only removes build outputs
        const safeClean = 'rimraf dist lib build coverage test-results playwright-report .tsbuildinfo tsconfig.tsbuildinfo';
        
        // Check if current clean command is problematic
        let isDangerous = false;
        for (const pattern of dangerousPatterns) {
            if (pattern.test(originalClean)) {
                isDangerous = true;
                break;
            }
        }
        
        // Also check for node_modules deletion
        if (originalClean.includes('node_modules')) {
            isDangerous = true;
        }
        
        if (isDangerous) {
            console.log(`⚠️  Fixing dangerous clean script in ${packageJsonPath}`);
            console.log(`   Original: ${originalClean}`);
            console.log(`   New:      ${safeClean}`);
            
            packageJson.scripts.clean = safeClean;
            
            fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
            
            return { updated: true, original: originalClean };
        }
        
        return { updated: false, original: originalClean };
        
    } catch (error) {
        console.error(`Error processing ${packageJsonPath}:`, error.message);
        return { updated: false, error: error.message };
    }
}

function main() {
    console.log('🔧 Fixing destructive clean commands...\n');
    
    const packageJsonFiles = findPackageJsonFiles();
    let fixedCount = 0;
    let totalCount = 0;
    
    for (const packageJsonPath of packageJsonFiles) {
        const result = updateCleanScript(packageJsonPath);
        
        if (result.updated) {
            fixedCount++;
        }
        
        if (result.original && result.original !== 'none') {
            totalCount++;
        }
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`   Total packages with clean scripts: ${totalCount}`);
    console.log(`   Fixed dangerous clean scripts: ${fixedCount}`);
    console.log(`   Safe packages: ${totalCount - fixedCount}`);
    
    if (fixedCount > 0) {
        console.log('\n✅ All destructive clean commands have been fixed!');
        console.log('\n📝 Changes made:');
        console.log('   - Removed node_modules deletion');
        console.log('   - Removed source file deletion');
        console.log('   - Kept only safe build output cleanup');
        console.log('\n🛡️ Your clean commands are now safe to use!');
    } else {
        console.log('\n✅ No dangerous clean commands found!');
    }
}

if (require.main === module) {
    main();
}