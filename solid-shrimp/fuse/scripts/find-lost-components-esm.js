#!/usr/bin/env node

/**
 * find-lost-components-esm.js
 * 
 * This script recursively searches the project structure for potentially lost pages and UI components.
 * It identifies UI components and pages based on file extensions and content patterns,
 * and checks if they're properly referenced elsewhere in the project.
 * 
 * All results are logged to a file for later analysis.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { promisify } from 'util';

// Get current file and directory paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Convert fs functions to promise-based
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

// Configuration
const config = {
  // Directories to search for components and pages
  searchDirs: [
    'apps/frontend/src',
    'packages/core/components',
    'packages/features',
    'packages/layout',
    'packages/shared/components',
    'packages/ui-components',
    'packages/ui'
  ],
  // Directories to exclude from search
  excludeDirs: [
    'node_modules',
    'dist',
    'build',
    '.git',
    'backups'
  ],
  // File extensions to consider as UI components or pages
  componentExtensions: ['.tsx', '.jsx'],
  // Patterns that indicate a file is a component or page
  componentPatterns: [
    /export\s+(default\s+)?((function|class|const|let|var)\s+\w+|\w+)\s*(?:=\s*)?(?:function\s*)?\([^)]*\)\s*(?:=>)?\s*\{/,
    /extends\s+React\.Component/,
    /extends\s+Component/,
    /<[A-Z][A-Za-z0-9]*\s+/,
    /React\.createElement/,
    /import\s+.*?\s+from\s+['"]react['"]/ // Files importing React are likely components
  ],
  // Output file for results
  outputFile: 'component-analysis-results.json',
  // Log file for detailed results
  logFile: 'component-analysis-log.txt'
};

/**
 * Main function
 */
async function main() {
  const startTime = Date.now();
  
  // Get project root directory (parent of scripts directory)
  const projectRoot = path.resolve(__dirname, '..');
  
  console.log(`Component Analysis - ${new Date().toISOString()}`);
  console.log(`Project root: ${projectRoot}`);
  
  let logContent = `Component Analysis Log - ${new Date().toISOString()}\n\n`;
  logContent += `Project root: ${projectRoot}\n\n`;
  
  // Initialize results object
  const results = {
    components: [],
    pages: [],
    potentiallyLost: [],
    stats: {
      totalComponents: 0,
      totalPages: 0,
      potentiallyLostCount: 0,
      searchTime: 0
    }
  };
  
  // Process each search directory
  for (const searchDir of config.searchDirs) {
    const fullPath = path.join(projectRoot, searchDir);
    if (!fs.existsSync(fullPath)) {
      console.log(`Warning: Directory ${fullPath} does not exist, skipping.`);
      logContent += `Warning: Directory ${fullPath} does not exist, skipping.\n`;
      continue;
    }
    
    console.log(`Scanning directory: ${searchDir}`);
    logContent += `\nScanning directory: ${searchDir}\n`;
    
    // Find all component and page files
    const files = await findFiles(fullPath, config.componentExtensions);
    console.log(`Found ${files.length} potential component files in ${searchDir}`);
    logContent += `Found ${files.length} potential component files\n`;
    
    // Analyze each file
    for (const file of files) {
      const relativeFilePath = path.relative(projectRoot, file);
      const analysisResult = await analyzeFile(file, projectRoot);
      
      if (analysisResult.isComponent) {
        results.components.push({
          path: relativeFilePath,
          name: analysisResult.name,
          type: analysisResult.type,
          referencedBy: analysisResult.referencedBy
        });
        
        if (analysisResult.type === 'page') {
          results.pages.push({
            path: relativeFilePath,
            name: analysisResult.name,
            referencedBy: analysisResult.referencedBy
          });
          results.stats.totalPages++;
        } else {
          results.stats.totalComponents++;
        }
        
        // Check if potentially lost (not referenced elsewhere)
        if (analysisResult.referencedBy.length === 0) {
          results.potentiallyLost.push({
            path: relativeFilePath,
            name: analysisResult.name,
            type: analysisResult.type
          });
          results.stats.potentiallyLostCount++;
          
          logContent += `POTENTIALLY LOST: ${relativeFilePath} (${analysisResult.name})\n`;
        } else {
          logContent += `Component: ${relativeFilePath} (${analysisResult.name}) - Referenced by ${analysisResult.referencedBy.length} files\n`;
        }
      }
    }
  }
  
  // Calculate search time
  results.stats.searchTime = (Date.now() - startTime) / 1000;
  
  // Add summary to log
  logContent += `\n\nSUMMARY:\n`;
  logContent += `Total components found: ${results.stats.totalComponents}\n`;
  logContent += `Total pages found: ${results.stats.totalPages}\n`;
  logContent += `Potentially lost components/pages: ${results.stats.potentiallyLostCount}\n`;
  logContent += `Search completed in ${results.stats.searchTime} seconds\n`;
  
  // Write results to files
  await writeFile(path.join(projectRoot, config.outputFile), JSON.stringify(results, null, 2));
  await writeFile(path.join(projectRoot, config.logFile), logContent);
  
  console.log(`\nAnalysis complete!`);
  console.log(`Total components found: ${results.stats.totalComponents}`);
  console.log(`Total pages found: ${results.stats.totalPages}`);
  console.log(`Potentially lost components/pages: ${results.stats.potentiallyLostCount}`);
  console.log(`Search completed in ${results.stats.searchTime} seconds`);
  console.log(`\nResults written to ${config.outputFile} and ${config.logFile}`);
}

/**
 * Find all files with specified extensions in a directory and its subdirectories
 */
async function findFiles(dir, extensions) {
  const files = [];
  
  // Read directory contents
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    
    // Process each entry
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        // Skip excluded directories
        if (config.excludeDirs.includes(entry.name)) {
          continue;
        }
        
        // Recursively search subdirectories
        const subDirFiles = await findFiles(fullPath, extensions);
        files.push(...subDirFiles);
      } else if (entry.isFile()) {
        // Check if file has a component extension
        const ext = path.extname(entry.name).toLowerCase();
        if (extensions.includes(ext)) {
          files.push(fullPath);
        }
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error);
  }
  
  return files;
}

/**
 * Analyze a file to determine if it's a component and extract information
 */
async function analyzeFile(filePath, projectRoot) {
  const result = {
    isComponent: false,
    name: path.basename(filePath, path.extname(filePath)),
    type: 'component', // Default type, may be changed to 'page'
    referencedBy: []
  };
  
  try {
    // Read file content
    const content = await readFile(filePath, 'utf8');
    
    // Check if it's a component based on patterns
    for (const pattern of config.componentPatterns) {
      if (pattern.test(content)) {
        result.isComponent = true;
        break;
      }
    }
    
    // Determine if it's a page based on path or content
    if (result.isComponent) {
      const relativePath = path.relative(projectRoot, filePath);
      if (
        relativePath.includes('/pages/') ||
        relativePath.includes('/page/') ||
        content.includes('useRouter') ||
        content.includes('useParams') ||
        content.includes('useLocation')
      ) {
        result.type = 'page';
      }
      
      // Find references to this component in other files
      result.referencedBy = await findReferences(filePath, projectRoot);
    }
  } catch (error) {
    console.error(`Error analyzing file ${filePath}:`, error);
  }
  
  return result;
}

/**
 * Find references to a component in other files
 */
async function findReferences(filePath, projectRoot) {
  const references = [];
  const componentName = path.basename(filePath, path.extname(filePath));
  const relativeFilePath = path.relative(projectRoot, filePath);
  const componentDir = path.dirname(filePath);
  
  // Skip index files when looking for references by name
  // (they're usually just re-exports and would give false positives)
  const skipNameCheck = componentName.toLowerCase() === 'index';
  
  // Patterns to search for
  const importPatterns = [
    // Direct import by name
    new RegExp(`import\\s+.*?\\b${componentName}\\b.*?from`, 'g'),
    // Import from directory
    new RegExp(`import\\s+.*?from\\s+['"].*?${path.dirname(relativeFilePath).replace(/\\/g, '/')}['"]`, 'g'),
    // JSX usage
    new RegExp(`<\\s*${componentName}[\\s>]`, 'g'),
    // React.createElement usage
    new RegExp(`React\\.createElement\\(\\s*${componentName}`, 'g')
  ];
  
  // Search for references in all component files
  for (const searchDir of config.searchDirs) {
    const fullSearchPath = path.join(projectRoot, searchDir);
    if (!fs.existsSync(fullSearchPath)) continue;
    
    const files = await findFiles(fullSearchPath, config.componentExtensions);
    
    for (const file of files) {
      // Skip self-references
      if (file === filePath) continue;
      
      try {
        const content = await readFile(file, 'utf8');
        let isReferenced = false;
        
        // Check for import by relative path
        const relativePath = path.relative(path.dirname(file), filePath)
          .replace(/\\/g, '/') // Normalize path separators
          .replace(/\.[jt]sx?$/, ''); // Remove extension
        
        if (content.includes(`from './${relativePath}.js'`) || 
            content.includes(`from './${relativePath}.js'`) ||
            content.includes(`from '../${relativePath}.js'`) ||
            content.includes(`from '../${relativePath}.js'`)) {
          isReferenced = true;
        }
        
        // Check other patterns if not already found and not an index file
        if (!isReferenced && !skipNameCheck) {
          for (const pattern of importPatterns) {
            if (pattern.test(content)) {
              isReferenced = true;
              break;
            }
          }
        }
        
        if (isReferenced) {
          references.push(path.relative(projectRoot, file));
        }
      } catch (error) {
        console.error(`Error checking references in ${file}:`, error);
      }
    }
  }
  
  return references;
}

// Run the main function
main().catch(error => {
  console.error('Error running component analysis:', error);
  process.exit(1);
});
