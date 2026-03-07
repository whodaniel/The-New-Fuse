#!/usr/bin/env node
/**
 * This script will scan TypeScript files for common syntax errors
 */
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { exec } from 'child_process';

const execPromise = promisify(exec);

// Patterns we want to search for
const PATTERNS = [
  // Malformed function signatures
  { pattern: /async\s+(\w+)\(\)\s*=>\s*Promise<[^>]+>\s*{([^:]+):\s*/g, description: 'Malformed async function signature' },
  
  // Malformed constructor/parameters
  { pattern: /(\w+)\s*\(\s*(.+?)\s*\):\s*(.+?)[\s,]/g, description: 'Malformed parameter type declaration' },
  
  // Malformed if statements
  { pattern: /if\(([^:]+):\s+unknown\)\s*{/g, description: 'Malformed if statement with type annotation' },
  
  // Missing spaces after if
  { pattern: /if\(/g, description: 'Missing space after if keyword' },
  
  // Malformed method calls
  { pattern: /this\.([^.]+)\.\(([^)]+)\)/g, description: 'Malformed method call' },
  
  // Promise type issues
  { pattern: /Promise<void>\s*{/g, description: 'Malformed Promise type' }
];

// Base directories to search
const BASE_DIRS = [
  'src',
  'packages'
];

// Find TypeScript files
async function findTsFiles() {
  try {
    const { stdout } = await execPromise(`find ${BASE_DIRS.join(' ')} -type f -name "*.tsx" -o -name "*.ts" | grep -v "node_modules" | grep -v ".d.ts"`);
    return stdout.trim().split('\n').filter(Boolean);
  } catch (error) {
    console.error('Error finding TypeScript files:', error);
    return [];
  }
}

// Check file for patterns
function checkFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let hasIssues = false;
    let issues = [];
    
    PATTERNS.forEach(({ pattern, description }) => {
      let match;
      // Reset regex to start from beginning
      pattern.lastIndex = 0; 
      
      while ((match = pattern.exec(content)) !== null) {
        hasIssues = true;
        const line = findLineNumber(content, match.index);
        issues.push({
          description,
          match: match[0],
          line
        });
      }
    });
    
    if (hasIssues) {
      console.log(`\n=== ${filePath} ===`);
      issues.forEach(issue => {
        console.log(`Line ${issue.line}: ${issue.description} - ${issue.match}`);
      });
    }
    
    return hasIssues;
  } catch (error) {
    console.error(`Error checking ${filePath}:`, error);
    return false;
  }
}

// Find line number for a position in the file
function findLineNumber(content, position) {
  const lines = content.substring(0, position).split('\n');
  return lines.length;
}

// Main function
async function main() {
  console.log('Scanning TypeScript files for syntax errors...\n');
  
  const files = await findTsFiles();
  console.log(`Found ${files.length} TypeScript files to check.`);
  
  let filesWithIssues = 0;
  
  files.forEach(file => {
    const hasIssues = checkFile(file);
    if (hasIssues) {
      filesWithIssues++;
    }
  });
  
  console.log(`\nScan complete. Found issues in ${filesWithIssues} files.`);
}

main();
