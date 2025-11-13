#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

// Find all TypeScript files recursively
function findTSFiles(dir, files = []) {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
            findTSFiles(fullPath, files);
        } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
            files.push(fullPath);
        }
    }
    
    return files;
}

// Fix common TypeScript errors
function fixTypeScriptErrors(content, filePath) {
    let fixed = content;
    let changes = [];
    
    // Fix 1: Double quotes in import statements (from ''module' -> from 'module')
    const doubleQuoteImportRegex = /from\s+''([^']+)'/g;
    const doubleQuoteMatches = [...fixed.matchAll(doubleQuoteImportRegex)];
    if (doubleQuoteMatches.length > 0) {
        fixed = fixed.replace(doubleQuoteImportRegex, "from '$1'");
        changes.push('Fixed double quotes in import statements');
    }
    
    // Fix 2: Union type syntax errors - more comprehensive approach
    const lines = fixed.split('\n');
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Fix union types with mixed quote patterns
        if (line.includes('!:') && line.includes("'") && line.includes('|')) {
            // Pattern: status!: active' | inactive' | error'
            const unionPattern = /([a-zA-Z_][a-zA-Z0-9_]*[!?]?):\s*([a-zA-Z_][a-zA-Z0-9_]*)'(\s*\|\s*[a-zA-Z_][a-zA-Z0-9_]*)'*/;
            const match = line.match(unionPattern);
            if (match) {
                // Extract the property name and the union types
                const propName = match[1];
                const restOfLine = line.substring(match.index + match[0].length);
                
                // Find all the union parts by splitting on |
                const beforeColon = line.substring(0, line.indexOf(':') + 1);
                const afterColon = line.substring(line.indexOf(':') + 1);
                
                // Extract union parts and fix quotes
                const unionParts = afterColon.split('|').map(part => {
                    const trimmed = part.trim().replace(/[';]/g, '');
                    return `'${trimmed}'`;
                });
                
                lines[i] = `${beforeColon} ${unionParts.join(' | ')};`;
                changes.push(`Fixed union type syntax on line ${i + 1}`);
            }
        }
        
        // Fix Column decorator syntax
        if (line.includes("@Column('") && line.includes(', {')) {
            const columnPattern = /@Column\('([^']+),\s*({[^}]+})\)/;
            const match = line.match(columnPattern);
            if (match) {
                lines[i] = line.replace(columnPattern, "@Column('$1', $2)");
                changes.push(`Fixed Column decorator syntax on line ${i + 1}`);
            }
        }
    }
    fixed = lines.join('\n');
    
    return { content: fixed, changes };
}

// Main execution
const rootDir = '/Users/<owner>/Desktop/A1-Inter-LLM-Com/The New Fuse';
const tsFiles = findTSFiles(rootDir);

console.log(`Found ${tsFiles.length} TypeScript files to check...`);

let totalFixed = 0;
let errorFiles = [];

for (const file of tsFiles) {
    try {
        const content = fs.readFileSync(file, 'utf8');
        const result = fixTypeScriptErrors(content, file);
        
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

console.log(`\n📊 Summary:`);
console.log(`   - Files processed: ${tsFiles.length}`);
console.log(`   - Files fixed: ${totalFixed}`);
console.log(`   - Errors: ${errorFiles.length}`);

if (errorFiles.length > 0) {
    console.log('\n❌ Files with errors:');
    errorFiles.forEach(({ file, error }) => {
        console.log(`   - ${file}: ${error}`);
    });
}

console.log('\n🎉 TypeScript error fixing complete!');
