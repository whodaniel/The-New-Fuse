/**
 * Cleanup Script for The New Fuse
 */

import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';

// ES modules don't have __dirname, so we need to create it
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const execPromise = promisify(exec);
const PROJECT_ROOT = path.resolve(__dirname, '..');

// Directories to exclude from analysis
const EXCLUDE_DIRS = ['node_modules', '.git', 'dist', 'build', 'coverage', 'cleanup-backups', 'reports'];

async function findUnusedFiles() {
  
  );
  
  // Add exclusion flags for find command with proper path quoting
  const excludeFlags = EXCLUDE_DIRS.map(dir => `-not -path "*/${dir}/*"`).join(' ');
  
  try {
    const { stdout } = await execPromise(
      `find "${PROJECT_ROOT}" ${excludeFlags} -type f -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | xargs grep -l "export" | sort`,
      { cwd: PROJECT_ROOT }
    );
    
    const exportingFiles = stdout.split('\n').filter(Boolean);
    
    for (const file of exportingFiles) {
      const basename = path.basename(file, path.extname(file));
      const { stdout: importResults } = await execPromise(
        `grep -r "import.*${basename}" ${PROJECT_ROOT} --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" || true`,
        { cwd: PROJECT_ROOT }
      );
      
      if (!importResults.trim()) {
        
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
    // Find files with similar function names as a starting point
    const { stdout } = await execPromise(
      `grep -r "function" ${PROJECT_ROOT} --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" | sort | uniq -c | sort -nr | head -20`,
      { cwd: PROJECT_ROOT }
    );
    
    :');
    
  } catch (error) {
    console.error('Error finding duplicate code:', error);
  }
}

async function checkDocumentationSync() {

  try {
    // Find README files and their last modification dates
    const { stdout: readmeFiles } = await execPromise(
      `find ${PROJECT_ROOT} -name "README.md"`,
      { cwd: PROJECT_ROOT }
    );
    
    const readmes = readmeFiles.split('\n').filter(Boolean);
    
    for (const readme of readmes) {
      const dir = path.dirname(readme);
      const { stdout: readmeDate } = await execPromise(`git log -1 --format=%cd ${readme}`, { cwd: PROJECT_ROOT });
      const { stdout: codeDate } = await execPromise(
        `find ${dir} -type f -not -path "*/node_modules/*" -not -name "README.md" -not -name "*.md" | xargs git log -1 --format=%cd {} | sort -r | head -1`, 
        { cwd: PROJECT_ROOT }
      );
      
      if (new Date(readmeDate) < new Date(codeDate)) {
        
        }`);
        }`);
      }
    }
  } catch (error) {
    console.error('Error checking documentation sync:', error);
  }
}

async function analyzeDependencyGraph() {

  try {
    // Create a map of imports across the codebase
    const { stdout: importLines } = await execPromise(
      `grep -r "import.*from" ${PROJECT_ROOT} --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx"`,
      { cwd: PROJECT_ROOT }
    );
    
    const imports = {};
    const lines = importLines.split('\n').filter(Boolean);
    
    for (const line of lines) {
      const [filePath, importStatement] = line.split(':', 2);
      if (!imports[filePath]) {
        imports[filePath] = [];
      }
      
      // Extract the module being imported
      const match = importStatement.match(/from ['"]([^'"]+)['"]/);
      if (match && match[1]) {
        imports[filePath].push(match[1]);
      }
    }
    
    // Find highly connected components (potential refactoring candidates)
    const importCounts = {};
    Object.values(imports).forEach(moduleImports => {
      moduleImports.forEach(importPath => {
        importCounts[importPath] = (importCounts[importPath] || 0) + 1;
      });
    });
    
    // Sort by import count
    const sortedImports = Object.entries(importCounts)
      .filter(([module, count]) => count > 2) // Only show modules imported in more than 2 files
      .sort((a, b) => b[1] - a[1]);
    
    :');
    sortedImports.forEach(([module, count]) => {
      
    });
    
  } catch (error) {
    console.error('Error analyzing dependency graph:', error);
  }
}

async function checkNamingConsistency() {

  try {
    // Check component naming patterns
    const { stdout: componentFiles } = await execPromise(
      `find ${PROJECT_ROOT} -type f -name "*.tsx" -o -name "*.jsx"`,
      { cwd: PROJECT_ROOT }
    );
    
    const components = componentFiles.split('\n').filter(Boolean);
    const namingPatterns = {};
    
    for (const component of components) {
      const basename = path.basename(component);
      // Extract the naming pattern (e.g., PascalCase, camelCase)
      const pattern = basename.match(/^[A-Z]/) ? 'PascalCase' : 
                     basename.match(/^[a-z][a-zA-Z0-9]*$/) ? 'camelCase' : 'other';
      
      namingPatterns[pattern] = (namingPatterns[pattern] || 0) + 1;
    }

    Object.entries(namingPatterns).forEach(([pattern, count]) => {
      
    });
    
    // If there's a mix, flag it as an inconsistency
    if (Object.keys(namingPatterns).length > 1) {
      
    }
    
  } catch (error) {
    console.error('Error checking naming consistency:', error);
  }
}

async function analyzeComponentComplexity() {

  try {
    // Find component files
    const { stdout: componentFiles } = await execPromise(
      `find ${PROJECT_ROOT} -type f -name "*.tsx" -o -name "*.jsx"`,
      { cwd: PROJECT_ROOT }
    );
    
    const components = componentFiles.split('\n').filter(Boolean);
    const complexityResults = [];
    
    for (const component of components) {
      // Count lines as a simple proxy for complexity
      const { stdout: lineCount } = await execPromise(`wc -l ${component}`, { cwd: PROJECT_ROOT });
      const lines = parseInt(lineCount.trim().split(' ')[0], 10);
      
      // Count hooks as another complexity indicator
      const { stdout: hookCount } = await execPromise(
        `grep -c "use[A-Z]" ${component} || echo "0"`,
        { cwd: PROJECT_ROOT }
      );
      const hooks = parseInt(hookCount.trim(), 10);
      
      complexityResults.push({
        component,
        lines,
        hooks,
        // Simple complexity score
        complexity: lines + (hooks * 10)
      });
    }
    
    // Sort by complexity
    complexityResults.sort((a, b) => b.complexity - a.complexity);
    
    :');
    complexityResults.slice(0, 10).forEach((result, index) => {
      }`);
      
    });
    
  } catch (error) {
    console.error('Error analyzing component complexity:', error);
  }
}

async function main() {

  await findUnusedFiles();

  await findDuplicateCode();

  await checkDocumentationSync();

  await analyzeDependencyGraph();

  await checkNamingConsistency();

  await analyzeComponentComplexity();

}

main().catch(console.error);
