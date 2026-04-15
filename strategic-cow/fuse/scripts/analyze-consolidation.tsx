import { glob } from 'glob';
import * as fs from 'fs';
import * as path from 'path';
import { parse as parseTypescript, AST } from '@typescript-eslint/typescript-estree';

interface ComponentAnalysis {
  path: string;
  imports: string[];
  exports: string[];
  dependencies: string[];
  usedBy: string[];
  lastModified: Date;
  testCoverage?: number;
}

interface RouteAnalysis {
  path: string;
  component: string;
  layout?: string;
  guards: string[];
  duplicateOf?: string;
}

async function analyzeCodebase(): any {
  const analysis = {
    components: new Map<string, ComponentAnalysis>(),
    routes: new Map<string, RouteAnalysis>(),
    duplicates: new Set<string>(),
    unusedComponents: new Set<string>(),
    inconsistentImports: new Set<string>(),
  };

  // Analyze all TypeScript/JavaScript files
  const files = await glob('**/*.{ts,tsx,js,jsx}', {
    ignore: ['**/node_modules/**', '**/dist/**', '**/build/**']
  });

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    const ast = parseTypescript(content, {
      jsx: true,
      tokens: true
    });

    // Analyze component structure
    analyzeComponent(file, ast, analysis);
    
    // Analyze routes
    if (file.includes('routes') || file.includes('pages')) {
      analyzeRoute(file, ast, analysis);
    }
  }

  return analysis;
}

function generateReport(analysis: ReturnType<typeof analyzeCodebase>): any {
  return {
    summary: {
      totalComponents: analysis.components.size,
      duplicateComponents: analysis.duplicates.size,
      unusedComponents: analysis.unusedComponents.size,
      inconsistentImports: analysis.inconsistentImports.size
    },
    recommendations: generateRecommendations(analysis),
    actionItems: generateActionItems(analysis)
  };
}

function analyzeComponent(
  file: string, 
  ast: AST, 
  analysis: ReturnType<typeof analyzeCodebase>
) {
  const componentAnalysis: ComponentAnalysis = {
    path: file,
    imports: extractImports(ast),
    exports: extractExports(ast),
    dependencies: extractDependencies(ast),
    usedBy: [],
    lastModified: fs.statSync(file).mtime
  };

  // Check for duplicate components
  const similarComponents = findSimilarComponents(componentAnalysis, analysis);
  if (similarComponents.length > 0) {
    analysis.duplicates.add(file);
    similarComponents.forEach(comp => analysis.duplicates.add(comp));
  }

  // Check for unused components
  const isUsed = checkComponentUsage(componentAnalysis, analysis);
  if (!isUsed) {
    analysis.unusedComponents.add(file);
  }

  analysis.components.set(file, componentAnalysis);
}

function findSimilarComponents(
  component: ComponentAnalysis,
  analysis: ReturnType<typeof analyzeCodebase>
): string[] {
  const similar: string[] = [];
  
  for (const [path, comp] of analysis.components.entries()) {
    if (path === component.path) continue;
    
    const similarity = calculateComponentSimilarity(component, comp);
    if (similarity > 0.8) { // 80% similarity threshold
      similar.push(path);
    }
  }
  
  return similar;
}

function calculateComponentSimilarity(
  comp1: ComponentAnalysis,
  comp2: ComponentAnalysis
): number {
  const exportSimilarity = calculateSetSimilarity(
    new Set(comp1.exports),
    new Set(comp2.exports)
  );
  
  const dependencySimilarity = calculateSetSimilarity(
    new Set(comp1.dependencies),
    new Set(comp2.dependencies)
  );
  
  return (exportSimilarity + dependencySimilarity) / 2;
}

function calculateSetSimilarity(set1: Set<string>, set2: Set<string>): number {
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  return intersection.size / union.size;
}

function analyzeRoute(
  file: string,
  ast: AST,
  analysis: ReturnType<typeof analyzeCodebase>
) {
  const routeAnalysis: RouteAnalysis = {
    path: extractRoutePath(ast),
    component: extractRouteComponent(ast),
    layout: extractRouteLayout(ast),
    guards: extractRouteGuards(ast)
  };

  // Check for duplicate routes
  const duplicateRoute = findDuplicateRoute(routeAnalysis, analysis);
  if (duplicateRoute) {
    routeAnalysis.duplicateOf = duplicateRoute;
    analysis.duplicates.add(file);
  }

  analysis.routes.set(file, routeAnalysis);
}

function extractImports(ast: AST): string[] {
  const imports: string[] = [];
  traverseAST(ast, node => {
    if (node.type === 'ImportDeclaration') {
      imports.push(node.source.value);
    }
  });
  return imports;
}

function extractExports(ast: AST): string[] {
  const exports: string[] = [];
  traverseAST(ast, node => {
    if (
      node.type === 'ExportNamedDeclaration' ||
      node.type === 'ExportDefaultDeclaration'
    ) {
      if (node.declaration?.id?.name) {
        exports.push(node.declaration.id.name);
      }
    }
  });
  return exports;
}

function extractDependencies(ast: AST): string[] {
  const dependencies = new Set<string>();
  traverseAST(ast, node => {
    if (node.type === 'CallExpression' && node.callee.type === 'Identifier') {
      dependencies.add(node.callee.name);
    }
    if (node.type === 'JSXElement') {
      dependencies.add(node.openingElement.name.name);
    }
  });
  return Array.from(dependencies);
}

function checkComponentUsage(
  component: ComponentAnalysis,
  analysis: ReturnType<typeof analyzeCodebase>
): boolean {
  for (const comp of analysis.components.values()) {
    if (comp.dependencies.some(dep => component.exports.includes(dep))) {
      return true;
    }
  }
  return false;
}

function generateRecommendations(
  analysis: ReturnType<typeof analyzeCodebase>
): string[] {
  const recommendations: string[] = [];

  // Duplicate components recommendations
  if (analysis.duplicates.size > 0) {
    recommendations.push(
      `Consolidate ${analysis.duplicates.size} duplicate components into shared components`
    );
  }

  // Unused components recommendations
  if (analysis.unusedComponents.size > 0) {
    recommendations.push(
      `Remove or archive ${analysis.unusedComponents.size} unused components`
    );
  }

  // Import consistency recommendations
  if (analysis.inconsistentImports.size > 0) {
    recommendations.push(
      `Standardize import paths for ${analysis.inconsistentImports.size} components`
    );
  }

  return recommendations;
}

function generateActionItems(
  analysis: ReturnType<typeof analyzeCodebase>
): Array<{action: string; priority: 'high' | 'medium' | 'low'; files: string[]}> {
  const actions: Array<{action: string; priority: 'high' | 'medium' | 'low'; files: string[]}> = [];

  // Duplicate components actions
  if (analysis.duplicates.size > 0) {
    actions.push({
      action: 'Merge duplicate components',
      priority: 'high',
      files: Array.from(analysis.duplicates)
    });
  }

  // Unused components actions
  if (analysis.unusedComponents.size > 0) {
    actions.push({
      action: 'Remove unused components',
      priority: 'medium',
      files: Array.from(analysis.unusedComponents)
    });
  }

  // Import consistency actions
  if (analysis.inconsistentImports.size > 0) {
    actions.push({
      action: 'Standardize import paths',
      priority: 'low',
      files: Array.from(analysis.inconsistentImports)
    });
  }

  return actions;
}

function traverseAST(ast: AST, callback: (node: any): any => void) {
  function traverse(node: any): any {
    callback(node);
    for (const key in node) {
      if (node[key] && typeof node[key] === 'object') {
        traverse(node[key]);
      }
    }
  }
  traverse(ast);
}
