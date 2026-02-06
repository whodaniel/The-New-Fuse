#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let totalFilesProcessed = 0;
let totalFixesApplied = 0;

function fixQuotesInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    let fixesInFile = 0;

    // More comprehensive fix patterns
    const fixes = [
      // Fix unterminated imports
      { pattern: /import\s+([^'"`]*?)(['"]);$/gm, replacement: 'import "$1";' },
      { pattern: /from\s+([^'"`]*?)(['"]);$/gm, replacement: 'from "$1";' },
      { pattern: /import\s+([^'"`]*?);$/gm, replacement: 'import "$1";' },
      { pattern: /from\s+([^'"`]*?);$/gm, replacement: 'from "$1";' },

      // Fix comment corruption
      { pattern: /\/\*\*;/g, replacement: '/**' },
      { pattern: /\*\//g, replacement: '*/' },
      { pattern: /\/\*([^*])/g, replacement: '/*$1' },

      // Fix function and variable declarations
      {
        pattern: /export\s+function\s+([^(]+)\(([^)]*)\):\s*([^{]+)\s*\{/g,
        replacement: 'export function $1($2): $3 {',
      },
      {
        pattern: /function\s+([^(]+)\(([^)]*)\):\s*([^{]+)\s*\{/g,
        replacement: 'function $1($2): $3 {',
      },

      // Fix object syntax
      {
        pattern: /typeof\s+([^=]+)\s*===\s*"object\s*&&/g,
        replacement: 'typeof $1 === "object" &&',
      },
      {
        pattern: /typeof\s+([^=]+)\s*===\s*"([^"]*)\s*&&/g,
        replacement: 'typeof $1 === "$2" &&',
      },

      // Fix array method chaining
      { pattern: /\.\s*filter\([^)]*\);\s*\./g, replacement: '.filter($&).' },
      { pattern: /\.\s*map\([^)]*\);\s*\./g, replacement: '.map($&).' },
      { pattern: /\.\s*join\([^)]*\);\s*$/gm, replacement: '.join($&)' },

      // Fix string literals and joins
      { pattern: /\.join\(\"\)$/gm, replacement: '.join(" ")' },
      { pattern: /\.join\(\)$/gm, replacement: '.join(" ")' },
      { pattern: /\.join\(\"$/gm, replacement: '.join(" ")' },

      // Fix return statements
      {
        pattern: /return\s+([^'"`][^;]*?)(['"]);$/gm,
        replacement: 'return $1;',
      },
      {
        pattern: /return\s+([^'"`][^;]*?)(['"]\s*)$/gm,
        replacement: 'return $1;',
      },

      // Fix export statements
      {
        pattern: /};\s*export\s*default\s*([^;]+);$/gm,
        replacement: '}\n\nexport default $1;',
      },
      {
        pattern: /export\s*default\s*([^;]+);$/gm,
        replacement: 'export default $1;',
      },

      // Fix corrupted string endings
      { pattern: /(['"]);(['"]+)/g, replacement: '$1;' },
      { pattern: /(['"]);$/gm, replacement: '";' },

      // Fix bracket and brace mismatches
      { pattern: /\(\s*([^)]*?)\s*(['"]+)\s*\)/g, replacement: '($1)' },
      { pattern: /\{\s*([^}]*?)\s*(['"]+)\s*\}/g, replacement: '{$1}' },
      { pattern: /\[\s*([^\]]*?)\s*(['"]+)\s*\]/g, replacement: '[$1]' },

      // Fix method calls
      {
        pattern: /\.([a-zA-Z_$][a-zA-Z0-9_$]*)\(\s*([^)]*?)(['"]+)\s*\)/g,
        replacement: '.$1($2)',
      },

      // Fix specific TypeScript errors
      { pattern: /:\s*([^{,}]*?)(['"]+)\s*([,}])/g, replacement: ': $1$3' },
      {
        pattern: /=\s*([^'"`][^,;}]*?)(['"]+)\s*([,;}])/g,
        replacement: '= "$1"$3',
      },

      // Clean up multiple quotes
      { pattern: /(['"]{2,})/g, replacement: '"' },
      { pattern: /(['"]\s*){2,}/g, replacement: '"' },

      // Fix line ending issues
      { pattern: /([^;{}\n])\s*$/gm, replacement: '$1' },
      { pattern: /([;{}\n])\s*(['"]+)/g, replacement: '$1' },
    ];

    for (const fix of fixes) {
      const beforeFix = content;
      content = content.replace(fix.pattern, fix.replacement);
      if (content !== beforeFix) {
        fixesInFile++;
      }
    }

    // Additional manual fixes for common patterns
    content = content
      .replace(/import\s*(['"]+)/g, 'import ')
      .replace(/from\s*(['"]+)/g, 'from ')
      .replace(/export\s*(['"]+)/g, 'export ')
      .replace(/const\s*(['"]+)/g, 'const ')
      .replace(/let\s*(['"]+)/g, 'let ')
      .replace(/var\s*(['"]+)/g, 'var ')
      .replace(/function\s*(['"]+)/g, 'function ')
      .replace(/return\s*(['"]+)/g, 'return ')
      .replace(/if\s*(['"]+)/g, 'if ')
      .replace(/else\s*(['"]+)/g, 'else ')
      .replace(/for\s*(['"]+)/g, 'for ')
      .replace(/while\s*(['"]+)/g, 'while ')
      .replace(/switch\s*(['"]+)/g, 'switch ')
      .replace(/case\s*(['"]+)/g, 'case ')
      .replace(/default\s*(['"]+)/g, 'default')
      .replace(/break\s*(['"]+)/g, 'break')
      .replace(/continue\s*(['"]+)/g, 'continue')
      .replace(/try\s*(['"]+)/g, 'try ')
      .replace(/catch\s*(['"]+)/g, 'catch ')
      .replace(/finally\s*(['"]+)/g, 'finally ')
      .replace(/throw\s*(['"]+)/g, 'throw ')
      .replace(/new\s*(['"]+)/g, 'new ')
      .replace(/class\s*(['"]+)/g, 'class ')
      .replace(/interface\s*(['"]+)/g, 'interface ')
      .replace(/type\s*(['"]+)/g, 'type ')
      .replace(/enum\s*(['"]+)/g, 'enum ')
      .replace(/namespace\s*(['"]+)/g, 'namespace ');

    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      totalFixesApplied += fixesInFile;
      console.log(`Fixed ${fixesInFile} issues in: ${filePath}`);
    }

    totalFilesProcessed++;

    if (totalFilesProcessed % 50 === 0) {
      console.log(
        `Processed ${totalFilesProcessed} files, applied ${totalFixesApplied} fixes so far...`
      );
    }
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error.message);
  }
}

function processDirectory(dirPath) {
  try {
    const entries = fs.readdirSync(dirPath);

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        // Skip node_modules and other build directories
        if (!['node_modules', '.git', 'dist', 'build', '.next', 'coverage'].includes(entry)) {
          processDirectory(fullPath);
        }
      } else if (stat.isFile() && /\.(ts|tsx|js|jsx)$/.test(entry)) {
        fixQuotesInFile(fullPath);
      }
    }
  } catch (error) {
    console.error(`Error processing directory ${dirPath}:`, error.message);
  }
}

console.log('Starting comprehensive quote fix for packages directory...');

// Start from current directory (packages)
processDirectory(process.cwd());

console.log(`\nCompleted processing ${totalFilesProcessed} files`);
console.log(`Applied ${totalFixesApplied} total fixes`);
console.log('Quote corruption fix complete!');
