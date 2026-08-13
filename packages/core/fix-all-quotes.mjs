#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function fixQuoteCorruption(content) {
  let fixed = content;
  let changes = 0;

  // Fix 1: Missing closing quotes in imports
  const missingClosingQuotePattern = /import\s*\{[^}]*\}\s*from\s*'([^']*);/g;
  fixed = fixed.replace(missingClosingQuotePattern, (match, p1) => {
    changes++;
    return match.replace(');', "');");
  });

  // Fix 2: Missing opening quotes in imports
  const missingOpeningQuotePattern = /import\s*\{[^}]*\}\s*from\s+([^'"][^;]*);/g;
  fixed = fixed.replace(missingOpeningQuotePattern, (match, p1) => {
    changes++;
    return match.replace(`from ${p1};`, `from '${p1}';`);
  });

  // Fix 3: Extra spaces in destructuring imports
  const extraSpacesPattern = /import\s*\{\s*([^}]*)\s*\}\s*from/g;
  fixed = fixed.replace(extraSpacesPattern, (match, p1) => {
    const cleanedItems = p1
      .split(',')
      .map((item) => item.trim())
      .join(', ');
    changes++;
    return `import { ${cleanedItems} } from`;
  });

  // Fix 4: Corrupted string literals in role assignments
  const rolePattern = /role:\s*'([^']*)'([^']*)/g;
  fixed = fixed.replace(rolePattern, (match, p1, p2) => {
    if (p2 && !p2.startsWith(',') && !p2.startsWith(';')) {
      changes++;
      return `role: '${p1}${p2}'`;
    }
    return match;
  });

  // Fix 5: Corrupted emit statements
  const emitPattern = /this\.emit\('([^']*)'([^']*)',/g;
  fixed = fixed.replace(emitPattern, (match, p1, p2) => {
    changes++;
    return `this.emit('${p1}${p2}',`;
  });

  // Fix 6: Corrupted typeof checks
  const typeofPattern = /'typeof\s+([^=]*)\s*===\s*'([^']*)'([^']*)/g;
  fixed = fixed.replace(typeofPattern, (match, p1, p2, p3) => {
    changes++;
    return `typeof ${p1} === '${p2}${p3}'`;
  });

  // Fix 7: Missing quotes around module names
  const modulePattern = /from\s+(@[a-zA-Z0-9\-/]+);/g;
  fixed = fixed.replace(modulePattern, (match, p1) => {
    changes++;
    return `from '${p1}';`;
  });

  return { content: fixed, changes };
}

function processFiles(dir) {
  const files = fs.readdirSync(dir);
  let totalChanges = 0;

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      totalChanges += processFiles(filePath);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      const content = fs.readFileSync(filePath, 'utf8');
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

const srcDir = path.join(__dirname, 'src');
console.log('Starting comprehensive quote corruption fix...');
const totalChanges = processFiles(srcDir);
console.log(`\nTotal fixes applied: ${totalChanges}`);
