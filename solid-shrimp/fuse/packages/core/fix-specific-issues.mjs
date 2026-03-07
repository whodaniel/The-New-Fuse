#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const filesToFix = [
  'src/visualization/fileVisualizer.ts',
  'src/workflow/executor.ts',
  'src/workflow/gateway.ts',
  'src/workflow/types.ts',
  'src/workflow/types/index.ts',
  'src/validation/data-validation.ts',
  'src/vectordb/embedding-service.ts',
  'src/vectordb/providers/chroma-provider.ts',
  'src/vectordb/providers/redis-provider.ts',
];

function fixSpecificIssues(content, filename) {
  let fixed = content;

  if (filename.includes('fileVisualizer.ts')) {
    fixed = fixed.replace(/summary\.push\('\);/, "summary.push('');");
  }

  if (filename.includes('executor.ts')) {
    fixed = fixed.replace(/';$/, "';");
  }

  if (filename.includes('gateway.ts')) {
    fixed = fixed.replace(/return ';$/, "return '';");
  }

  if (filename.includes('types.ts')) {
    fixed = fixed.replace(
      /\`Step '\$\{step\.id\}' has an invalid dependency: '\$\{depId\}' not found in template '\$\{template\.id\}\`;/,
      "`Step '${step.id}' has an invalid dependency: '${depId}' not found in template '${template.id}'`;",
    );
    fixed = fixed.replace(
      /\`Circular dependency detected in workflow template '\$\{templateId\}' involving step '\$\{step\.id\}\`;/,
      "`Circular dependency detected in workflow template '${templateId}' involving step '${step.id}'`;",
    );
    fixed = fixed.replace(/';$/, "';");
  }

  if (filename.includes('index.ts')) {
    fixed = fixed.replace(/';$/, "';");
  }

  if (filename.includes('data-validation.ts')) {
    // Remove any unterminated template literals
    fixed = fixed.replace(/\s*$/, '');
    if (!fixed.endsWith('}')) {
      fixed += '\n';
    }
  }

  if (filename.includes('embedding-service.ts')) {
    // Fix any unterminated template literals
    fixed = fixed.replace(/\}\s*$/, '}');
  }

  if (filename.includes('chroma-provider.ts') || filename.includes('redis-provider.ts')) {
    // Ensure files end properly
    if (!fixed.trim().endsWith('}')) {
      fixed = fixed.trim() + '\n}';
    }
  }

  return fixed;
}

console.log('Fixing specific syntax issues...');

filesToFix.forEach((file) => {
  const filePath = path.join(process.cwd(), file);

  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      const fixed = fixSpecificIssues(content, file);

      if (fixed !== content) {
        fs.writeFileSync(filePath, fixed, 'utf8');
        console.log(`Fixed ${file}`);
      }
    }
  } catch (error) {
    console.error(`Error fixing ${file}:`, error.message);
  }
});

console.log('Done fixing specific issues.');
