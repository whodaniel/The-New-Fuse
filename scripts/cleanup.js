/**
 * Analysis and Cleanup Script for The New Fuse
 */

import path from 'path';
import {
  EXCLUDE_DIRS,
  findFiles,
  getFileLineCount,
  getGitLastModifiedDate,
  grepFiles,
} from './utils/fs-utils.js';

async function findUnusedFiles() {
  try {
    const allSourceFiles = await findFiles(['*.ts', '*.tsx', '*.js', '*.jsx'], EXCLUDE_DIRS);

    const exportingFiles = [];
    for (const file of allSourceFiles) {
      const content = await grepFiles('export', [path.basename(file)], [], path.dirname(file)); // Only grep in the file itself
      if (content) {
        exportingFiles.push(file);
      }
    }

    for (const file of exportingFiles) {
      const basename = path.basename(file, path.extname(file));
      const importResults = await grepFiles(
        `import.*${basename}`,
        ['*.ts', '*.tsx', '*.js', '*.jsx'],
        EXCLUDE_DIRS
      );

      if (!importResults.trim()) {
        console.log(`Potential unused file: ${file}`);
      }
    }
  } catch (error) {
    console.error('Error finding unused files:', error);
  }
}

async function findDuplicateCode() {
  // Simple pattern-based duplication finder
  // In a real scenario, you might want to use a tool like jscpd
  try {
    const functionLines = await grepFiles(
      'function ',
      ['*.ts', '*.tsx', '*.js', '*.jsx'],
      EXCLUDE_DIRS
    );
    const lines = functionLines.split('\n').filter(Boolean);

    const functionNames = {};
    lines.forEach((line) => {
      const match = line.match(/function\s+([a-zA-Z0-9_]+)/);
      if (match && match[1]) {
        functionNames[match[1]] = (functionNames[match[1]] || 0) + 1;
      }
    });

    console.log('Top 20 potentially duplicated function names:');
    Object.entries(functionNames)
      .filter(([, count]) => count > 1)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .forEach(([name, count]) => {
        console.log(`- ${name}: ${count} occurrences`);
      });
  } catch (error) {
    console.error('Error finding duplicate code:', error);
  }
}

async function checkDocumentationSync() {
  try {
    const readmeFiles = await findFiles(['README.md']);

    for (const readme of readmeFiles) {
      const dir = path.dirname(readme);
      const readmeDate = await getGitLastModifiedDate(readme);

      const codeFilesInDir = await findFiles(
        ['*.ts', '*.tsx', '*.js', '*.jsx'],
        EXCLUDE_DIRS.concat(['README.md', '*.md']), // Exclude README and other markdown from code comparison
        dir
      );

      let latestCodeDate = null;
      for (const codeFile of codeFilesInDir) {
        const codeFileDate = await getGitLastModifiedDate(codeFile);
        if (codeFileDate && (!latestCodeDate || codeFileDate > latestCodeDate)) {
          latestCodeDate = codeFileDate;
        }
      }

      if (readmeDate && latestCodeDate && readmeDate < latestCodeDate) {
        console.log(
          `Documentation might be out of sync for ${readme}. Last code change: ${latestCodeDate.toDateString()}, Last README change: ${readmeDate.toDateString()}`
        );
      }
    }
  } catch (error) {
    console.error('Error checking documentation sync:', error);
  }
}

async function analyzeDependencyGraph() {
  try {
    const importLines = await grepFiles(
      'import.*from',
      ['*.ts', '*.tsx', '*.js', '*.jsx'],
      EXCLUDE_DIRS
    );

    const imports = {};
    const lines = importLines.split('\n').filter(Boolean);

    for (const line of lines) {
      const parts = line.split(':', 2);
      if (parts.length < 2) continue; // Skip malformed lines

      const [filePath, importStatement] = parts;
      if (!imports[filePath]) {
        imports[filePath] = [];
      }

      const match = importStatement.match(/from ['"]([^'"]+)['"]/);
      if (match && match[1]) {
        imports[filePath].push(match[1]);
      }
    }

    const importCounts = {};
    Object.values(imports).forEach((moduleImports) => {
      moduleImports.forEach((importPath) => {
        importCounts[importPath] = (importCounts[importPath] || 0) + 1;
      });
    });

    const sortedImports = Object.entries(importCounts)
      .filter(([module, count]) => count > 2)
      .sort((a, b) => b[1] - a[1]);

    console.log('Top 10 highly connected modules (potential refactoring candidates):');
    sortedImports.slice(0, 10).forEach(([module, count]) => {
      console.log(`- ${module}: imported in ${count} files`);
    });
  } catch (error) {
    console.error('Error analyzing dependency graph:', error);
  }
}

async function checkNamingConsistency() {
  try {
    const components = await findFiles(['*.tsx', '*.jsx'], EXCLUDE_DIRS);
    const namingPatterns = {};

    for (const component of components) {
      const basename = path.basename(component).split('.')[0]; // Get name without extension
      // Extract the naming pattern (e.g., PascalCase, camelCase)
      const pattern = basename.match(/^[A-Z][a-zA-Z0-9]*$/)
        ? 'PascalCase'
        : basename.match(/^[a-z][a-zA-Z0-9]*$/)
          ? 'camelCase'
          : 'other';

      namingPatterns[pattern] = (namingPatterns[pattern] || 0) + 1;
    }

    console.log('Component Naming Consistency:');
    Object.entries(namingPatterns).forEach(([pattern, count]) => {
      console.log(`- ${pattern}: ${count} components`);
    });

    if (
      Object.keys(namingPatterns).length > 1 &&
      namingPatterns['other'] !== Object.keys(namingPatterns).length
    ) {
      // Adjusted condition
      console.warn(
        '⚠️ Inconsistent component naming patterns detected. Consider standardizing (e.g., all PascalCase for components).'
      );
    }
  } catch (error) {
    console.error('Error checking naming consistency:', error);
  }
}

async function analyzeComponentComplexity() {
  try {
    const components = await findFiles(['*.tsx', '*.jsx'], EXCLUDE_DIRS);
    const complexityResults = [];

    for (const component of components) {
      const lines = await getFileLineCount(component);

      // Count hooks as another complexity indicator
      const hookContent = await grepFiles(
        'use[A-Z]',
        [path.basename(component)],
        [],
        path.dirname(component)
      );
      const hooks = hookContent.split('\n').filter(Boolean).length;

      complexityResults.push({
        component,
        lines,
        hooks,
        complexity: lines + hooks * 10,
      });
    }

    complexityResults.sort((a, b) => b.complexity - a.complexity);

    console.log('Top 10 most complex components (potential refactoring candidates):');
    complexityResults.slice(0, 10).forEach((result) => {
      console.log(
        `- ${result.component}: Lines=${result.lines}, Hooks=${result.hooks}, Complexity Score=${result.complexity}`
      );
    });
  } catch (error) {
    console.error('Error analyzing component complexity:', error);
  }
}

async function main() {
  console.log('\n--- Running Codebase Analysis for Refactoring ---\n');

  console.log('\n--- Unused Files Check ---\n');
  await findUnusedFiles();

  console.log('\n--- Duplicate Code Check ---\n');
  await findDuplicateCode();

  console.log('\n--- Documentation Sync Check ---\n');
  await checkDocumentationSync();

  console.log('\n--- Dependency Graph Analysis ---\n');
  await analyzeDependencyGraph();

  console.log('\n--- Naming Consistency Check ---\n');
  await checkNamingConsistency();

  console.log('\n--- Component Complexity Analysis ---\n');
  await analyzeComponentComplexity();

  console.log('\n--- Codebase Analysis Complete ---\n');
}

main().catch(console.error);
