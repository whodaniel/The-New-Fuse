#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("🔧 Starting comprehensive quote corruption fix...");

// Common patterns of corrupted quotes to fix
const quoteFixPatterns = [
  // Fix corrupted string literals like 'workflow: 'start' -> 'workflow:start'
  { pattern: /'([^']*): '([^']*)'/, replacement: "'$1:$2'" },

  // Fix typeof checks like 'typeof value === 'string' -> typeof value === 'string'
  {
    pattern: /'typeof ([^']*) === '([^']*)'/,
    replacement: "typeof $1 === '$2'",
  },

  // Fix method calls with corrupted quotes like parts[0] === 'inputs' -> parts[0] === 'inputs'
  {
    pattern: /'([^']*)\[([^\]]*)\] === '([^']*)'/,
    replacement: "$1[$2] === '$3'",
  },

  // Fix template string corruption like ${variable} corrupted quotes
  { pattern: /'([^']*)\$\{([^}]*)\}'/, replacement: "'$1${$2}'" },

  // Fix corrupted method names like .trim(').split('.') -> .trim().split('.')
  {
    pattern: /\.trim\('\)\.split\('([^']*)'/,
    replacement: ".trim().split('$1')",
  },

  // Fix corrupted if statements
  { pattern: /'if \('([^']*)'/, replacement: "if ('$1'" },

  // Fix template literals with corrupted quotes
  { pattern: /`([^`]*)'([^`]*)`/, replacement: "`$1'$2`" },

  // Fix object property access with corrupted quotes
  { pattern: /'([^']*)'\.([a-zA-Z_][a-zA-Z0-9_]*)'/, replacement: "'$1'.$2" },

  // Fix method calls with multiple parameters
  {
    pattern: /\.emit\('([^']*): '([^']*)', ([^)]*)\)/,
    replacement: ".emit('$1:$2', $3)",
  },

  // Fix string concatenation with corrupted quotes
  { pattern: /'([^']*)\+([^']*)'/, replacement: "'$1'+$2" },
];

// Additional patterns for specific TypeScript/JavaScript constructs
const advancedPatterns = [
  // Fix switch case statements
  { pattern: /case '([^']*)':\s*'([^']*)'/, replacement: "case '$1': '$2'" },

  // Fix return statements with corrupted strings
  { pattern: /return '([^']*)'([^;]*);/, replacement: "return '$1$2';" },

  // Fix function parameters with corrupted strings
  { pattern: /\('([^']*)'([^)]*)\)/, replacement: "('$1$2')" },

  // Fix array access with strings
  { pattern: /\['([^']*)'([^\]]*)\]/, replacement: "['$1$2']" },
];

function fixFileContent(content) {
  let fixedContent = content;
  let changesMade = 0;

  // Apply all quote fix patterns
  [...quoteFixPatterns, ...advancedPatterns].forEach((pattern, index) => {
    const beforeLength = fixedContent.length;
    fixedContent = fixedContent.replace(
      new RegExp(pattern.pattern, "g"),
      pattern.replacement,
    );
    const afterLength = fixedContent.length;

    if (beforeLength !== afterLength) {
      changesMade++;
    }
  });

  // Additional manual fixes for common corruptions
  fixedContent = fixedContent
    // Fix basic string concatenation issues
    .replace(/'([^']*)'([^']*)'([^']*)'/, "'$1$2$3'")
    // Fix method chaining with corrupted quotes
    .replace(/\.([a-zA-Z_][a-zA-Z0-9_]*)\('([^']*)'([^)]*)\)/, ".$1('$2$3')")
    // Fix template literal expressions
    .replace(/\$\{'([^']*)'([^}]*)\}/, "${$1$2}")
    // Fix object key access
    .replace(/\['([^']*)'([^\]]*)\]/g, "['$1$2']")
    // Fix console.log and similar calls
    .replace(/console\.log\('([^']*)'([^)]*)\)/, "console.log('$1$2')")
    // Fix JSON.stringify calls
    .replace(/JSON\.stringify\('([^']*)'([^)]*)\)/, "JSON.stringify('$1$2')")
    // Fix require statements
    .replace(/require\('([^']*)'([^)]*)\)/, "require('$1$2')")
    // Fix import statements
    .replace(/from '([^']*)'([^']*)'/, "from '$1$2'")
    .replace(/import '([^']*)'([^']*)'/, "import '$1$2'");

  return { content: fixedContent, changesMade };
}

function processDirectory(dirPath) {
  const items = fs.readdirSync(dirPath);
  let totalFiles = 0;
  let totalChanges = 0;

  for (const item of items) {
    const fullPath = path.join(dirPath, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      // Skip node_modules and other build directories
      if (["node_modules", "dist", "build", ".git", ".turbo"].includes(item)) {
        continue;
      }

      const subResult = processDirectory(fullPath);
      totalFiles += subResult.files;
      totalChanges += subResult.changes;
    } else if (
      stat.isFile() &&
      (item.endsWith(".ts") ||
        item.endsWith(".tsx") ||
        item.endsWith(".js") ||
        item.endsWith(".jsx"))
    ) {
      try {
        const content = fs.readFileSync(fullPath, "utf8");
        const result = fixFileContent(content);

        if (result.changesMade > 0) {
          fs.writeFileSync(fullPath, result.content, "utf8");
          console.log(`✅ Fixed ${result.changesMade} issues in: ${fullPath}`);
          totalChanges += result.changesMade;
        }

        totalFiles++;
      } catch (error) {
        console.error(`❌ Error processing ${fullPath}:`, error.message);
      }
    }
  }

  return { files: totalFiles, changes: totalChanges };
}

// Start processing from the packages/core/src directory
const startPath = path.join(__dirname, "packages", "core", "src");

if (!fs.existsSync(startPath)) {
  console.error(`❌ Source directory not found: ${startPath}`);
  process.exit(1);
}

console.log(`🚀 Processing files in: ${startPath}`);
const result = processDirectory(startPath);

console.log(`\n📊 Summary:`);
console.log(`   Files processed: ${result.files}`);
console.log(`   Total fixes applied: ${result.changes}`);

if (result.changes > 0) {
  console.log(`\n✅ Quote corruption fix completed! Try building again.`);
} else {
  console.log(`\n ℹ️  No quote corruption found.`);
}
