import fs from 'fs';
import path from 'path';

const RESULTS_PATH = './analysis_results.json';
const OUTPUT_PATH = './CLEANUP-PRIORITIZED.md';
const UNUSED_IMPORTS_PATH = './unused-imports.txt';
const UNUSED_FILES_PATH = './unused-files.txt';

const isFalsePositive = (filePath) => {
  const ignoredPatterns = [
    /\/test\//i,
    /\.stories\.tsx?$/i,
    /\.spec\.tsx?$/i,
    /\.test\.tsx?$/i,
    /\/__tests__\//i,
    /\.d\.ts$/i,
    /\/build\//i,
    /\/dist\//i,
    /\/node_modules\//i,
    /\/types\//i,
    /\/example\//i,
    /\/demo\//i,
    /\/playground\//i,
    /index\.(js|ts|tsx)$/i  // Index files often re-export things
  ];

  return ignoredPatterns.some(pattern => pattern.test(filePath));
};

// Check if a file is critical and should never be removed
const isCriticalFile = (filePath) => {
  const criticalFiles = [
    'package.json',
    'tsconfig.json',
    'webpack.config.js',
    'vite.config.js',
    'rollup.config.js',
    'jest.config.js',
    'babel.config.js',
    '.eslintrc',
    '.prettierrc'
  ];
  
  return criticalFiles.some(file => 
    filePath.endsWith(`/${file}`) || filePath.endsWith(`\\${file}`)
  );
};

// Check if a file is high priority (core functionality)
const isHighPriority = (filePath) => {
  const highPriorityPatterns = [
    /\/src\/modules\//,
    /\/src\/services\//,
    /\/src\/utils\//,
    /\/core\//,
    /\/components\//
  ];
  
  return highPriorityPatterns.some(pattern => pattern.test(filePath));
};

const analyzeResults = () => {
  // Try to read from analysis_results.json first
  let unusedImports = [];
  let unusedFiles = [];
  
  try {
    const rawData = fs.readFileSync(RESULTS_PATH);
    const results = JSON.parse(rawData);
    
    if (results.unusedImports) {
      unusedImports = results.unusedImports;
    }
    
    if (results.unusedFiles) {
      unusedFiles = results.unusedFiles;
    }
  } catch (error) {
    console.log(`Could not read from ${RESULTS_PATH}, trying alternative sources...`);
    
    // Try to read from unused-imports.txt and unused-files.txt
    try {
      if (fs.existsSync(UNUSED_IMPORTS_PATH)) {
        const content = fs.readFileSync(UNUSED_IMPORTS_PATH, 'utf8');
        const entries = content.split('\n\n').filter(Boolean);
        
        for (const entry of entries) {
          const lines = entry.split('\n');
          if (lines.length < 2) continue;
          
          const filePath = lines[0].replace(':', '').trim();
          const imports = lines[1].trim().split(', ');
          
          imports.forEach(name => {
            unusedImports.push({ 
              name, 
              filePath,
              isTypeOnly: name.startsWith('type ') || name.startsWith('interface ')
            });
          });
        }
      }
      
      if (fs.existsSync(UNUSED_FILES_PATH)) {
        const content = fs.readFileSync(UNUSED_FILES_PATH, 'utf8');
        const files = content.split('\n').filter(Boolean);
        
        files.forEach(filePath => {
          unusedFiles.push({ path: filePath.trim() });
        });
      }
    } catch (error) {
      console.error('Error reading alternative sources:', error);
    }
  }

  const prioritized = {
    high: { imports: [], files: [] },
    medium: { imports: [], files: [] },
    low: { imports: [], files: [] }
  };

  // Analyze unused imports
  unusedImports.forEach(imp => {
    if (isFalsePositive(imp.filePath)) return;

    // Determine priority based on multiple factors
    let priority = 'medium';
    
    // TypeScript type imports are low priority
    if (imp.isTypeOnly || imp.name.startsWith('type ') || imp.name.startsWith('interface ')) {
      priority = 'low';
    }
    // React components and hooks are high priority
    else if (/^[A-Z]/.test(imp.name) || imp.name.startsWith('use')) {
      priority = 'high';
    }
    // Core utilities and services are high priority
    else if (isHighPriority(imp.filePath)) {
      priority = 'high';
    }
    
    prioritized[priority].imports.push(imp);
  });

  // Analyze unused files
  unusedFiles.forEach(file => {
    if (isFalsePositive(file.path) || isCriticalFile(file.path)) return;

    // Determine priority based on multiple factors
    let priority = 'medium';
    
    const ext = path.extname(file.path);
    
    // React components are high priority
    if (ext === '.tsx' || file.path.includes('/components/')) {
      priority = 'high';
    }
    // TypeScript declaration files are low priority
    else if (ext === '.d.ts') {
      priority = 'low';
    }
    // Core functionality is high priority
    else if (isHighPriority(file.path)) {
      priority = 'high';
    }
    // Configuration files are low priority (but not critical)
    else if (file.path.includes('config') || file.path.includes('.config.')) {
      priority = 'low';
    }
    
    prioritized[priority].files.push(file);
  });

  return prioritized;
};

const generateReport = (prioritized) => {
  let report = '# Prioritized Cleanup Report\n\n';
  
  // Add summary statistics
  const totalImports = prioritized.high.imports.length + prioritized.medium.imports.length + prioritized.low.imports.length;
  const totalFiles = prioritized.high.files.length + prioritized.medium.files.length + prioritized.low.files.length;
  
  report += `## Summary\n\n`;
  report += `- Total actionable unused imports: ${totalImports}\n`;
  report += `- Total actionable unused files: ${totalFiles}\n\n`;
  report += `This report has filtered out likely false positives from the original detection of 3,807 unused imports and 16,705 unused files.\n\n`;
  report += `### Implementation Strategy\n\n`;
  report += `Follow the guidance in CLEANUP-IMPLEMENTATION.md for safely removing these items.\n\n`;
  report += `### Incremental Cleanup Plan\n\n`;
  report += `1. Start with high priority items in small batches (5-10 files per commit)\n`;
  report += `2. Run tests after each batch to ensure no regressions\n`;
  report += `3. Move to medium priority items once high priority is complete\n`;
  report += `4. Consider low priority items only after thorough testing of previous changes\n\n`;

  // Group imports by directory for better organization
  const groupImportsByDirectory = (imports) => {
    const grouped = {};
    
    imports.forEach(imp => {
      const dir = path.dirname(imp.filePath);
      if (!grouped[dir]) {
        grouped[dir] = [];
      }
      grouped[dir].push(imp);
    });
    
    return grouped;
  };
  
  // High Priority Section
  report += '## High Priority\n';
  report += `### Imports (${prioritized.high.imports.length})\n\n`;
  
  if (prioritized.high.imports.length > 0) {
    const groupedImports = groupImportsByDirectory(prioritized.high.imports);
    
    Object.entries(groupedImports).forEach(([dir, imports]) => {
      report += `#### ${dir} (${imports.length})\n`;
      imports.forEach(imp => {
        report += `- \`${imp.name}\` in ${path.basename(imp.filePath)}\n`;
      });
      report += '\n';
    });
  } else {
    report += 'No high priority unused imports found.\n\n';
  }
  
  report += `### Files (${prioritized.high.files.length})\n\n`;
  
  if (prioritized.high.files.length > 0) {
    // Group files by directory
    const groupedByDir = {};
    prioritized.high.files.forEach(file => {
      const dir = path.dirname(file.path);
      if (!groupedByDir[dir]) {
        groupedByDir[dir] = [];
      }
      groupedByDir[dir].push(file);
    });
    
    Object.entries(groupedByDir).forEach(([dir, files]) => {
      report += `#### ${dir} (${files.length})\n`;
      files.forEach(file => {
        report += `- ${path.basename(file.path)}\n`;
      });
      report += '\n';
    });
  } else {
    report += 'No high priority unused files found.\n\n';
  }

  // Medium Priority Section
  report += '## Medium Priority\n';
  report += `### Imports (${prioritized.medium.imports.length})\n\n`;
  
  if (prioritized.medium.imports.length > 0) {
    const groupedImports = groupImportsByDirectory(prioritized.medium.imports);
    
    Object.entries(groupedImports).slice(0, 10).forEach(([dir, imports]) => {
      report += `#### ${dir} (${imports.length})\n`;
      imports.slice(0, 10).forEach(imp => {
        report += `- \`${imp.name}\` in ${path.basename(imp.filePath)}\n`;
      });
      if (imports.length > 10) {
        report += `- ... and ${imports.length - 10} more\n`;
      }
      report += '\n';
    });
    
    if (Object.keys(groupedImports).length > 10) {
      report += `... and ${Object.keys(groupedImports).length - 10} more directories\n\n`;
    }
  } else {
    report += 'No medium priority unused imports found.\n\n';
  }
  
  report += `### Files (${prioritized.medium.files.length})\n\n`;
  
  if (prioritized.medium.files.length > 0) {
    // Group files by directory
    const groupedByDir = {};
    prioritized.medium.files.forEach(file => {
      const dir = path.dirname(file.path);
      if (!groupedByDir[dir]) {
        groupedByDir[dir] = [];
      }
      groupedByDir[dir].push(file);
    });
    
    Object.entries(groupedByDir).slice(0, 10).forEach(([dir, files]) => {
      report += `#### ${dir} (${files.length})\n`;
      files.slice(0, 10).forEach(file => {
        report += `- ${path.basename(file.path)}\n`;
      });
      if (files.length > 10) {
        report += `- ... and ${files.length - 10} more\n`;
      }
      report += '\n';
    });
    
    if (Object.keys(groupedByDir).length > 10) {
      report += `... and ${Object.keys(groupedByDir).length - 10} more directories\n\n`;
    }
  } else {
    report += 'No medium priority unused files found.\n\n';
  }

  // Low Priority Section - Just show summary counts to keep report manageable
  report += '## Low Priority\n';
  report += `### Imports (${prioritized.low.imports.length})\n\n`;
  
  if (prioritized.low.imports.length > 0) {
    report += 'Low priority imports are typically type-only imports or those in non-critical paths.\n';
    report += 'These should be addressed only after high and medium priority items are resolved.\n\n';
    
    // Just show top 5 directories with counts
    const groupedImports = groupImportsByDirectory(prioritized.low.imports);
    const topDirs = Object.entries(groupedImports)
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 5);
    
    report += '#### Top Directories\n';
    topDirs.forEach(([dir, imports]) => {
      report += `- ${dir}: ${imports.length} imports\n`;
    });
    report += '\n';
  } else {
    report += 'No low priority unused imports found.\n\n';
  }
  
  report += `### Files (${prioritized.low.files.length})\n\n`;
  
  if (prioritized.low.files.length > 0) {
    report += 'Low priority files are typically configuration files, type definitions, or those in non-critical paths.\n';
    report += 'These should be addressed only after high and medium priority items are resolved.\n\n';
    
    // Just show top 5 directories with counts
    const groupedByDir = {};
    prioritized.low.files.forEach(file => {
      const dir = path.dirname(file.path);
      if (!groupedByDir[dir]) {
        groupedByDir[dir] = [];
      }
      groupedByDir[dir].push(file);
    });
    
    const topDirs = Object.entries(groupedByDir)
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 5);
    
    report += '#### Top Directories\n';
    topDirs.forEach(([dir, files]) => {
      report += `- ${dir}: ${files.length} files\n`;
    });
    report += '\n';
  } else {
    report += 'No low priority unused files found.\n\n';
  }

  fs.writeFileSync(OUTPUT_PATH, report);
  console.log(`Generated prioritized report at ${OUTPUT_PATH}`);
  console.log(`Found ${totalImports} actionable unused imports and ${totalFiles} actionable unused files after filtering.`);
};

// Execute analysis
const prioritized = analyzeResults();
generateReport(prioritized);