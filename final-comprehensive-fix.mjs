#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

function findTypescriptFiles(dir, files = []) {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
        const fullPath = path.join(dir, item);
        try {
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules' && item !== 'dist') {
                findTypescriptFiles(fullPath, files);
            } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
                files.push(fullPath);
            }
        } catch (error) {
            // Skip files we can't read
            continue;
        }
    }
    
    return files;
}

function fixRemainingErrors(content, filePath) {
    let fixed = content;
    let changes = [];
    
    const lines = fixed.split('\n');
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        const originalLine = line;
        
        // Fix 1: String literal issues - missing quotes in property values
        line = line.replace(/:\s*([a-zA-Z_]\w*)'(\s*[,;])/g, ": '$1'$2");
        
        // Fix 2: Redis zadd/zrem calls with incorrect syntax
        line = line.replace(/\.zrem\('([^']+):\s*'([^']+)',/g, ".zrem('$1:$2',");
        line = line.replace(/\.zadd\('([^']+):\s*'([^']+)',/g, ".zadd('$1:$2',");
        
        // Fix 3: Object property syntax errors
        line = line.replace(/(\w+):\s*([a-zA-Z_]\w*)'(\s*[,}])/g, '$1: \'$2\'$3');
        
        // Fix 4: Template literal issues
        line = line.replace(/`([^`]*)\$\{([^}]+)\}([^`]*)'([^']*)/g, "`$1\${$2}$3'$4");
        
        // Fix 5: Function parameter syntax
        line = line.replace(/\(([^:,)]+):\s*([a-zA-Z_]\w*)'(\s*[,)])/g, '($1: \'$2\'$3');
        
        // Fix 6: Enum value syntax
        line = line.replace(/z\.enum\(\['([^']+)',\s*([A-Z_]+)'\]\)/g, "z.enum(['$1', '$2'])");
        
        // Fix 7: Missing closing quotes in variable assignments
        line = line.replace(/=\s*([a-zA-Z_]\w*)'(\s*[,;])/g, "= '$1'$2");
        
        // Fix 8: Function call with missing quotes
        line = line.replace(/\(([^'"][^,)]*)'(\s*[,)])/g, "('$1'$2");
        
        if (line !== originalLine) {
            lines[i] = line;
            changes.push(`Fixed syntax on line ${i + 1}`);
        }
    }
    fixed = lines.join('\n');
    
    return { content: fixed, changes };
}

// Process all files in the core package
const coreDir = '/Users/<owner>/Desktop/A1-Inter-LLM-Com/The New Fuse/packages/core/src';
const allFiles = findTypescriptFiles(coreDir);

console.log(`🔧 Final comprehensive fix: Processing ${allFiles.length} TypeScript files...`);

let totalFixed = 0;
const errorFiles = [];

for (const file of allFiles) {
    try {
        const content = fs.readFileSync(file, 'utf8');
        const result = fixRemainingErrors(content, file);
        
        if (result.changes.length > 0) {
            fs.writeFileSync(file, result.content);
            console.log(`✅ Fixed ${path.basename(file)}: ${result.changes.length} issues`);
            totalFixed++;
        }
    } catch (error) {
        console.error(`❌ Error processing ${file}:`, error.message);
        errorFiles.push({ file, error: error.message });
    }
}

console.log(`\n📊 Final Fix Summary:`);
console.log(`   - Files processed: ${allFiles.length}`);
console.log(`   - Files fixed: ${totalFixed}`);
console.log(`   - Errors: ${errorFiles.length}`);

console.log('\n🏁 Final comprehensive TypeScript fix complete!');
