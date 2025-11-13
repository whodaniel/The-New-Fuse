#!/usr/bin/env node

/**
 * VS Code Extension Migration Analysis Script
 * Compares old-vscode-extension with new vscode-extension
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OLD_EXT_PATH = path.join(__dirname, 'old-vscode-extension');
const NEW_EXT_PATH = path.join(__dirname, 'vscode-extension');

// Function to recursively get all .ts files
function getTsFiles(dir, basePath = '') {
    const files = [];
    try {
        const items = fs.readdirSync(dir);
        for (const item of items) {
            const fullPath = path.join(dir, item);
            const relativePath = path.join(basePath, item);
            
            if (fs.statSync(fullPath).isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
                files.push(...getTsFiles(fullPath, relativePath));
            } else if (item.endsWith('.ts') && !item.endsWith('.d.ts')) {
                files.push(relativePath);
            }
        }
    } catch (error) {
        console.warn(`Warning: Could not read directory ${dir}`);
    }
    return files;
}

// Function to extract commands from package.json
function extractCommands(packageJsonPath) {
    try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        return packageJson.contributes?.commands || [];
    } catch (error) {
        console.warn(`Warning: Could not read package.json at ${packageJsonPath}`);
        return [];
    }
}


// Main analysis
console.log('🔍 VS Code Extension Migration Analysis');
console.log('=====================================\n');

// 1. Compare package.json commands
console.log('📦 COMMAND COMPARISON');
console.log('-'.repeat(50));

const oldCommands = extractCommands(path.join(OLD_EXT_PATH, 'package.json'));
const newCommands = extractCommands(path.join(NEW_EXT_PATH, 'package.json'));

console.log(`Old Extension Commands (${oldCommands.length}):`);
oldCommands.forEach(cmd => {
    console.log(`  - ${cmd.command} (${cmd.title})`);
});

console.log(`\nNew Extension Commands (${newCommands.length}):`);
newCommands.forEach(cmd => {
    console.log(`  - ${cmd.command} (${cmd.title})`);
});

// Find missing commands
const oldCommandIds = oldCommands.map(c => c.command);
const newCommandIds = newCommands.map(c => c.command);
const missingCommands = oldCommandIds.filter(id => !newCommandIds.includes(id));

console.log(`\n⚠️  Commands in OLD but not in NEW (${missingCommands.length}):`);
missingCommands.forEach(cmd => console.log(`  - ${cmd}`));

// 2. Compare file structure
console.log('\n📁 FILE STRUCTURE COMPARISON');
console.log('-'.repeat(50));

const oldTsFiles = getTsFiles(path.join(OLD_EXT_PATH, 'src'));
const newTsFiles = getTsFiles(path.join(NEW_EXT_PATH, 'src'));

console.log(`Old Extension TypeScript Files (${oldTsFiles.length}):`);
oldTsFiles.slice(0, 10).forEach(file => console.log(`  - ${file}`));
if (oldTsFiles.length > 10) console.log(`  ... and ${oldTsFiles.length - 10} more`);

console.log(`\nNew Extension TypeScript Files (${newTsFiles.length}):`);
newTsFiles.forEach(file => console.log(`  - ${file}`));

// Find files that exist in old but not in new
const missingFiles = oldTsFiles.filter(file => {
    // Check if a similar file exists in new structure
    const fileName = path.basename(file);
    return !newTsFiles.some(newFile => path.basename(newFile) === fileName);
});

console.log(`\n⚠️  Files in OLD but not in NEW (${missingFiles.length}):`);
missingFiles.slice(0, 20).forEach(file => console.log(`  - ${file}`));
if (missingFiles.length > 20) console.log(`  ... and ${missingFiles.length - 20} more`);

// 3. Compare key directories
console.log('\n📂 DIRECTORY ANALYSIS');
console.log('-'.repeat(50));

const keyDirectories = ['llm', 'mcp', 'services', 'types', 'views'];
keyDirectories.forEach(dir => {
    const oldDirPath = path.join(OLD_EXT_PATH, 'src', dir);
    const newDirPath = path.join(NEW_EXT_PATH, 'src', dir);
    
    const oldExists = fs.existsSync(oldDirPath);
    const newExists = fs.existsSync(newDirPath);
    
    console.log(`${dir}/:`);
    console.log(`  Old: ${oldExists ? '✅ EXISTS' : '❌ MISSING'}`);
    console.log(`  New: ${newExists ? '✅ EXISTS' : '❌ MISSING'}`);
    
    if (oldExists && newExists) {
        const oldFiles = fs.readdirSync(oldDirPath).filter(f => f.endsWith('.ts'));
        const newFiles = fs.readdirSync(newDirPath).filter(f => f.endsWith('.ts'));
        console.log(`  Files: ${oldFiles.length} → ${newFiles.length}`);
    }
});

console.log('\n✅ Analysis Complete!');
console.log('\nNext Steps:');
console.log('1. Review missing commands and determine if they should be migrated');
console.log('2. Check missing files for important functionality');
console.log('3. Verify that key features are properly implemented in new structure');
console.log('4. Update VSCODE-EXTENSION-MIGRATION-CHECKLIST.md with findings');
