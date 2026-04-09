/**
 * Component Consolidation Analysis Script
 * 
 * This script traverses the codebase to identify React components,
 * analyze their usage, props, and identify potential redundancies.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';
import { glob } from 'glob';

interface ComponentInfo {
  name: string;
  filePath: string;
  props: string[];
  importedBy: string[];
  similarComponents: string[];
  usesContext: boolean;
  usesState: boolean;
  usesEffects: boolean;
  complexity: 'simple' | 'medium' | 'complex';
}

interface ConsolidationReport {
  components: ComponentInfo[];
  redundancyGroups: {
    group: string;
    components: string[];
    consolidationRecommendation: string;
  }[];
  proposedComponentHierarchy: Record<string, string[]>;
}

/**
 * Find all React component files in the codebase
 */
function findComponentFiles(rootDir: string): string[] {
  const patterns = [
    '**/*.tsx',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/build/**',
    '!**/.next/**',
    '!**/coverage/**',
    '!**/__tests__/**',
    '!**/*.test.tsx',
    '!**/*.spec.tsx',
  ];
  
  return glob.sync(patterns, { cwd: rootDir, absolute: true });
}

/**
 * Analyze a component file to extract information
 */
function analyzeComponent(filePath: string): ComponentInfo | null {
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const sourceFile = ts.createSourceFile(
    filePath,
    fileContent,
    ts.ScriptTarget.Latest,
    true
  );

  // This is a simplified implementation - in practice, you would use
  // the TypeScript AST to analyze the component in detail

  // Extract component name from file name as a fallback
  const fileName = path.basename(filePath, path.extname(filePath));
  
  // Basic check if this is likely a React component
  if (!fileContent.includes('React') && !fileContent.includes('jsx')) {
    return null;
  }

  // Very basic props extraction - in practice, use AST
  const propsMatch = fileContent.match(/interface\s+(\w+)Props|type\s+(\w+)Props/g);
  const props: string[] = [];
  
  // Very simplified analysis for demonstration
  const usesContext = fileContent.includes('useContext');
  const usesState = fileContent.includes('useState');
  const usesEffects = fileContent.includes('useEffect');
  
  // Determine complexity (simplified)
  let complexity: 'simple' | 'medium' | 'complex' = 'simple';
  if (fileContent.length > 5000 || fileContent.split('\n').length > 300) {
    complexity = 'complex';
  } else if (fileContent.length > 1000 || fileContent.split('\n').length > 100) {
    complexity = 'medium';
  }

  return {
    name: fileName,
    filePath,
    props,
    importedBy: [], // This requires scanning other files
    similarComponents: [], // Will be populated after analyzing all components
    usesContext,
    usesState,
    usesEffects,
    complexity,
  };
}

/**
 * Find components that import a given component
 */
function findImporters(componentPath: string, allFiles: string[]): string[] {
  const componentName = path.basename(componentPath, path.extname(componentPath));
  const importers: string[] = [];
  
  for (const file of allFiles) {
    if (file === componentPath) continue;
    
    const content = fs.readFileSync(file, 'utf8');
    // Very simplified import detection
    if (content.includes(`import ${componentName}`) || 
        content.includes(`from './${componentName}.js'`) ||
        content.includes(`from '../${componentName}.js'`)) {
      importers.push(file);
    }
  }
  
  return importers;
}

/**
 * Find potentially similar components
 */
function findSimilarComponents(components: ComponentInfo[]): void {
  for (let i = 0; i < components.length; i++) {
    const comp = components[i];
    
    for (let j = 0; j < components.length; j++) {
      if (i === j) continue;
      
      const otherComp = components[j];
      // Very simplified similarity detection
      // In practice, you'd compare props, structure, and functionality
      if (comp.name.toLowerCase().includes(otherComp.name.toLowerCase()) ||
          otherComp.name.toLowerCase().includes(comp.name.toLowerCase())) {
        comp.similarComponents.push(otherComp.name);
      }
    }
  }
}

/**
 * Group similar components for consolidation
 */
function groupSimilarComponents(components: ComponentInfo[]): ConsolidationReport['redundancyGroups'] {
  const groups: Record<string, string[]> = {};
  
  // Very simplified grouping logic
  // Group by naming patterns (e.g., Button, IconButton, PrimaryButton)
  components.forEach(comp => {
    // Extract base name (e.g., "Button" from "PrimaryButton")
    const baseName = comp.name.replace(/^(Small|Large|Primary|Secondary|Icon|Custom|Basic)/, '');
    
    if (!groups[baseName]) {
      groups[baseName] = [];
    }
    groups[baseName].push(comp.name);
  });
  
  // Convert to the required format
  return Object.entries(groups)
    .filter(([_, members]) => members.length > 1) // Only include groups with multiple components
    .map(([group, members]) => ({
      group,
      components: members,
      consolidationRecommendation: `Consolidate into a single ${group} component with variants`
    }));
}

/**
 * Propose a component hierarchy
 */
function proposeComponentHierarchy(components: ComponentInfo[]): Record<string, string[]> {
  // Simplified logic to create a component hierarchy
  const hierarchy: Record<string, string[]> = {
    'atoms': [],
    'molecules': [],
    'organisms': [],
    'templates': [],
    'pages': [],
  };
  
  components.forEach(comp => {
    if (comp.complexity === 'simple' && !comp.usesContext && !comp.usesEffects) {
      hierarchy['atoms'].push(comp.name);
    } else if (comp.complexity === 'medium' || comp.usesState) {
      hierarchy['molecules'].push(comp.name);
    } else if (comp.complexity === 'complex' || comp.usesContext) {
      hierarchy['organisms'].push(comp.name);
    } else if (comp.name.includes('Template') || comp.name.includes('Layout')) {
      hierarchy['templates'].push(comp.name);
    } else if (comp.name.includes('Page')) {
      hierarchy['pages'].push(comp.name);
    } else {
      // Default to molecules
      hierarchy['molecules'].push(comp.name);
    }
  });
  
  return hierarchy;
}

/**
 * Main analysis function
 */
export async function analyzeComponents(rootDir: string): Promise<ConsolidationReport> {
  
  const componentFiles = findComponentFiles(rootDir);

  const componentsInfo: ComponentInfo[] = [];
  
  for (const file of componentFiles) {
    const info = analyzeComponent(file);
    if (info) {
      componentsInfo.push(info);
    }
  }

  for (const comp of componentsInfo) {
    comp.importedBy = findImporters(comp.filePath, componentFiles);
  }

  findSimilarComponents(componentsInfo);

  const redundancyGroups = groupSimilarComponents(componentsInfo);
  const proposedHierarchy = proposeComponentHierarchy(componentsInfo);
  
  return {
    components: componentsInfo,
    redundancyGroups,
    proposedComponentHierarchy: proposedHierarchy,
  };
}

/**
 * Write the consolidation report to a file
 */
export function writeConsolidationReport(report: ConsolidationReport, outputPath: string): void {
  const output = JSON.stringify(report, null, 2);
  fs.writeFileSync(outputPath, output);
  
}

/**
 * Entry point when run directly
 */
if (require.main === module) {
  const rootDir = process.argv[2] || process.cwd();
  const outputPath = process.argv[3] || path.join(process.cwd(), 'component-consolidation-report.json');
  
  analyzeComponents(rootDir)
    .then(report => writeConsolidationReport(report, outputPath))
    .catch(error => {
      console.error('Error analyzing components:', error);
      process.exit(1);
    });
}