#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let totalFilesProcessed = 0;
let totalFixesApplied = 0;

function fixQuotesInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, "utf8");
    const originalContent = content;
    let fixesInFile = 0;

    // Fix patterns in order of priority
    const fixes = [
      // Fix import/export statement quotes
      {
        pattern: /import\s+([^'"`]*?)(['"]\s*[,;])/g,
        replacement: 'import $1"$2',
      },
      { pattern: /from\s+([^'"`]*?)(['"]\s*[,;])/g, replacement: 'from $1"$2' },
      {
        pattern: /export\s+([^'"`]*?)(['"]\s*[,;])/g,
        replacement: 'export $1"$2',
      },

      // Fix basic unterminated string literals
      { pattern: /(['"'])[^'"]*$/gm, replacement: '$1$&"' },

      // Fix corrupted import statements
      { pattern: /import\s+([^'"`]*?);$/gm, replacement: 'import "$1";' },
      { pattern: /from\s+([^'"`]*?);$/gm, replacement: 'from "$1";' },

      // Fix corrupted string literals in code
      {
        pattern: /=\s*([^'"`=\s][^;,}\]\)]*?)(['"]\s*[;,}\]\)])/g,
        replacement: '= "$1"$2',
      },

      // Fix object property quotes
      {
        pattern: /(\w+):\s*([^'"`][^,}\]]*?)(['"]\s*[,}])/g,
        replacement: '$1: "$2"$3',
      },

      // Fix function call parameters
      {
        pattern: /\(\s*([^'"`\(\)][^,\)]*?)(['"]\s*[,\)])/g,
        replacement: '("$1"$2',
      },

      // Fix template literal issues
      { pattern: /`([^`]*?)(['"]+)([^`]*?)`/g, replacement: "`$1$3`" },

      // Fix JSX attribute quotes
      {
        pattern: /(\w+)=\{?([^'"`=\s][^,}\s]*?)(['"]\s*[,}\s>])/g,
        replacement: '$1="$2"$3',
      },

      // Fix specific error patterns
      { pattern: /===''''([^']*?)''''/g, replacement: '=== "$1"' },
      { pattern: /!==''''([^']*?)''''/g, replacement: '!== "$1"' },
      { pattern: /(['"]+)\s*(['"]+)/g, replacement: '"' },

      // Fix multiple quote patterns
      { pattern: /''''/g, replacement: '"' },
      { pattern: /''/g, replacement: '"' },
      { pattern: /""""/g, replacement: '"' },
      { pattern: /""/g, replacement: '"' },

      // Fix semicolon issues
      { pattern: /(['"]);(['"]+)/g, replacement: "$1;" },
      { pattern: /;(['"]+)/g, replacement: ";" },

      // Fix bracket/brace issues
      { pattern: /\}(['"]+)/g, replacement: "}" },
      { pattern: /\](['"]+)/g, replacement: "]" },
      { pattern: /\)(['"]+)/g, replacement: ")" },

      // Fix comma issues
      { pattern: /,(['"]+)/g, replacement: "," },

      // Fix specific TypeScript errors
      {
        pattern: /(\w+)\s*:\s*([^'"`][^,}\]]*?)(['"]+)\s*([,}])/g,
        replacement: '$1: "$2"$4',
      },
      {
        pattern: /typeof\s*([^'"`\s][^=]*?)(['"]+)\s*===/g,
        replacement: "typeof $1 ===",
      },

      // Fix JSX closing tags
      { pattern: /(['"]+)\s*>/g, replacement: '">' },
      { pattern: /<(['"]+)/g, replacement: "<" },

      // Fix corrupted error messages
      {
        pattern: /Error\(([^'"`\(][^)]*?)(['"]+)\)/g,
        replacement: 'Error("$1")',
      },
      {
        pattern: /throw\s+new\s+Error\(([^'"`\(][^)]*?)(['"]+)\)/g,
        replacement: 'throw new Error("$1")',
      },

      // Fix console statements
      {
        pattern: /console\.(\w+)\(([^'"`\(][^)]*?)(['"]+)\)/g,
        replacement: 'console.$1("$2")',
      },

      // Fix emit statements
      {
        pattern: /emit\(([^'"`\(][^,)]*?)(['"]+)\s*,/g,
        replacement: 'emit("$1",',
      },

      // Fix final cleanup
      { pattern: /(['"]{2,})/g, replacement: '"' },
    ];

    for (const fix of fixes) {
      const beforeFix = content;
      content = content.replace(fix.pattern, fix.replacement);
      if (content !== beforeFix) {
        fixesInFile++;
      }
    }

    // Additional specific fixes for common patterns
    content = content
      .replace(/import\s+([^'"`]*?)\s*;/g, 'import "$1";')
      .replace(/from\s+([^'"`]*?)\s*;/g, 'from "$1";')
      .replace(/export\s+\*\s+from\s+([^'"`]*?)\s*;/g, 'export * from "$1";')
      .replace(/export\s+\{[^}]*\}\s+from\s+([^'"`]*?)\s*;/g, (match) => {
        const fromIndex = match.lastIndexOf("from");
        const beforeFrom = match.substring(0, fromIndex);
        const afterFrom = match.substring(fromIndex + 4).trim();
        const moduleName = afterFrom.replace(/['";\s]/g, "");
        return beforeFrom + 'from "' + moduleName + '";';
      });

    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, "utf8");
      totalFixesApplied += fixesInFile;
      console.log(`Fixed ${fixesInFile} issues in: ${filePath}`);
    }

    totalFilesProcessed++;

    if (totalFilesProcessed % 100 === 0) {
      console.log(
        `Processed ${totalFilesProcessed} files, applied ${totalFixesApplied} fixes so far...`,
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
        if (
          ![
            "node_modules",
            ".git",
            "dist",
            "build",
            ".next",
            "coverage",
          ].includes(entry)
        ) {
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

console.log("Starting comprehensive quote fix across entire codebase...");
console.log("This may take several minutes for a large codebase...");

// Process all directories
const directories = ["apps", "packages"];

for (const dir of directories) {
  const dirPath = path.join(process.cwd(), dir);
  if (fs.existsSync(dirPath)) {
    console.log(`Processing directory: ${dir}`);
    processDirectory(dirPath);
  }
}

console.log(`\nCompleted processing ${totalFilesProcessed} files`);
console.log(`Applied ${totalFixesApplied} total fixes`);
console.log("Quote corruption fix complete!");
