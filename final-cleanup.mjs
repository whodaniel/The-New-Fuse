#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

function findTypescriptFiles(dir, files = []) {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules' && item !== 'dist') {
            findTypescriptFiles(fullPath, files);
        } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
            files.push(fullPath);
        }
    }
    
    return files;
}

function fixFinalSyntaxErrors(content, filePath) {
    let fixed = content;
    let changes = [];
    
    // Fix 1: Missing closing quotes in import statements
    fixed = fixed.replace(/from\s+'@the-new-fuse\/[^';]+;/g, (match) => {
        if (!match.includes("';")) {
            return match.replace(';', "';");
        }
        return match;
    });
    
    // Fix 2: Unterminated string literals
    const lines = fixed.split('\n');
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        const originalLine = line;
        
        // Fix Omit utility type syntax errors
        line = line.replace(/Omit<([^,]+),\s*'([^']+)'\s*\|\s*([^'>]+)'>/g, "Omit<$1, '$2' | '$3'>");
        
        // Fix single quote issues in type definitions
        line = line.replace(/:\s*([a-zA-Z_]\w*)'(\s*\|\s*[a-zA-Z_]\w*)'*/g, (match, firstType, rest) => {
            const allTypes = (firstType + "'" + rest).split('|').map(t => {
                const trimmed = t.trim().replace(/'/g, '');
                return `'${trimmed}'`;
            });
            return `: ${allTypes.join(' | ')}`;
        });
        
        // Fix object return statements with trailing quotes
        line = line.replace(/return\s+\{([^}]+)\}\s*';$/g, 'return {$1};');
        
        // Fix method calls with unterminated strings
        line = line.replace(/(\w+)\(`([^`]+)`\)\s*as\s+(\w+)'/g, '$1(`$2`) as $3');
        
        // Fix Redis hSet calls with missing quotes
        line = line.replace(/\.hSet\(`([^`]+)`,\s*([^,)]+)'/g, ".hSet(`$1`, '$2'");
        
        if (line !== originalLine) {
            lines[i] = line;
            changes.push(`Fixed syntax on line ${i + 1}`);
        }
    }
    fixed = lines.join('\n');
    
    // Fix 3: Fix import statement issues
    fixed = fixed.replace(/from\s+'@the-new-fuse\/[^']+(?<!')'/g, (match) => {
        if (match.endsWith("'")) return match;
        return match + "'";
    });
    
    // Fix 4: Fix incomplete object literals
    fixed = fixed.replace(/return\s+\{\s*\.\.\.([^,}]+),\s*\/\/[^\n]*\n\s*\}'/g, 'return {\n      ...$1\n    };');
    
    return { content: fixed, changes };
}

// Process all files in the core package
const coreDir = '/Users/<owner>/Desktop/A1-Inter-LLM-Com/The New Fuse/packages/core/src';
const allFiles = findTypescriptFiles(coreDir);

console.log(`🔧 Final cleanup: Processing ${allFiles.length} TypeScript files...`);

let totalFixed = 0;
let errorFiles = [];

for (const file of allFiles) {
    try {
        const content = fs.readFileSync(file, 'utf8');
        const result = fixFinalSyntaxErrors(content, file);
        
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

console.log(`\n📊 Final Cleanup Summary:`);
console.log(`   - Files processed: ${allFiles.length}`);
console.log(`   - Files fixed: ${totalFixed}`);
console.log(`   - Errors: ${errorFiles.length}`);

console.log('\n🏁 Final syntax cleanup complete!');
