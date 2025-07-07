#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import {  // Fix switch statements
  fixed = fixed.replace(/case(\w+)":?/g, 'case "$1":');
  fixed = fixed.replace(/casepinecone":/g, 'case "pinecone":');

  // Fix spacing in function calls
  fixed = fixed.replace(/([a-zA-Z_$]\w*)\(/g, '$1(');
  fixed = fixed.replace(/,([^'\s"])/g, ', $1');

  // Fix broken template literal endings
  fixed = fixed.replace(/\}\}/g, '}');
  fixed = fixed.replace(/\$\{([^}]+)\}\`\`\)/g, '${$1})');

  // Fix broken function signatures
  fixed = fixed.replace(/async\s+(\w+)\(/g, 'async $1('); } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const srcDir = path.join(__dirname, 'src');

let totalFiles = 0;
let totalChanges = 0;

function fixTypeScriptSyntax(content) {
  let fixed = content;
  let changes = 0;

  // Fix broken imports
  fixed = fixed.replace(/import\s+([^'"]*?)'([^']*?)';?/g, (match, before, after) => {
    if (before.includes('../api-management/SmartAPIGateway.tsx')) {
      changes++;
      return "import { SmartAPIGateway } from '../api-management/SmartAPIGateway';";
    }
    if (before.includes('chromadb')) {
      changes++;
      return "import { ChromaClient } from 'chromadb';";
    }
    if (before.includes('redis')) {
      changes++;
      return "import Redis from 'redis';";
    }
    if (before.includes('@pinecone-database/pinecone')) {
      changes++;
      return "import { PineconeClient } from '@pinecone-database/pinecone';";
    }
    if (before.includes('events')) {
      changes++;
      return "import { EventEmitter } from 'events';";
    }
    return match;
  });

  // Fix broken import statements
  fixed = fixed.replace(/import\s+;/g, '');
  fixed = fixed.replace(/import\s+([^'"]*?)(['"]);?\s*$/gm, (match, before, quote) => {
    if (before.trim() === '') return '';
    changes++;
    return `import ${before}${quote};`;
  });

  // Fix template literals and string issues
  fixed = fixed.replace(/\$\{([^}]+)\}/g, '${$1}');
  fixed = fixed.replace(/([^`])\$\{/g, '$1`${');
  fixed = fixed.replace(/\}\`([^`])/g, '}`$1');

  // Fix broken string literals
  fixed = fixed.replace(/([^"])""([^"])/g, '$1"$2');
  fixed = fixed.replace(/([^'])''([^'])/g, "$1'$2");

  // Fix function parameters and object syntax
  fixed = fixed.replace(/(\w+):\s*([^,;}]+)[,;]?\s*([^}]*)}([^;])/g, '$1: $2$3}$4');

  // Fix return statements
  fixed = fixed.replace(/return([a-zA-Z])/g, 'return $1');
  fixed = fixed.replace(/returnawait/g, 'return await');

  // Fix common syntax issues
  fixed = fixed.replace(/;(['"]);/g, '$1;');
  fixed = fixed.replace(/([^;])\s*;\s*(['"]);/g, '$1$2;');

  // Fix broken object/interface definitions
  fixed = fixed.replace(/}\s*;?\s*export\s+interface/g, '}\n\nexport interface');
  fixed = fixed.replace(/}\s*;?\s*export\s+class/g, '}\n\nexport class');

  // Fix switch statements
  fixed = fixed.replace(/case(\w+)":?/g, 'case "$1":');
  fixed = fixed.replace/casepinecone":/g, 'case "pinecone":';

  // Fix spacing in function calls
  fixed = fixed.replace(/([a-zA-Z_$]\w*)\(/g, '$1(');
  fixed = fixed.replace/,([^'\s"])/g, ', $1';

  // Fix broken template literal endings
  fixed = fixed.replace(/\}\}/g, '}');
  fixed = fixed.replace(/\$\{([^}]+)\}\`\`\)/g, '${$1})');

  // Fix broken function signatures
  fixed = fixed.replace/async\s+(\w+)\(/g, 'async $1(');

  if (fixed !== content) {
    changes = (content.match(/[^a-zA-Z0-9]/g) || []).length - (fixed.match(/[^a-zA-Z0-9]/g) || []).length;
    if (changes < 0) changes = -changes;
    if (changes === 0) changes = 1; // At least one change
  }

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
}

console.log('Starting syntax fixes...');
walkDirectory(srcDir);
console.log(`\nProcessed ${totalFiles} files with ${totalChanges} total fixes.`);
