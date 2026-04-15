#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get the base directory
const BASE_DIR = process.env.BASE_DIR || path.join(__dirname, '..');

const processFile = async (filePath) => {
  try {
    const fullPath = path.join(BASE_DIR, filePath);
    if (!fs.existsSync(fullPath)) {
      console.warn(`File not found: ${filePath}`);
      return;
    }

    let content = fs.readFileSync(fullPath, 'utf8');
    let modified = false;

    // Fix 1: Add missing React imports
    if (!content.includes('import React')) {
      content = `import React from 'react';\n${content}`;
      modified = true;
    }

    // Fix 2: Convert function components to FC type
    if (content.match(/function\s+[A-Z][A-Za-z0-9]*\s*\(/)) {
      content = content.replace(
        /function\s+([A-Z][A-Za-z0-9]*)\s*\((props[^)]*)\)/g,
        'const $1: React.FC<{$2}> = ($2)'
      );
      modified = true;
    }

    // Fix 3: Add missing interface declarations
    if (content.includes('props:') && !content.includes('interface')) {
      const propsMatch = content.match(/props:\s*{([^}]*)}/);
      if (propsMatch) {
        const propsContent = propsMatch[1];
        const componentName = path.basename(filePath, '.tsx');
        const interfaceDeclaration = `\ninterface ${componentName}Props {\n  ${propsContent}\n}\n`;
        content = interfaceDeclaration + content;
        modified = true;
      }
    }

    // Fix 4: Add JSX.Element return type
    content = content.replace(
      /(\s*=\s*\([^)]*\))\s*=>/g,
      '$1: JSX.Element =>'
    );

    // Fix 5: Add missing exports
    if (!content.includes('export')) {
      content = `export ${content}`;
      modified = true;
    }

    if (modified) {
      fs.writeFileSync(fullPath, content);
      
      return true;
    }

    return false;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
    return false;
  }
};

const findFilesWithInterfaceIssues = async () => {
  const files = [];
  
  // Read structured error report if it exists
  try {
    const errorReport = JSON.parse(fs.readFileSync('typescript-errors-report.json', 'utf8'));
    for (const [file, data] of Object.entries(errorReport.errorsByFile)) {
      if (data.errors.some(e => 
        e.message.includes('interface') || 
        e.message.includes('type') ||
        e.message.includes('React') ||
        e.message.includes('JSX')
      )) {
        files.push(file);
      }
    }
  } catch (error) {
    // Fallback to scanning for React component files
    const componentDirs = ['src/components'];
    for (const dir of componentDirs) {
      const fullPath = path.join(BASE_DIR, dir);
      if (fs.existsSync(fullPath)) {
        const entries = fs.readdirSync(fullPath, { recursive: true });
        files.push(...entries
          .filter(f => f.endsWith('.tsx'))
          .map(f => path.join(dir, f)));
      }
    }
  }
  
  return [...new Set(files)];
};

const main = async () => {

  const filesWithIssues = await findFilesWithInterfaceIssues();

  let fixedCount = 0;
  for (const filePath of filesWithIssues) {
    
    if (await processFile(filePath)) {
      fixedCount++;
    }
  }

  // Run TypeScript check after fixes
  
  const { spawnSync } = await import('child_process');
  const tscResult = spawnSync('npx', ['tsc', '--noEmit'], {
    encoding: 'utf8',
    stdio: 'inherit',
    shell: true
  });
  
  if (tscResult.status === 0) {
    
  }
};

main().catch(console.error);
