#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const srcDir = path.join(__dirname, 'src');

let totalFiles = 0;
let totalChanges = 0;

function fixAdvancedSyntaxIssues(content) {
  let fixed = content;
  let changes = 0;

  // Fix remaining import issues
  const importPatterns = [
    [
      /import\s+([^'"]*?)'([^'"]*?)tsx'[^'"]*;?/g,
      "import { SmartAPIGateway } from '../api-management/SmartAPIGateway';",
    ],
    [/import\s+;[\s\n]*/g, ''],
    [/import\s+[^'"]*'[^'"]*'['"]\s*;?\s*$/gm, ''],
  ];

  importPatterns.forEach(([pattern, replacement]) => {
    if (pattern.test(fixed)) {
      fixed = fixed.replace(pattern, replacement);
      changes++;
    }
  });

  // Fix template literal issues - more comprehensive
  const templateFixes = [
    [/`([^`]*)\$\{([^}]+)\}([^`]*)`\s*\)\s*;/g, '`$1${$2}$3`);'],
    [/`([^`]*)\$\{([^}]+)\}([^`]*)`\s*`/g, '`$1${$2}$3`'],
    [/\$\{([^}]+)\}\s*`\s*`/g, '${$1}`'],
    [/`([^`]*)\$\{([^}]+)\}([^`]*)`\s*"\s*;/g, '`$1${$2}$3`;'],
    [/`([^`]*)\$\{([^}]+)\}([^`]*)`\s*'\s*;/g, '`$1${$2}$3`;'],
  ];

  templateFixes.forEach(([pattern, replacement]) => {
    if (pattern.test(fixed)) {
      fixed = fixed.replace(pattern, replacement);
      changes++;
    }
  });

  // Fix string literal issues
  const stringFixes = [
    [/([^"])""([^"])/g, '$1"$2'],
    [/([^'])''([^'])/g, "$1'$2"],
    [/""";/g, '";'],
    [/''';/g, "';"],
    [/"([^"]*)""/g, '"$1"'],
    [/'([^']*)''/g, "'$1'"],
  ];

  stringFixes.forEach(([pattern, replacement]) => {
    if (pattern.test(fixed)) {
      fixed = fixed.replace(pattern, replacement);
      changes++;
    }
  });

  // Fix function/method syntax
  const functionFixes = [
    [/returnawait/g, 'return await'],
    [/return([a-zA-Z])/g, 'return $1'],
    [/return\s+([^;]+)\s*";/g, 'return $1;'],
    [/async\s+(\w+)\(/g, 'async $1('],
    [/\)\s*:\s*Promise<([^>]+)>\s*\{/g, '): Promise<$1> {'],
  ];

  functionFixes.forEach(([pattern, replacement]) => {
    if (pattern.test(fixed)) {
      fixed = fixed.replace(pattern, replacement);
      changes++;
    }
  });

  // Fix object/array syntax
  const objectFixes = [
    [/\{\s*([^:}]+)\s*:\s*([^,}]+)\s*,?\s*\}/g, '{ $1: $2 }'],
    [/,([^'\s"])/g, ', $1'],
    [/([^;])\s*;\s*(['"]);/g, '$1$2;'],
    [/}\s*;?\s*export\s+interface/g, '}\n\nexport interface'],
    [/}\s*;?\s*export\s+class/g, '}\n\nexport class'],
  ];

  objectFixes.forEach(([pattern, replacement]) => {
    if (pattern.test(fixed)) {
      fixed = fixed.replace(pattern, replacement);
      changes++;
    }
  });

  // Fix enum/switch statement issues
  const enumFixes = [
    [/case(\w+)":?/g, 'case "$1":'],
    [/casepinecone":/g, 'case "pinecone":'],
    [/case\s+([a-zA-Z_]+)\s*:/g, 'case "$1":'],
    [/(\w+)\["([^"]+)\]\s*=\s*"([^"]+)";/g, '$1["$2"] = "$3";'],
    [/(\w+)\[([A-Z_]+)\]\s*=\s*"([^"]+)";/g, '$1["$2"] = "$3";'],
  ];

  enumFixes.forEach(([pattern, replacement]) => {
    if (pattern.test(fixed)) {
      fixed = fixed.replace(pattern, replacement);
      changes++;
    }
  });

  // Fix common syntax errors
  const syntaxFixes = [
    [/\}\}/g, '}'],
    [/\s*\)\s*"\s*;/g, ');'],
    [/\s*\)\s*'\s*;/g, ');'],
    [/new\s+Map\(\)\s*;/g, 'new Map();'],
    [/new\s+Logger\(([^)]+)\)\s*;/g, 'new Logger($1);'],
  ];

  syntaxFixes.forEach(([pattern, replacement]) => {
    if (pattern.test(fixed)) {
      fixed = fixed.replace(pattern, replacement);
      changes++;
    }
  });

  return { content: fixed, changes };
}

function processFile(filePath) {
  try {
    if (!filePath.endsWith('.ts') && !filePath.endsWith('.tsx')) return;
    if (filePath.includes('_backup') || filePath.includes('_clean')) return;

    const content = fs.readFileSync(filePath, 'utf8');
    const result = fixAdvancedSyntaxIssues(content);

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

console.log('Starting advanced syntax fixes...');
walkDirectory(srcDir);
console.log(`\nProcessed ${totalFiles} files with ${totalChanges} total fixes.`);
