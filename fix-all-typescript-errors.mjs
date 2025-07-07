#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let totalFixedFiles = 0;
let totalFixedLines = 0;

function fixQuotesInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, "utf8");
    const originalContent = content;
    let fixedLines = 0;

    // Define all the quote corruption patterns and their fixes
    const fixes = [
      // Basic import/export quote fixes
      { pattern: /impor([^t])/g, replacement: "import$1" },
      { pattern: /impo([^r])/g, replacement: "import $1" },
      { pattern: /import\s*([^'"]*)'([^'"]*)/g, replacement: "import '$2" },
      { pattern: /import\s*([^'"]*)"([^'"]*)/g, replacement: 'import "$2' },
      { pattern: /from\s*([^'"]*)'([^'"]*)/g, replacement: "from '$2" },
      { pattern: /from\s*([^'"]*)"([^'"]*)/g, replacement: 'from "$2' },
      {
        pattern: /export\s*\*\s*from\s*([^'"]*)'([^'"]*)/g,
        replacement: "export * from '$2",
      },
      {
        pattern: /export\s*\{\s*([^}]*)\s*\}\s*from\s*([^'"]*)'([^'"]*)/g,
        replacement: "export { $1 } from '$3",
      },

      // String literal fixes
      { pattern: /'([^']*)'([^']*)'([^']*)/g, replacement: "'$1$2$3'" },
      { pattern: /"([^"]*)"([^"]*)"([^"]*)/g, replacement: '"$1$2$3"' },

      // Template literal fixes
      { pattern: /`([^`]*)`([^`]*)`([^`]*)/g, replacement: "`$1$2$3`" },

      // Object property fixes
      { pattern: /:\s*'([^']*)\s*([^,}]+)/g, replacement: ": '$1$2'" },
      { pattern: /:\s*"([^"]*)\s*([^,}]+)/g, replacement: ': "$1$2"' },

      // JSX attribute fixes
      { pattern: /=\s*'([^']*)'([^'>\s]+)/g, replacement: "='$1$2'" },
      { pattern: /=\s*"([^"]*)"([^">\s]+)/g, replacement: '="$1$2"' },

      // Function call fixes
      { pattern: /\('([^']*)'([^)]*)\)/g, replacement: "('$1$2')" },
      { pattern: /\("([^"]*)"([^)]*)\)/g, replacement: '("$1$2")' },

      // Emit/event fixes
      { pattern: /emit\s*\(\s*'([^']*),/g, replacement: "emit('$1'," },
      { pattern: /emit\s*\(\s*"([^"]*),/g, replacement: 'emit("$1",' },

      // React JSX fixes
      {
        pattern: /className\s*=\s*'([^']*)'([^'>\s]+)/g,
        replacement: "className='$1$2'",
      },
      {
        pattern: /className\s*=\s*"([^"]*)"([^">\s]+)/g,
        replacement: 'className="$1$2"',
      },

      // Type annotation fixes
      { pattern: /:\s*'([^']*)'([^;,\s]+)/g, replacement: ": '$1$2'" },
      { pattern: /:\s*"([^"]*)"([^;,\s]+)/g, replacement: ': "$1$2"' },

      // Status comparison fixes
      { pattern: /'([^']*)\s*===\s*([^']*)/g, replacement: "'$1' === '$2'" },
      { pattern: /"([^"]*)\s*===\s*([^"]*)/g, replacement: '"$1" === "$2"' },

      // Array/object literal fixes
      { pattern: /\[\s*'([^']*)'([^']*),/g, replacement: "['$1$2'," },
      { pattern: /\[\s*"([^"]*)"([^"]*),/g, replacement: '["$1$2",' },

      // Error message fixes
      {
        pattern: /Error\s*\(\s*'([^']*)'([^)]*)\)/g,
        replacement: "Error('$1$2')",
      },
      {
        pattern: /Error\s*\(\s*"([^"]*)"([^)]*)\)/g,
        replacement: 'Error("$1$2")',
      },

      // Console log fixes
      {
        pattern: /console\.(log|error|warn|info)\s*\(\s*'([^']*)'([^)]*)\)/g,
        replacement: "console.$1('$2$3')",
      },
      {
        pattern: /console\.(log|error|warn|info)\s*\(\s*"([^"]*)"([^)]*)\)/g,
        replacement: 'console.$1("$2$3")',
      },

      // URL/path fixes
      { pattern: /src\s*=\s*'([^']*)'([^'>\s]+)/g, replacement: "src='$1$2'" },
      {
        pattern: /href\s*=\s*'([^']*)'([^'>\s]+)/g,
        replacement: "href='$1$2'",
      },

      // Generic quote corruption fixes
      { pattern: /'([^']*)\s+([^']*)/g, replacement: "'$1$2'" },
      { pattern: /"([^"]*)\s+([^"]*)/g, replacement: '"$1$2"' },

      // Specific corruption patterns
      { pattern: /'\s*\+\s*'/g, replacement: "" },
      { pattern: /"\s*\+\s*"/g, replacement: "" },
      { pattern: /'([^']*);$/gm, replacement: "'$1';" },
      { pattern: /"([^"]*);$/gm, replacement: '"$1";' },

      // TypeScript specific fixes
      {
        pattern: /type\s+([^=]+)=\s*'([^']*)'([^;]+)/g,
        replacement: "type $1 = '$2$3'",
      },
      {
        pattern: /interface\s+([^{]+)\{\s*([^}]*)\}/g,
        replacement: "interface $1 {\n  $2\n}",
      },

      // React component fixes
      { pattern: /<([A-Z][a-zA-Z]*)\s+([^>]*)>/g, replacement: "<$1 $2>" },
      { pattern: /<\/([A-Z][a-zA-Z]*)\s*>/g, replacement: "</$1>" },

      // Import path fixes for tsx files
      {
        pattern: /from\s+['"]([^'"]*\.tsx?)['"]([^;]*)/g,
        replacement: "from '$1'$2",
      },

      // Fix malformed object properties
      {
        pattern: /\{\s*([^:]+):\s*'([^']*)'([^,}]*)/g,
        replacement: "{ $1: '$2$3'",
      },
      {
        pattern: /\{\s*([^:]+):\s*"([^"]*)"([^,}]*)/g,
        replacement: '{ $1: "$2$3"',
      },

      // Fix function parameters
      {
        pattern: /function\s+([^(]+)\(\s*([^)]*)\s*\)/g,
        replacement: "function $1($2)",
      },
      {
        pattern: /const\s+([^=]+)=\s*\(\s*([^)]*)\s*\)\s*=>/g,
        replacement: "const $1 = ($2) =>",
      },
    ];

    // Apply all fixes
    fixes.forEach((fix) => {
      const newContent = content.replace(fix.pattern, fix.replacement);
      if (newContent !== content) {
        fixedLines++;
        content = newContent;
      }
    });

    // Additional specific fixes for common corruptions
    const specificFixes = [
      // Fix unterminated string literals
      {
        pattern: /(['"])[^'"]*$/gm,
        replacement: (match, quote) => match + quote,
      },

      // Fix missing semicolons
      { pattern: /^(\s*[^;{}\n]*[^;{}\s])\s*$/gm, replacement: "$1;" },

      // Fix JSX fragments
      { pattern: /<>\s*([^<]*)\s*<\/>/g, replacement: "<>$1</>" },

      // Fix arrow functions
      { pattern: /=>\s*\{([^}]*)\}/g, replacement: "=> { $1 }" },
    ];

    specificFixes.forEach((fix) => {
      const newContent = content.replace(fix.pattern, fix.replacement);
      if (newContent !== content) {
        fixedLines++;
        content = newContent;
      }
    });

    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, "utf8");
      console.log(`Fixed ${fixedLines} issues in ${filePath}`);
      totalFixedFiles++;
      totalFixedLines += fixedLines;
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return false;
  }
}

function processDirectory(dir) {
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        // Skip node_modules, .git, and other irrelevant directories
        if (
          ![
            "node_modules",
            ".git",
            ".next",
            "dist",
            "build",
            ".vscode",
          ].includes(entry.name)
        ) {
          processDirectory(fullPath);
        }
      } else if (entry.isFile()) {
        // Process TypeScript and JavaScript files
        if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) {
          fixQuotesInFile(fullPath);
        }
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error.message);
  }
}

function main() {
  console.log("🔧 Starting comprehensive TypeScript quote corruption fix...");

  const rootDir = process.cwd();
  console.log(`Processing directory: ${rootDir}`);

  // Process all directories
  const directories = ["apps", "packages", "libs", "src"].filter((dir) =>
    fs.existsSync(path.join(rootDir, dir)),
  );

  directories.forEach((dir) => {
    console.log(`\n📁 Processing ${dir}/...`);
    processDirectory(path.join(rootDir, dir));
  });

  // Also process root level files
  const rootFiles = fs
    .readdirSync(rootDir)
    .filter((file) => /\.(ts|tsx|js|jsx)$/.test(file))
    .map((file) => path.join(rootDir, file));

  rootFiles.forEach((file) => {
    fixQuotesInFile(file);
  });

  console.log(
    `\n✅ Completed! Fixed ${totalFixedLines} issues in ${totalFixedFiles} files.`,
  );
}

main();
