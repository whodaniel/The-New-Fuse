#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const srcDir = path.join(__dirname, 'src');

let totalFiles = 0;
let totalChanges = 0;

function fixUnterminated(content) {
  let fixed = content;
  let changes = 0;

  // Fix unterminated string literals
  const patterns = [
    // Fix quotes and template literals
    [/([^\\])';$/, "$1';"],
    [/([^\\])";$/, '$1\";'],
    [/([^\\])`$/, '$1`;'],

    // Fix unterminated template literals at end of files
    [/\s*$/g, ''],

    // Fix broken parentheses
    [/String\(output\.content \?\? '\)';/, "String(output.content ?? '');"],
    [/summary\.push\('\);/, "summary.push('');"],
    [/return ';/, "return '';"],

    // Fix broken template literal expressions
    [/\$\{([^}]+)\}`\`/, '${$1}`'],
    [/\}\}`/, '}'],

    // Fix unterminated export statements
    [/export \* from\s*';$/, "export * from '';"],
    [/export \* from\s*"";$/, "export * from '';"],

    // Fix broken case statements and enums
    [/AgentStatus\["([^"]+)\]= "([^"]+)";/, 'AgentStatus["$1"] = "$2";'],
    [/AgentStatus\[([^"]+)\]="([^"]+);/, 'AgentStatus["$1"] = "$2";'],
    [/\["([^"]+)\]= "([^"]+)";;/, '["$1"] = "$2";'],

    // Fix broken function signatures
    [/\): Promise<([^>]+)>\s*\{/, '): Promise<$1> {'],

    // Fix template literal issues
    [/\`([^`]*)\$\{([^}]+)\}([^`]*)\`;/, '`$1${$2}$3`;'],

    // Fix broken comments
    [/\/\* .* \*\/";/, '/* ... */'],

    // Fix broken property assignments
    [/([a-zA-Z_][a-zA-Z0-9_]*): ([^,}]+),(\s*)/g, '$1: $2,$3'],
  ];

  patterns.forEach(([pattern, replacement]) => {
    const before = fixed;
    fixed = fixed.replace(pattern, replacement);
    if (fixed !== before) changes++;
  });

  return { content: fixed, changes };
}

function processFile(filePath) {
  try {
    if (!filePath.endsWith('.ts') && !filePath.endsWith('.tsx')) return;

    const content = fs.readFileSync(filePath, 'utf8');
    const result = fixUnterminated(content);

    if (result.changes > 0) {
      fs.writeFileSync(filePath, result.content, 'utf8');
      console.log(`Fixed ${result.changes} issues in ${path.relative(srcDir, filePath)}`);
      totalChanges += result.changes;
    }

    totalFiles++;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
  }
}

function walkDirectory(dir) {
  try {
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        walkDirectory(fullPath);
      } else if (stat.isFile()) {
        processFile(fullPath);
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error.message);
  }
}

console.log('Fixing unterminated strings and syntax issues...');
walkDirectory(srcDir);
console.log(`\nProcessed ${totalFiles} files with ${totalChanges} total fixes.`);
