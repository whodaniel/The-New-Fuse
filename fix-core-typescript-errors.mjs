#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

// Find all TypeScript files in the core package
function findTSFiles(dir, files = []) {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules' && item !== 'dist') {
            findTSFiles(fullPath, files);
        } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
            files.push(fullPath);
        }
    }
    
    return files;
}

// Fix advanced TypeScript syntax errors
function fixAdvancedTypeScriptErrors(content, filePath) {
    let fixed = content;
    let changes = [];
    
    // Fix 1: Union types with incorrect quotes (type: foo' | bar' -> type: 'foo' | 'bar')
    const badUnionTypeRegex = /(\w+):\s*([a-zA-Z_][a-zA-Z0-9_]*)'(\s*\|\s*[a-zA-Z_][a-zA-Z0-9_]*)'*/g;
    if (badUnionTypeRegex.test(fixed)) {
        fixed = fixed.replace(badUnionTypeRegex, (match, propName, firstType, rest) => {
            // Extract all types in the union
            const fullType = firstType + "'" + rest;
            const types = fullType.split('|').map(t => {
                const trimmed = t.trim().replace(/'/g, '');
                return `'${trimmed}'`;
            });
            return `${propName}: ${types.join(' | ')}`;
        });
        changes.push('Fixed union type syntax errors');
    }
    
    // Fix 2: String literals with incomplete quotes in specific patterns
    const lines = fixed.split('\n');
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        const originalLine = line;
        
        // Fix incomplete string literals in logger calls
        if (line.includes("logger.error('") && line.includes(", ") && !line.includes("', ")) {
            line = line.replace(/logger\.error\('([^']+), ([^)]+)\)/, "logger.error('$1', $2)");
        }
        
        // Fix type annotations with pattern: type:word' | word' | word'
        if (line.includes('type:') && line.includes("'") && line.includes('|')) {
            const typePattern = /type:\s*([a-zA-Z_][a-zA-Z0-9_]*)'(\s*\|\s*[a-zA-Z_][a-zA-Z0-9_]*)'*/;
            const match = line.match(typePattern);
            if (match) {
                const [fullMatch, firstType, rest] = match;
                // Split by | and fix each type
                const allTypes = (firstType + "'" + rest).split('|').map(t => {
                    const trimmed = t.trim().replace(/'/g, '');
                    return `'${trimmed}'`;
                });
                line = line.replace(fullMatch, `type: ${allTypes.join(' | ')}`);
            }
        }
        
        // Fix priority annotations with pattern: priority:word' | word' | word'
        if (line.includes('priority:') && line.includes("'") && line.includes('|')) {
            const priorityPattern = /priority:\s*([a-zA-Z_][a-zA-Z0-9_]*)'(\s*\|\s*[a-zA-Z_][a-zA-Z0-9_]*)'*/;
            const match = line.match(priorityPattern);
            if (match) {
                const [fullMatch, firstType, rest] = match;
                const allTypes = (firstType + "'" + rest).split('|').map(t => {
                    const trimmed = t.trim().replace(/'/g, '');
                    return `'${trimmed}'`;
                });
                line = line.replace(fullMatch, `priority: ${allTypes.join(' | ')}`);
            }
        }
        
        // Fix status annotations with pattern: status:word' | word' | word'
        if (line.includes('status:') && line.includes("'") && line.includes('|')) {
            const statusPattern = /status:\s*([a-zA-Z_][a-zA-Z0-9_]*)'(\s*\|\s*[a-zA-Z_][a-zA-Z0-9_]*)'*/;
            const match = line.match(statusPattern);
            if (match) {
                const [fullMatch, firstType, rest] = match;
                const allTypes = (firstType + "'" + rest).split('|').map(t => {
                    const trimmed = t.trim().replace(/'/g, '');
                    return `'${trimmed}'`;
                });
                line = line.replace(fullMatch, `status: ${allTypes.join(' | ')}`);
            }
        }
        
        // Fix any remaining property with union type pattern
        const generalUnionPattern = /(\w+):\s*([a-zA-Z_][a-zA-Z0-9_]*)'(\s*\|\s*[a-zA-Z_][a-zA-Z0-9_]*)'*/;
        const generalMatch = line.match(generalUnionPattern);
        if (generalMatch) {
            const [fullMatch, propName, firstType, rest] = generalMatch;
            const allTypes = (firstType + "'" + rest).split('|').map(t => {
                const trimmed = t.trim().replace(/'/g, '');
                return `'${trimmed}'`;
            });
            line = line.replace(fullMatch, `${propName}: ${allTypes.join(' | ')}`);
        }
        
        if (line !== originalLine) {
            lines[i] = line;
            changes.push(`Fixed syntax on line ${i + 1}`);
        }
    }
    fixed = lines.join('\n');
    
    // Fix 3: Missing quotes in template literals and strings
    fixed = fixed.replace(/`([^`]*)\$\{([^}]+)\}([^`]*)'([^']*)/g, "`$1\${$2}$3'$4");
    
    return { content: fixed, changes };
}

// Main execution for core package
const coreDir = '/Users/<owner>/Desktop/A1-Inter-LLM-Com/The New Fuse/packages/core/src';
const tsFiles = findTSFiles(coreDir);

console.log(`Found ${tsFiles.length} TypeScript files in core package...`);

let totalFixed = 0;
let errorFiles = [];

for (const file of tsFiles) {
    try {
        const content = fs.readFileSync(file, 'utf8');
        const result = fixAdvancedTypeScriptErrors(content, file);
        
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

console.log(`\n📊 Core Package Summary:`);
console.log(`   - Files processed: ${tsFiles.length}`);
console.log(`   - Files fixed: ${totalFixed}`);
console.log(`   - Errors: ${errorFiles.length}`);

if (errorFiles.length > 0) {
    console.log('\n❌ Files with errors:');
    errorFiles.forEach(({ file, error }) => {
        console.log(`   - ${file}: ${error}`);
    });
}

console.log('\n🎉 Core package TypeScript error fixing complete!');
