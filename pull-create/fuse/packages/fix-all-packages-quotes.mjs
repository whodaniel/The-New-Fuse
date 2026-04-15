#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function fixQuoteCorruption(content) {
  let fixed = content;
  let changes = 0;

  // Fix 1: Import statements with missing closing quotes
  const importPattern1 = /import\s*\{[^}]*\}\s*from\s*'([^']*);/g;
  fixed = fixed.replace(importPattern1, (match, p1) => {
    changes++;
    return match.replace(");", "');");
  });

  // Fix 2: Import statements with extra quotes
  const importPattern2 = /import\s*\{[^}]*\}\s*from\s*'([^']*)'';/g;
  fixed = fixed.replace(importPattern2, (match, p1) => {
    changes++;
    return match.replace("'';", "';");
  });

  // Fix 3: Missing quotes around module names
  const modulePattern = /from\s+(@[a-zA-Z0-9\-/]+);/g;
  fixed = fixed.replace(modulePattern, (match, p1) => {
    changes++;
    return `from '${p1}';`;
  });

  // Fix 4: Corrupted object properties like "activityType:rate_limit_exceeded'"
  const propertyPattern = /(\w+):([a-zA-Z_]+)'/g;
  fixed = fixed.replace(propertyPattern, (match, prop, value) => {
    changes++;
    return `${prop}: '${value}'`;
  });

  // Fix 5: Corrupted string arrays like "['authentication', 'middleware'']"
  const arrayPattern = /\[([^[\]]*)''\]/g;
  fixed = fixed.replace(arrayPattern, (match, content) => {
    const cleanContent = content.replace(/'/g, "'").replace(/,\s*'/g, ", '");
    changes++;
    return `[${cleanContent}]`;
  });

  // Fix 6: Double quotes at start like "'Error during LLM processing:'"
  const doubleQuotePattern = /''([^']+)'/g;
  fixed = fixed.replace(doubleQuotePattern, (match, content) => {
    changes++;
    return `'${content}'`;
  });

  // Fix 7: Missing quotes in emit statements
  const emitPattern = /this\.emit\('([^']*);/g;
  fixed = fixed.replace(emitPattern, (match, event) => {
    changes++;
    return `this.emit('${event}');`;
  });

  // Fix 8: Corrupted Promise syntax
  const promisePattern = /new Promise\('([^']*) => ([^']*)\);/g;
  fixed = fixed.replace(promisePattern, (match, param, body) => {
    changes++;
    return `new Promise(${param} => ${body});`;
  });

  // Fix 9: Corrupted union types like "' | 'pending' | '"
  const unionPattern = /' \| '([^']+)' \| '/g;
  fixed = fixed.replace(unionPattern, (match, type) => {
    changes++;
    return `'${type}'`;
  });

  // Fix 10: Fix function signatures with corrupted types
  const functionSignaturePattern = /(\w+)\(([^)]*): '>\):/g;
  fixed = fixed.replace(functionSignaturePattern, (match, funcName, params) => {
    changes++;
    return `${funcName}(${params}>):`;
  });

  return { content: fixed, changes };
}

function processFiles(dir) {
  const files = fs.readdirSync(dir);
  let totalChanges = 0;

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (
      stat.isDirectory() &&
      !file.startsWith(".") &&
      file !== "node_modules"
    ) {
      totalChanges += processFiles(filePath);
    } else if (file.endsWith(".ts") || file.endsWith(".tsx")) {
      const content = fs.readFileSync(filePath, "utf8");
      const result = fixQuoteCorruption(content);

      if (result.changes > 0) {
        fs.writeFileSync(filePath, result.content);
        console.log(`Fixed ${result.changes} issues in ${filePath}`);
        totalChanges += result.changes;
      }
    }
  });

  return totalChanges;
}

const packagesDir = __dirname;
console.log("Starting comprehensive quote corruption fix for all packages...");
const totalChanges = processFiles(packagesDir);
console.log(`\nTotal fixes applied across all packages: ${totalChanges}`);
