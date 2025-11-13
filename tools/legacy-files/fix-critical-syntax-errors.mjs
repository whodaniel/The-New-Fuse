#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// Find all TypeScript files with specific patterns that cause issues
function findProblematicTSFiles(dir, files = []) {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules' && item !== 'dist') {
            findProblematicTSFiles(fullPath, files);
        } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
            files.push(fullPath);
        }
    }
    
    return files;
}

// Fix remaining critical TypeScript syntax errors
function fixCriticalSyntaxErrors(content, filePath) {
    let fixed = content;
    let changes = [];
    
    // Fix 1: Incorrect import statement quotes
    const doubleQuoteImports = /from\s+''([^']+)'/g;
    if (doubleQuoteImports.test(fixed)) {
        fixed = fixed.replace(doubleQuoteImports, "from '$1'");
        changes.push('Fixed double quote import statements');
    }
    
    // Fix 2: Split lines and fix each line
    const lines = fixed.split('\n');
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        const originalLine = line;
        
        // Fix logger.error calls with missing quotes
        line = line.replace(/logger\.error\('([^']+),\s*([^)]+)\)/, "logger.error('$1', $2)");
        
        // Fix union type declarations with single quotes issues
        line = line.replace(/:\s*([a-zA-Z_]\w*)'(\s*\|\s*[a-zA-Z_]\w*)'*/g, (match, firstType, rest) => {
            // Extract all types and wrap them properly
            const fullMatch = firstType + "'" + rest;
            const types = fullMatch.split('|').map(t => {
                const trimmed = t.trim().replace(/'/g, '');
                return `'${trimmed}'`;
            });
            return `: ${types.join(' | ')}`;
        });
        
        // Fix Column decorator syntax
        line = line.replace(/@Column\('([^']+),\s*({[^}]+})\)/, "@Column('$1', $2)");
        
        // Fix Omit utility type with missing quotes
        line = line.replace(/Omit<([^,]+),\s*'([^']+)'\s*\|\s*([^'>]+)'>/g, "Omit<$1, '$2' | '$3'>");
        
        // Fix incomplete string literals in template expressions
        line = line.replace(/\$\{([^}]+)\}([^'`]*)'([^']*)/g, "${$1}$2'$3");
        
        if (line !== originalLine) {
            lines[i] = line;
            changes.push(`Fixed syntax on line ${i + 1}`);
        }
    }
    fixed = lines.join('\n');
    
    // Fix 3: Handle specific problematic patterns
    // Fix missing quotes in array literals
    fixed = fixed.replace(/\[([a-zA-Z_]\w*)'(\s*,\s*[a-zA-Z_]\w*)'*\]/g, (match) => {
        const content = match.slice(1, -1); // Remove brackets
        const items = content.split(',').map(item => {
            const trimmed = item.trim().replace(/'/g, '');
            return `'${trimmed}'`;
        });
        return `[${items.join(', ')}]`;
    });
    
    return { content: fixed, changes };
}

// Get TypeScript compilation errors for a specific file
function getTypeScriptErrors(filePath) {
    try {
        const relativePath = path.relative('/Users/<owner>/Desktop/A1-Inter-LLM-Com/The New Fuse/packages/core', filePath);
        const result = execSync(`cd '/Users/<owner>/Desktop/A1-Inter-LLM-Com/The New Fuse/packages/core' && npx tsc --noEmit --skipLibCheck ${relativePath} 2>&1 || true`, { encoding: 'utf8' });
        return result;
    } catch (error) {
        return error.stdout || error.message;
    }
}

// Main execution
const coreDir = '/Users/<owner>/Desktop/A1-Inter-LLM-Com/The New Fuse/packages/core/src';
const tsFiles = findProblematicTSFiles(coreDir);

console.log(`🔍 Analyzing ${tsFiles.length} TypeScript files for critical syntax errors...`);

let totalFixed = 0;
let errorFiles = [];
let criticalFiles = [];

// First pass: identify files with the most critical errors
for (const file of tsFiles) {
    const errors = getTypeScriptErrors(file);
    if (errors && errors.includes('error TS')) {
        const errorCount = (errors.match(/error TS/g) || []).length;
        if (errorCount > 5) {
            criticalFiles.push({ file, errorCount });
        }
    }
}

// Sort by error count and fix the most problematic files first
criticalFiles.sort((a, b) => b.errorCount - a.errorCount);

console.log(`🎯 Found ${criticalFiles.length} files with critical errors. Fixing in order of severity...`);

// Fix critical files first
for (const { file, errorCount } of criticalFiles.slice(0, 10)) { // Fix top 10 most problematic
    try {
        console.log(`🔧 Fixing ${path.basename(file)} (${errorCount} errors)...`);
        
        const content = fs.readFileSync(file, 'utf8');
        const result = fixCriticalSyntaxErrors(content, file);
        
        if (result.changes.length > 0) {
            fs.writeFileSync(file, result.content);
            console.log(`✅ Fixed ${file}:`);
            result.changes.forEach(change => console.log(`   - ${change}`));
            totalFixed++;
        }
    } catch (error) {
        console.error(`❌ Error processing ${file}:`, error.message);
        errorFiles.push({ file, error: error.message });
    }
}

// Second pass: fix remaining files
console.log(`\n🔄 Second pass: fixing remaining files...`);

for (const file of tsFiles) {
    if (criticalFiles.some(cf => cf.file === file)) continue; // Skip already processed
    
    try {
        const content = fs.readFileSync(file, 'utf8');
        const result = fixCriticalSyntaxErrors(content, file);
        
        if (result.changes.length > 0) {
            fs.writeFileSync(file, result.content);
            totalFixed++;
        }
    } catch (error) {
        errorFiles.push({ file, error: error.message });
    }
}

console.log(`\n📊 Final Summary:`);
console.log(`   - Files processed: ${tsFiles.length}`);
console.log(`   - Files fixed: ${totalFixed}`);
console.log(`   - Critical files identified: ${criticalFiles.length}`);
console.log(`   - Errors: ${errorFiles.length}`);

// Test compilation one more time
console.log(`\n🧪 Testing TypeScript compilation...`);
try {
    const compileResult = execSync(`cd '/Users/<owner>/Desktop/A1-Inter-LLM-Com/The New Fuse/packages/core' && npx tsc --noEmit --skipLibCheck 2>&1 || true`, { encoding: 'utf8' });
    const remainingErrors = (compileResult.match(/error TS/g) || []).length;
    
    if (remainingErrors === 0) {
        console.log(`🎉 Success! No more TypeScript compilation errors!`);
    } else {
        console.log(`⚠️  ${remainingErrors} TypeScript errors still remain.`);
        console.log(`First few errors:`);
        console.log(compileResult.split('\n').slice(0, 10).join('\n'));
    }
} catch (error) {
    console.log(`❌ Compilation test failed:`, error.message);
}

console.log('\n🏁 Critical syntax error fixing complete!');
