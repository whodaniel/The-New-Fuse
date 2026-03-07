#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const srcDir = path.join(__dirname, 'src');

let totalFiles = 0;
let totalChanges = 0;

function fixTypeScriptSyntax(content) {
  let fixed = content;
  let changes = 0;

  // Fix broken imports
  const importFixes = [
    [
      /import\s+[^'"]*'([^']*?)tsx'[^']*;?/g,
      "import { SmartAPIGateway } from '../api-management/SmartAPIGateway';",
    ],
    [/import\s+chromadb'[^']*;?/g, "import { ChromaClient } from 'chromadb';"],
    [/import\s+redis'[^']*;?/g, "import Redis from 'redis';"],
    [
      /import\s+@pinecone-database\/pinecone'[^']*;?/g,
      "import { PineconeClient } from '@pinecone-database/pinecone';",
    ],
    [/import\s+events'[^']*;?/g, "import { EventEmitter } from 'events';"],
    [/import\s+;/g, ''],
    [/import\s+[^'"]*'[^'"]*'['"]\s*;?\s*$/gm, ''],
  ];

  importFixes.forEach(([pattern, replacement]) => {
    if (pattern.test(fixed)) {
      fixed = fixed.replace(pattern, replacement);
      changes++;
    }
  });

  // Fix template literals and strings
  const stringFixes = [
    [/([^"])""([^"])/g, '$1"$2'],
    [/([^'])''([^'])/g, "$1'$2"],
    [/""";/g, '";'],
    [/''';/g, "';"],
    [/\$\{([^}]+)\}/g, '${$1}'],
    [/returnawait/g, 'return await'],
    [/return([a-zA-Z])/g, 'return $1'],
    [/\}\}/g, '}'],
    [/casepinecone":/g, 'case "pinecone":'],
    [/case(\w+)":?/g, 'case "$1":'],
  ];

  stringFixes.forEach(([pattern, replacement]) => {
    if (pattern.test(fixed)) {
      fixed = fixed.replace(pattern, replacement);
      changes++;
    }
  });

  // Fix syntax issues
  const syntaxFixes = [
    [/;\s*(['"]);/g, '$1;'],
    [/,([^'\s"])/g, ', $1'],
    [/}\s*;?\s*export\s+interface/g, '}\n\nexport interface'],
    [/}\s*;?\s*export\s+class/g, '}\n\nexport class'],
    [/async\s+(\w+)\(/g, 'async $1('],
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

    const content = fs.readFileSync(filePath, 'utf8');
    const result = fixTypeScriptSyntax(content);

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

console.log('Starting syntax fixes...');
walkDirectory(srcDir);
console.log(`\nProcessed ${totalFiles} files with ${totalChanges} total fixes.`);
