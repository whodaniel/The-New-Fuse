#!/usr/bin/env node

/**
 * Codebase Auditor
 * 
 * A comprehensive tool to identify ghost code and validate navigation integrity
 * in the New Fuse codebase. This helps maintain code quality and ensures a
 * coherent user experience.
 */

import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

// Get configuration from environment variables (set by wrapper script)
const envDir = process.env.AUDIT_DIR;
const envQuickMode = process.env.AUDIT_QUICK === 'true';
const envOutputFile = process.env.AUDIT_OUTPUT;
const envSkipNav = process.env.AUDIT_ANALYZE_NAV === 'false';
const envSkipComponents = process.env.AUDIT_ANALYZE_COMPONENTS === 'false';

// Parse command line arguments
const args = process.argv.slice(2);
let dirFromArgs = null;

for (const arg of args) {
  if (arg.startsWith('--scan=')) {
    dirFromArgs = arg.replace('--scan=', '');
  }
}

// Configuration options
const CONFIG = {
  rootDir: dirFromArgs || envDir || process.cwd(),
  excludeDirs: ['node_modules', 'dist', '.git', '.turbo', 'coverage'],
  excludeFiles: ['.DS_Store', '.gitignore', 'yarn-error.log'],
  extensions: ['.js', '.jsx', '.ts', '.tsx', '.md', '.json', '.yml', '.yaml'],
  navigationFiles: ['**/*.tsx', '**/*.jsx', '**/routes.*', '**/navigation.*'],
  reportOutput: envOutputFile || 'codebase-audit-report.md',
  includeStats: true,
  scanForDeadCode: true,
  scanForBrokenLinks: !envSkipNav,
  validateNavigationFlow: !envSkipNav,
  analyzeComponentRelationships: !envSkipComponents,
  quickMode: envQuickMode,
};

// Main function
async function runAudit() {
  console.log(`\n🔍 Starting The New Fuse Codebase Audit on ${CONFIG.rootDir}\n`);
  const startTime = Date.now();
  const report = [];
  let deadCodeResults;

  // Step 1: Scan codebase structure
  console.log('📂 Scanning codebase structure...');
  const fileTree = await scanDirectory(CONFIG.rootDir);
  report.push('## 1. Codebase Structure Overview');
  report.push(`Total files scanned: ${fileTree.totalFiles}`);
  report.push(`Total directories: ${fileTree.totalDirs}`);
  
  // Step 2: Identify potential ghost code
  if (CONFIG.scanForDeadCode) {
    console.log('👻 Scanning for ghost code...');
    deadCodeResults = await findDeadCode(fileTree.files);
    report.push('\n## 2. Potential Ghost Code');
    
    if (deadCodeResults.unusedFiles.length === 0 && deadCodeResults.unusedExports.length === 0) {
      report.push('No ghost code identified. All files and exports appear to be in use.');
    } else {
      if (deadCodeResults.unusedFiles.length > 0) {
        report.push('\n### Potentially Unused Files:');
        deadCodeResults.unusedFiles.forEach(file => {
          report.push(`- \`${file}\``);
        });
      }
      
      if (deadCodeResults.unusedExports.length > 0) {
        report.push('\n### Potentially Unused Exports:');
        deadCodeResults.unusedExports.forEach(item => {
          report.push(`- \`${item.export}\` in \`${item.file}\``);
        });
      }
    }
  }
  
  // Step 3: Validate navigation integrity (skip if not needed)
  if (CONFIG.validateNavigationFlow) {
    console.log('🧭 Validating navigation integrity...');
    const navigationResults = await validateNavigation(fileTree.files);
    report.push('\n## 3. Navigation Integrity');
    
    if (navigationResults.issues.length === 0) {
      report.push('All navigation paths appear to be valid and complete.');
    } else {
      report.push('### Navigation Issues:');
      navigationResults.issues.forEach(issue => {
        report.push(`- **${issue.type}**: ${issue.description} in \`${issue.file}\``);
      });
    }
    
    report.push('\n### Navigation Flow Map:');
    report.push('```');
    report.push(navigationResults.flowMap);
    report.push('```');
  }
  
  // Step 4: Analyze component relationships
  if (CONFIG.analyzeComponentRelationships && !CONFIG.quickMode) {
    console.log('🔗 Analyzing component relationships...');
    const compResults = await analyzeComponentRelationships(fileTree.files);
    report.push('\n## 4. Component Relationship Analysis');
    // identify isolated components
    const isolatedComponents = [];
    for (const comp of compResults.keyComponents) {
      const usageCount = comp.usageCount;
      const depCount = comp.dependencies.length;
      if (usageCount === 0 && depCount === 0) {
        isolatedComponents.push(comp.name);
      }
    }
    report.push('### Isolated Components (no usage and no dependencies)');
    if (isolatedComponents.length) {
      isolatedComponents.forEach(name => report.push(`- ${name}`));
    } else {
      report.push('- None detected');
    }
  }
  
  // Step 5: Generate recommendations
  console.log('📝 Generating recommendations...');
  const recommendations = generateRecommendations({
    deadCode: CONFIG.scanForDeadCode ? deadCodeResults : null,
    navigation: CONFIG.validateNavigationFlow ? { issues: [] } : null,
    relationships: CONFIG.analyzeComponentRelationships && !CONFIG.quickMode ? { keyComponents: [] } : null
  });
  
  report.push('\n## 5. Recommendations');
  if (recommendations.length === 0) {
    report.push('No specific recommendations at this time. The codebase appears well-maintained.');
  } else {
    recommendations.forEach((rec, index) => {
      report.push(`### Recommendation ${index + 1}: ${rec.title}`);
      report.push(rec.description);
      if (rec.actions && rec.actions.length > 0) {
        report.push('\nSuggested actions:');
        rec.actions.forEach(action => {
          report.push(`- ${action}`);
        });
      }
      report.push('');
    });
  }
  
  // Write report to file
  const reportPath = path.join(process.cwd(), CONFIG.reportOutput);
  fs.writeFileSync(reportPath, report.join('\n'));
  
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);
  
  console.log(`\n✅ Audit completed in ${duration} seconds`);
  console.log(`📊 Report saved to: ${CONFIG.reportOutput}`);
  
}

/**
 * Scans a directory recursively to build a file tree
 */
async function scanDirectory(dir, basePath = '') {
  const result = {
    files: [],
    totalFiles: 0,
    totalDirs: 0
  };
  
  try {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const itemPath = path.join(dir, item);
      const relativePath = path.join(basePath, item);
      
      try {
        const stats = fs.statSync(itemPath);
        
        if (stats.isDirectory()) {
          if (!CONFIG.excludeDirs.includes(item)) {
            result.totalDirs++;
            const subResult = await scanDirectory(itemPath, relativePath);
            result.files = result.files.concat(subResult.files);
            result.totalFiles += subResult.totalFiles;
            result.totalDirs += subResult.totalDirs;
          }
        } else if (stats.isFile()) {
          if (!CONFIG.excludeFiles.includes(item) && CONFIG.extensions.includes(path.extname(item))) {
            result.files.push({
              path: itemPath,
              relativePath: relativePath,
              extension: path.extname(item),
              size: stats.size,
              lastModified: stats.mtime,
              unused: false // Will be marked as unused if appropriate
            });
            result.totalFiles++;
          }
        }
      } catch (error) {
        // Skip files with permission issues or other stat errors
        console.warn(`Warning: Could not access ${itemPath}: ${error.message}`);
      }
    }
    
    return result;
  } catch (error) {
    console.error(`Error scanning directory ${dir}: ${error.message}`);
    return result;
  }
}

/**
 * Finds potential dead/ghost code in the codebase
 */
async function findDeadCode(files) {
  const result = {
    unusedFiles: [],
    unusedExports: []
  };
  
  try {
    // Get all imports across the codebase
    const allImports = new Set();
    const exports = [];
    
    // First scan: collect all imports and exports
    for (const file of files) {
      if (['.js', '.jsx', '.ts', '.tsx'].includes(file.extension)) {
        try {
          const content = fs.readFileSync(file.path, 'utf8');
          
          // Extract imports
          const importMatches = content.matchAll(/import\s+(?:.+\s+from\s+)?['"]([^'"]+)['"]/g);
          for (const match of Array.from(importMatches)) {
            const importPath = match[1];
            if (!importPath.startsWith('.')) continue; // Skip package imports
            
            allImports.add(resolveImportPath(importPath, file.path));
          }
          
          // Extract exports
          const exportMatches = content.matchAll(/export\s+(?:const|let|var|function|class|interface|type|enum)\s+([a-zA-Z0-9_$]+)/g);
          for (const match of Array.from(exportMatches)) {
            exports.push({
              file: file.relativePath,
              export: match[1]
            });
          }
        } catch (error) {
          console.warn(`Warning: Could not analyze ${file.path}: ${error.message}`);
        }
      }
    }
    
    // Second scan: identify unused files
    for (const file of files) {
      if (['.js', '.jsx', '.ts', '.tsx'].includes(file.extension)) {
        // Skip entry points and special files
        if (file.relativePath.includes('index.') || 
            file.relativePath.includes('main.') || 
            file.relativePath.includes('App.')) {
          continue;
        }
        
        const normalizedPath = file.path.replace(/\.[^/.]+$/, '');
        if (!allImports.has(normalizedPath)) {
          result.unusedFiles.push(file.relativePath);
          file.unused = true; // Mark file as unused
        }
      }
    }
    
    // Limit results in quick mode
    if (CONFIG.quickMode && result.unusedFiles.length > 20) {
      result.unusedFiles = result.unusedFiles.slice(0, 20);
      console.log(`Note: Limited to showing 20 of ${result.unusedFiles.length} potentially unused files in quick mode.`);
    }
    
    return result;
  } catch (error) {
    console.error(`Error finding dead code: ${error.message}`);
    return result;
  }
}

/**
 * Resolves a relative import path to an absolute path
 */
function resolveImportPath(importPath, currentFile) {
  const dir = path.dirname(currentFile);
  let resolvedPath = path.resolve(dir, importPath);
  
  // Handle directory imports (index files)
  if (!path.extname(resolvedPath)) {
    resolvedPath = path.join(resolvedPath, 'index');
  }
  
  return resolvedPath;
}

/**
 * Validates navigation integrity across the application
 */
async function validateNavigation(files) {
  const result = {
    issues: [],
    flowMap: 'Application Navigation Structure:\n',
    routeMap: new Map()
  };
  
  try {
    // Identify navigation files
    const navFiles = files.filter(file => {
      return file.relativePath.includes('route') || 
             file.relativePath.includes('navigation') ||
             file.relativePath.includes('menu') || 
             file.relativePath.includes('link');
    });
    
    // Limited scan in quick mode
    const filesToScan = CONFIG.quickMode ? navFiles.slice(0, 20) : navFiles;
    
    // Extract routes and navigation structures
    for (const file of filesToScan) {
      try {
        const content = fs.readFileSync(file.path, 'utf8');
        
        // Process React Router routes
        if (content.includes('Route') || content.includes('Routes')) {
          const routeMatches = content.matchAll(/[<\s]Route[^>]*path=["']([^"']+)["'][^>]*component=\{([^}]+)\}/g);
          for (const match of Array.from(routeMatches)) {
            result.routeMap.set(match[1], {
              component: match[2],
              file: file.relativePath
            });
          }
          
          // Also check for newer React Router syntax
          const newRouteMatches = content.matchAll(/path:\s*["']([^"']+)["']/g);
          for (const match of Array.from(newRouteMatches)) {
            result.routeMap.set(match[1], {
              file: file.relativePath
            });
          }
        }
        
        // Check for link consistency
        const linkMatches = content.matchAll(/[<\s]Link[^>]*to=["']([^"']+)["']/g);
        for (const match of Array.from(linkMatches)) {
          const linkTarget = match[1];
          
          // Skip external links and dynamic routes
          if (linkTarget.startsWith('http') || linkTarget.includes(':')) continue;
          
          // Check if this route is defined
          if (!result.routeMap.has(linkTarget) && !linkTarget.startsWith('/')) {
            result.issues.push({
              type: 'Broken Link',
              description: `Link target "${linkTarget}" is not defined in any route`,
              file: file.relativePath
            });
          }
        }
      } catch (error) {
        console.warn(`Warning: Could not analyze navigation in ${file.path}: ${error.message}`);
      }
    }
    
    // Build navigation flow map
    result.flowMap += '\n';
    result.routeMap.forEach((route, path) => {
      result.flowMap += `${path} -> ${route.component || 'Component'} (${route.file})\n`;
    });
    
    return result;
  } catch (error) {
    console.error(`Error validating navigation: ${error.message}`);
    return {
      issues: [],
      flowMap: 'Error generating flow map',
      routeMap: new Map()
    };
  }
}

/**
 * Analyzes component relationships and dependencies
 */
async function analyzeComponentRelationships(files) {
  const result = {
    keyComponents: [],
    componentUsage: new Map(),
    componentDependencies: new Map()
  };
  
  try {
    // First scan: identify all components
    const components = new Set();
    for (const file of files) {
      if (['.jsx', '.tsx'].includes(file.extension)) {
        components.add(path.basename(file.path, file.extension));
      }
    }
    
    // Second scan: analyze component usage and dependencies
    // In quick mode, limit the number of files scanned
    const filesToScan = CONFIG.quickMode ? 
      files.filter(f => ['.jsx', '.tsx', '.js', '.ts'].includes(f.extension)).slice(0, 20) :
      files.filter(f => ['.jsx', '.tsx', '.js', '.ts'].includes(f.extension));
    
    for (const file of filesToScan) {
      try {
        const content = fs.readFileSync(file.path, 'utf8');
        const fileName = path.basename(file.path);
        
        // Check which components are used in this file
        for (const component of components) {
          if (component === path.basename(file.path, file.extension)) continue; // Skip self
          
          const regex = new RegExp(`[<\\s]${component}[\\s>/]`, 'g');
          if (regex.test(content)) {
            // Update usage count
            if (!result.componentUsage.has(component)) {
              result.componentUsage.set(component, []);
            }
            result.componentUsage.get(component).push(fileName);
            
            // Update dependencies
            if (!result.componentDependencies.has(fileName)) {
              result.componentDependencies.set(fileName, []);
            }
            result.componentDependencies.get(fileName).push(component);
          }
        }
      } catch (error) {
        console.warn(`Warning: Could not analyze component relationships in ${file.path}: ${error.message}`);
      }
    }
    
    // Identify key components based on usage
    result.componentUsage.forEach((usages, component) => {
      if (usages.length > 2) { // Consider components used in 3+ places as key components
        result.keyComponents.push({
          name: component,
          usageCount: usages.length,
          dependencies: result.componentDependencies.get(component) || []
        });
      }
    });
    
    // Sort key components by usage count
    result.keyComponents.sort((a, b) => b.usageCount - a.usageCount);
    
    return result;
  } catch (error) {
    console.error(`Error analyzing component relationships: ${error.message}`);
    return {
      keyComponents: [],
      componentUsage: new Map(),
      componentDependencies: new Map()
    };
  }
}

/**
 * Generates recommendations based on audit results
 */
function generateRecommendations(results) {
  const recommendations = [];
  
  // Check for dead code issues
  if (results.deadCode && results.deadCode.unusedFiles && results.deadCode.unusedFiles.length > 0) {
    recommendations.push({
      title: 'Clean up unused files',
      description: `Found ${results.deadCode.unusedFiles.length} potentially unused files. Consider removing these to improve codebase maintainability.`,
      actions: [
        'Review each file to confirm it\'s truly unused',
        'Archive valuable code snippets before deletion',
        'Remove confirmed unused files and update build configurations'
      ]
    });
  }
  
  // Check for navigation issues
  if (results.navigation && results.navigation.issues && results.navigation.issues.length > 0) {
    recommendations.push({
      title: 'Fix navigation inconsistencies',
      description: `Found ${results.navigation.issues.length} navigation issues that could lead to broken user flows.`,
      actions: [
        'Fix broken links to ensure all navigation paths work correctly',
        'Create a comprehensive navigation map to visualize all possible user flows',
        'Implement navigation tests to prevent future regressions'
      ]
    });
  }
  
  // Check component dependencies
  if (results.relationships && results.relationships.keyComponents && results.relationships.keyComponents.length > 0) {
    const highlyUsedComponents = results.relationships.keyComponents.filter(c => c.usageCount > 5);
    if (highlyUsedComponents.length > 0) {
      recommendations.push({
        title: 'Optimize critical components',
        description: `Identified ${highlyUsedComponents.length} components used in many places. Ensure these are optimized and well-tested.`,
        actions: [
          'Add comprehensive unit tests for highly used components',
          'Review for potential performance optimizations',
          'Ensure documentation is complete for these key components'
        ]
      });
    }
  }
  
  // Add general recommendations
  recommendations.push({
    title: 'Implement regular code auditing',
    description: 'Set up automated processes to routinely check for code quality issues and navigation integrity.',
    actions: [
      'Configure a pre-commit hook to identify potential ghost code',
      'Set up automated navigation testing as part of CI pipeline',
      'Schedule quarterly code audits to maintain codebase health'
    ]
  });
  
  return recommendations;
}

// Run the audit
runAudit();