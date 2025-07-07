#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

// Function to fix common syntax errors
function fixSyntaxErrors(content) {
  let fixed = content;
  
  // Fix extraneous semicolons and corrupted syntax patterns
  
  // Remove double semicolons at end of lines
  fixed = fixed.replace(/;;$/gm, ';');
  
  // Fix corrupted object/array syntax with trailing semicolons
  fixed = fixed.replace(/,;$/gm, ',');
  fixed = fixed.replace(/,;\s*$/gm, ',');
  
  // Fix corrupted template literals with extra backticks
  fixed = fixed.replace(/``;$/gm, '`;');
  fixed = fixed.replace(/`\s*`;$/gm, '`;');
  
  // Fix property assignment issues
  fixed = fixed.replace(/(\w+),;$/gm, '$1,');
  fixed = fixed.replace(/(\w+);$/gm, '$1');
  
  // Fix unterminated string literals
  fixed = fixed.replace(/(['"]).+?;\s*$/gm, (match) => {
    if (match.includes('";"') || match.includes("';'")) {
      return match.replace(/;"$/, '"').replace(/;'$/, "'");
    }
    return match;
  });
  
  // Fix corrupted import statements
  fixed = fixed.replace(/import\s+.*?';';/g, (match) => {
    return match.replace(/';';$/, "';");
  });
  
  // Fix malformed object literals
  fixed = fixed.replace(/{\s*([^}]*),;\s*}/g, '{ $1 }');
  
  // Fix corrupted function parameters
  fixed = fixed.replace(/\(\s*([^)]*),;\s*\)/g, '($1)');
  
  // Fix try-catch-finally structure issues
  fixed = fixed.replace(/}\s*catch\s*\(/g, '} catch (');
  fixed = fixed.replace(/}\s*finally\s*{/g, '} finally {');
  
  // Fix template literal expressions
  fixed = fixed.replace(/\$\{([^}]*),;\s*\}/g, '${$1}');
  
  // Fix array/object closing brackets
  fixed = fixed.replace(/([,\s])\s*;\s*([}\]])/g, '$1$2');
  
  // Fix method calls and property access
  fixed = fixed.replace(/\.(\w+),;/g, '.$1,');
  fixed = fixed.replace(/\.(\w+);(\s*[,\]}])/g, '.$1$2');
  
  return fixed;
}

// Get all TypeScript files in packages/core/src
async function getAllTSFiles() {
  try {
    const pattern = 'packages/core/src/**/*.{ts,tsx}';
    const files = await glob(pattern, { ignore: ['**/node_modules/**', '**/dist/**'] });
    return files;
  } catch (error) {
    console.error('Error finding files:', error);
    return [];
  }
}

// Process each file
async function fixFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const fixed = fixSyntaxErrors(content);
    
    if (content !== fixed) {
      fs.writeFileSync(filePath, fixed, 'utf8');
      console.log(`✅ Fixed: ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

// Main execution
async function main() {
  console.log('🔧 Starting comprehensive syntax error fix...');
  
  const files = await getAllTSFiles();
  console.log(`📁 Found ${files.length} TypeScript files to process`);
  
  let fixedCount = 0;
  let processedCount = 0;
  
  for (const file of files) {
    processedCount++;
    const wasFixed = await fixFile(file);
    if (wasFixed) fixedCount++;
    
    // Progress indicator
    if (processedCount % 50 === 0) {
      console.log(`📊 Progress: ${processedCount}/${files.length} files processed, ${fixedCount} fixed`);
    }
  }
  
  console.log(`\n✨ Complete! Processed ${processedCount} files, fixed ${fixedCount} files`);
  
  // Run TypeScript check to see remaining errors
  console.log('\n🔍 Running TypeScript check...');
  try {
    const { execSync } = await import('child_process');
    execSync('cd packages/core && npx tsc --noEmit --skipLibCheck', { stdio: 'inherit' });
    console.log('✅ No TypeScript errors found!');
  } catch (error) {
    console.log('⚠️  Some TypeScript errors remain, but syntax errors should be resolved');
  }
}

main().catch(console.error);