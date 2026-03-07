/**
 * Cleanup Summary Script for The New Fuse
 * 
 * This script analyzes the results from final-cleanup.js and generates
 * a more actionable report by filtering likely false positives and
 * prioritizing cleanup targets.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ES modules don't have __dirname, so we need to create it
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ROOT = path.resolve(__dirname, '..');

// Directories and patterns to filter out (likely false positives)
const LIKELY_FALSE_POSITIVES = [
  /\.d\.ts$/, // Type declaration files
  /\/node_modules\//,
  /\/types\//,
  /\/dist\//,
  /\/build\//,
  /index\.(js|ts|tsx)$/, // Index files often re-export things
  /test/, // Test files and directories
  /__tests__/,
  /\.test\./,
  /\.spec\./,
  /example/,
  /demo/,
  /playground/,
];

// High-priority paths that likely contain core functionality
const HIGH_PRIORITY_PATHS = [
  /\/src\/modules\//,
  /\/src\/services\//,
  /\/src\/utils\//,
  /\/core\//,
  /\/components\//,
];

// Critical files that we know should not be touched
const CRITICAL_FILES = [
  'package.json',
  'tsconfig.json',
  'webpack.config.js',
  'vite.config.js',
  'rollup.config.js',
  'jest.config.js',
  'babel.config.js',
  '.eslintrc',
  '.prettierrc',
];

async function readFileIfExists(filePath) {
  try {
    return await fs.promises.readFile(filePath, 'utf8');
  } catch (error) {
    console.error(`Error reading ${filePath}: ${error.message}`);
    return '';
  }
}

async function writeFile(filePath, content) {
  try {
    await fs.promises.writeFile(filePath, content, 'utf8');
    console.log(`Successfully wrote ${filePath}`);
  } catch (error) {
    console.error(`Error writing ${filePath}: ${error.message}`);
  }
}

function isLikelyFalsePositive(filePath) {
  return LIKELY_FALSE_POSITIVES.some(pattern => pattern.test(filePath));
}

function isHighPriority(filePath) {
  return HIGH_PRIORITY_PATHS.some(pattern => pattern.test(filePath));
}

function isCriticalFile(filePath) {
  return CRITICAL_FILES.some(criticalFile => 
    filePath.endsWith(`/${criticalFile}`) || filePath.endsWith(`\\${criticalFile}`)
  );
}

async function analyzeUnusedImports() {
  const unusedImportsPath = path.join(PROJECT_ROOT, 'unused-imports.txt');
  const content = await readFileIfExists(unusedImportsPath);
  
  if (!content) {
    return { total: 0, filtered: 0, highPriority: 0, items: [] };
  }
  
  // Parse the content - it's in the format "file: import1, import2, ..."
  const entries = content.split('\n\n').filter(Boolean);
  
  let allImports = [];
  
  for (const entry of entries) {
    const lines = entry.split('\n');
    if (lines.length < 2) continue;
    
    const file = lines[0].replace(':', '').trim();
    const imports = lines[1].trim().split(', ');
    
    if (imports.length > 0) {
      allImports.push({ file, imports, count: imports.length });
    }
  }
  
  // Filter out likely false positives
  const filteredImports = allImports.filter(item => !isLikelyFalsePositive(item.file));
  
  // Identify high priority items
  const highPriorityImports = filteredImports.filter(item => isHighPriority(item.file));
  
  // Sort by count for easier review
  highPriorityImports.sort((a, b) => b.count - a.count);
  filteredImports.sort((a, b) => b.count - a.count);
  
  return {
    total: allImports.length,
    filtered: filteredImports.length,
    highPriority: highPriorityImports.length,
    items: {
      highPriority: highPriorityImports.slice(0, 50), // First 50 high priority
      other: filteredImports.slice(0, 50) // First 50 other filtered items
    }
  };
}

async function analyzeUnusedFiles() {
  const unusedFilesPath = path.join(PROJECT_ROOT, 'unused-files.txt');
  const content = await readFileIfExists(unusedFilesPath);
  
  if (!content) {
    return { total: 0, filtered: 0, highPriority: 0, items: [] };
  }
  
  // Parse the content - one file path per line
  const files = content.split('\n').filter(Boolean).map(file => file.trim());
  
  // Filter out likely false positives
  const filteredFiles = files.filter(file => !isLikelyFalsePositive(file));
  
  // Filter out critical files that should never be removed
  const nonCriticalFiles = filteredFiles.filter(file => !isCriticalFile(file));
  
  // Identify high priority items
  const highPriorityFiles = nonCriticalFiles.filter(file => isHighPriority(file));
  
  // Group by directory for better organization
  const groupedByDirectory = {};
  
  for (const file of nonCriticalFiles) {
    const dir = path.dirname(file);
    if (!groupedByDirectory[dir]) {
      groupedByDirectory[dir] = [];
    }
    groupedByDirectory[dir].push(path.basename(file));
  }
  
  // Find directories with many unused files
  const directoryCounts = Object.entries(groupedByDirectory)
    .map(([dir, files]) => ({ dir, count: files.length }))
    .sort((a, b) => b.count - a.count);
  
  return {
    total: files.length,
    filtered: nonCriticalFiles.length,
    highPriority: highPriorityFiles.length,
    items: {
      highPriority: highPriorityFiles.slice(0, 50),
      byDirectory: directoryCounts.slice(0, 20),
      groupedByDirectory: Object.fromEntries(
        directoryCounts.slice(0, 10).map(({ dir }) => [dir, groupedByDirectory[dir]])
      )
    }
  };
}

function formatImportList(imports) {
  return imports.map(item => 
    `- **${item.file}** (${item.count} unused imports):\n  ${item.imports.join(', ')}`
  ).join('\n\n');
}

function formatFileList(files) {
  return files.map(file => `- ${file}`).join('\n');
}

function formatDirectoryCounts(directoryCounts) {
  return directoryCounts.map(({ dir, count }) => 
    `- **${dir}**: ${count} files`
  ).join('\n');
}

function formatGroupedByDirectory(groupedByDirectory) {
  let result = '';
  for (const [dir, files] of Object.entries(groupedByDirectory)) {
    result += `### ${dir}\n\n`;
    result += files.map(file => `- ${file}`).join('\n');
    result += '\n\n';
  }
  return result;
}

async function generateCleanupPlan(importsAnalysis, filesAnalysis) {
  const cleanupPlanPath = path.join(PROJECT_ROOT, 'CLEANUP-PRIORITIZED.md');
  
  const content = `# Prioritized Cleanup Plan for The New Fuse

## Summary

- **Unused Imports**: ${importsAnalysis.total} total, ${importsAnalysis.filtered} after filtering
- **Unused Files**: ${filesAnalysis.total} total, ${filesAnalysis.filtered} after filtering
- **High Priority Items**: ${importsAnalysis.highPriority} imports, ${filesAnalysis.highPriority} files

## Action Plan

1. **First Pass**: Review the high-priority unused imports and files
2. **Second Pass**: Focus on directories with many unused files
3. **Final Pass**: Address remaining items in small batches

## High-Priority Unused Imports

${formatImportList(importsAnalysis.items.highPriority)}

## High-Priority Unused Files

${formatFileList(filesAnalysis.items.highPriority)}

## Directories with Most Unused Files

${formatDirectoryCounts(filesAnalysis.items.byDirectory)}

## Detailed Breakdown by Directory

${formatGroupedByDirectory(filesAnalysis.items.groupedByDirectory)}

## Recommendations

1. Start by manually reviewing the high-priority unused imports listed above
2. For each directory with many unused files, check if the entire module can be consolidated or removed
3. Use the incremental approach from \`CLEANUP-EXECUTION.md\` to gradually implement changes
4. Run tests after each batch of changes to ensure functionality is preserved
5. Consider automated testing coverage to identify code that is truly unused

## Note

This report has automatically excluded:
- Type declaration files (*.d.ts)
- Test files and directories
- Index files (which often re-export things)
- Critical configuration files

Remember that automated detection of unused code has limitations and may produce false positives.
Always verify before removing code.

Generated on ${new Date().toISOString().split('T')[0]}
`;

  await writeFile(cleanupPlanPath, content);
}

async function main() {
  console.log('Analyzing results from cleanup process...');
  
  const importsAnalysis = await analyzeUnusedImports();
  console.log(`Analyzed ${importsAnalysis.total} unused imports, ${importsAnalysis.filtered} after filtering`);
  
  const filesAnalysis = await analyzeUnusedFiles();
  console.log(`Analyzed ${filesAnalysis.total} unused files, ${filesAnalysis.filtered} after filtering`);
  
  await generateCleanupPlan(importsAnalysis, filesAnalysis);
  
  console.log('Analysis complete. See CLEANUP-PRIORITIZED.md for results.');
}

main().catch(console.error);
