import { glob } from 'glob';
import { readFileSync, writeFileSync } from 'fs';
import { join, relative } from 'path';
import chalk from 'chalk';
import * as ts from 'typescript';
import { cosine } from 'string-similarity';

interface ComponentAnalysis {
  name: string;
  path: string;
  imports: ImportAnalysis[];
  exports: string[];
  props?: PropAnalysis[];
  hooks?: string[];
  redundantWith?: string[];
  documentationStatus: 'missing' | 'outdated' | 'current';
  testStatus: 'missing' | 'incomplete' | 'complete';
  complexity: number;
}

interface ImportAnalysis {
  source: string;
  names: string[];
  isRedundant?: boolean;
}

interface PropAnalysis {
  name: string;
  type: string;
  isUsed: boolean;
  occurrences: number;
}

interface AnalysisReport {
  components: ComponentAnalysis[];
  redundancies: {
    components: string[];
    hooks: string[];
    utils: string[];
  };
  documentation: {
    missing: string[];
    outdated: string[];
  };
  testing: {
    missing: string[];
    incomplete: string[];
  };
}

interface DetailedMetrics {
  complexity: {
    average: number;
    highest: {
      component: string;
      value: number;
    };
    distribution: Record<string, number>;
  };
  duplication: {
    percentage: number;
    locations: Array<{
      file: string;
      duplicateOf: string;
      similarity: number;
    }>;
  };
  testing: {
    coverage: number;
    uncoveredComponents: string[];
    partialCoverage: Array<{
      component: string;
      coverage: number;
    }>;
  };
}

const COMPLEXITY_THRESHOLD = 20;
const SIMILARITY_THRESHOLD = 0.8;

// Add analysis config
const config = {
  patterns: {
    hook: /^use[A-Z]/,
    test: /\.(test|spec)\.(ts|tsx)$/,
    doc: /\.(md|mdx)$/
  },
  metrics: {
    maxComplexity: COMPLEXITY_THRESHOLD,
    minTestCoverage: 0.7,
    maxDuplication: 0.3
  }
};

async function analyzeCodebase(): Promise<AnalysisReport> {
  );

  // Implementation of detailed analysis
  const components = await analyzeComponents();
  const hooks = await analyzeHooks();
  const documentation = await analyzeDocumentation();
  const tests = await analyzeTests();

  return {
    components,
    redundancies: findRedundancies(),
    documentation: categorizeDocumentation(),
    testing: categorizeTests()
  };
}

async function analyzeComponents(): Promise<ComponentAnalysis[]> {
  const files = await glob('**/*.{tsx,jsx}', { ignore: ['**/node_modules/**'] });
  
  return Promise.all(files.map(async (file) => {
    const content = readFileSync(file, 'utf8');
    const ast = parseTypeScript(content);
    
    return {
      name: getComponentName(ast),
      path: file,
      imports: analyzeImports(ast),
      exports: findExports(ast),
      props: analyzeProps(ast),
      hooks: findHooks(ast),
      complexity: calculateComplexity(ast),
      documentationStatus: checkDocumentation(file),
      testStatus: await checkTestCoverage(file),
      redundantWith: await findSimilarComponents(file, content)
    };
  }));
}

async function analyzeHooks(): Promise<string[]> {
  const files = await glob('**/hooks/**/*.{ts,tsx}');
  const hooks: string[] = [];
  
  for (const file of files) {
    const content = readFileSync(file, 'utf8');
    const ast = parseTypeScript(content);
    const exports = findExports(ast);
    hooks.push(...exports.filter(exp => config.patterns.hook.test(exp)));
  }
  
  return hooks;
}

async function analyzeDocumentation(): Promise<string[]> {
  const files = await glob('**/*.{ts,tsx}');
  const missing: string[] = [];
  
  for (const file of files) {
    const content = readFileSync(file, 'utf8');
    if (!hasAdequateDocumentation(content)) {
      missing.push(file);
    }
  }
  
  return missing;
}

async function analyzeTests(): Promise<string[]> {
  const sourceFiles = await glob('**/*.{ts,tsx}', { ignore: ['**/*.{test,spec}.*'] });
  const testFiles = await glob('**/*.{test,spec}.{ts,tsx}');
  
  const untested = sourceFiles.filter(file => {
    const testFile = file.replace(/\.(ts|tsx)$/, '.test.$1');
    return !testFiles.includes(testFile);
  });
  
  return untested;
}

function findRedundancies(): any {
  return {
    components: findRedundantComponents(),
    hooks: findRedundantHooks(),
    utils: findRedundantUtils()
  };
}

function categorizeDocumentation(): { missing: string[], outdated: string[] } {
  // Implement documentation categorization

  function isDocumentationOutdated(docPath: string, srcPath: string): boolean {
    const docStats = fs.statSync(docPath);
    const srcStats = fs.statSync(srcPath);
    return docStats.mtime < srcStats.mtime;
  }

  return {
    missing: [],
    outdated: []
  };
}

function categorizeTests(): { missing: string[], incomplete: string[] } {
  // Implement test categorization

  function isTestCoverageComplete(testPath: string): boolean {
    const content = readFileSync(testPath, 'utf8');
    // Check for describe blocks and expect statements
    return /describe\(.*\)/.test(content) && /expect\(.*\)/.test(content);
  }

  return {
    missing: [],
    incomplete: []
  };
}

// Add helper functions
function parseTypeScript(content: string): ts.Node {
  return ts.createSourceFile(
    'temp.ts',
    content,
    ts.ScriptTarget.Latest,
    true
  );
}

function getComponentName(ast: ts.Node): string {
  let name = '';
  ast.forEachChild(node => {
    if (ts.isExportDeclaration(node) || ts.isFunctionDeclaration(node)) {
      name = node.name?.text || '';
    }
  });
  return name;
}

function analyzeImports(ast: ts.Node): ImportAnalysis[] {
  const imports: ImportAnalysis[] = [];
  ast.forEachChild(node => {
    if (ts.isImportDeclaration(node)) {
      imports.push({
        source: node.moduleSpecifier.getText().replace(/['"]/g, ''),
        names: node.importClause?.namedBindings?.getText().split(',').map(n => n.trim()) || []
      });
    }
  });
  return imports;
}

function findRedundantComponents(): string[] {
  // Implementation of component redundancy check
  return [];
}

function calculateComplexity(ast: ts.Node): number {
  let complexity = 1;
  
  function visit(node: ts.Node): any {
    switch (node.kind) {
      case ts.SyntaxKind.IfStatement:
      case ts.SyntaxKind.ConditionalExpression:
      case ts.SyntaxKind.ForStatement:
      case ts.SyntaxKind.WhileStatement:
      case ts.SyntaxKind.CaseClause:
      case ts.SyntaxKind.CatchClause:
      case ts.SyntaxKind.LogicalAndExpression:
      case ts.SyntaxKind.LogicalOrExpression:
        complexity++;
        break;
    }
    node.forEachChild(visit);
  }
  
  visit(ast);
  return complexity;
}

async function findSimilarComponents(file: string, content: string): Promise<string[]> {
  const files = await glob('**/*.{tsx,jsx}', { ignore: ['**/node_modules/**', file] });
  const similar: string[] = [];
  
  for (const otherFile of files) {
    const otherContent = readFileSync(otherFile, 'utf8');
    const similarity = cosine(content, otherContent);
    
    if (similarity > SIMILARITY_THRESHOLD) {
      similar.push(otherFile);
    }
  }
  
  return similar;
}

function generateRecommendations(analysis: AnalysisReport): Recommendation[] {
  const recommendations: Recommendation[] = [];

  // Check component complexity
  analysis.components
    .filter(c => c.complexity > COMPLEXITY_THRESHOLD)
    .forEach(c => {
      recommendations.push({
        type: 'warning',
        category: 'maintenance',
        description: `Component ${c.name} has high complexity (${c.complexity})`,
        files: [c.path],
        effort: 'high'
      });
    });

  // Check test coverage
  if (analysis.testing.missing.length > 0) {
    recommendations.push({
      type: 'critical',
      category: 'testing',
      description: 'Missing test coverage',
      files: analysis.testing.missing,
      effort: 'medium'
    });
  }

  return recommendations;
}

// Add report template generation
async function generateReport(analysis: AnalysisReport): Promise<void> {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalComponents: analysis.components.length,
      redundantComponents: analysis.redundancies.components.length,
      missingDocs: analysis.documentation.missing.length,
      missingTests: analysis.testing.missing.length,
      metrics: {
        averageComplexity: calculateAverageComplexity(analysis.components),
        testCoverage: await calculateTestCoverage(),
        documentationCoverage: calculateDocumentationCoverage(analysis)
      }
    },
    details: {
      components: analysis.components,
      redundancies: analysis.redundancies,
      documentation: analysis.documentation,
      testing: analysis.testing
    },
    recommendations: generateRecommendations(analysis)
  };

  writeFileSync(
    join(process.cwd(), 'analysis-report.json'),
    JSON.stringify(report, null, 2)
  );
}

async function generateDetailedReport(analysis: AnalysisReport): Promise<void> {
  const metrics: DetailedMetrics = {
    complexity: await calculateDetailedComplexity(analysis.components),
    duplication: await analyzeDuplication(analysis.components),
    testing: await analyzeTestCoverage(analysis.components)
  };

  const report = {
    // ...existing report structure...
    metrics,
    recommendations: generateDetailedRecommendations(analysis, metrics)
  };

  writeFileSync(
    join(process.cwd(), 'detailed-analysis.json'),
    JSON.stringify(report, null, 2)
  );
}

async function calculateDetailedComplexity(components: ComponentAnalysis[]): Promise<DetailedMetrics['complexity']> {
  const highest = components.reduce((max, comp) => 
    comp.complexity > max.value ? { component: comp.name, value: comp.complexity } : max,
    { component: '', value: 0 }
  );

  const distribution = components.reduce((acc, comp) => {
    const range = Math.floor(comp.complexity / 5) * 5;
    acc[`${range}-${range + 4}`] = (acc[`${range}-${range + 4}`] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    average: calculateAverageComplexity(components),
    highest,
    distribution
  };
}

async function analyzeDuplication(components: ComponentAnalysis[]): Promise<DetailedMetrics['duplication']> {
  const locations: Array<{ file: string; duplicateOf: string; similarity: number }> = [];
  let totalDuplication = 0;

  for (const comp of components) {
    if (comp.redundantWith?.length) {
      totalDuplication++;
      comp.redundantWith.forEach(duplicate => {
        locations.push({
          file: comp.path,
          duplicateOf: duplicate,
          similarity: SIMILARITY_THRESHOLD
        });
      });
    }
  }

  return {
    percentage: (totalDuplication / components.length) * 100,
    locations
  };
}

async function analyzeTestCoverage(components: ComponentAnalysis[]): Promise<DetailedMetrics['testing']> {
  const uncoveredComponents = components
    .filter(comp => comp.testStatus === 'missing')
    .map(comp => comp.name);

  const partialCoverage = components
    .filter(comp => comp.testStatus === 'incomplete')
    .map(comp => ({
      component: comp.name,
      coverage: 50 
    }));

  return {
    coverage: await calculateTestCoverage(),
    uncoveredComponents,
    partialCoverage
  };
}

function generateDetailedRecommendations(analysis: AnalysisReport, metrics: DetailedMetrics): Recommendation[] {
  const recommendations = generateRecommendations(analysis);

  // Add complexity-based recommendations
  if (metrics.complexity.average > config.metrics.maxComplexity) {
    recommendations.push({
      type: 'critical',
      category: 'maintenance',
      description: 'Overall codebase complexity is too high',
      effort: 'high'
    });
  }

  // Add duplication-based recommendations
  if (metrics.duplication.percentage > config.metrics.maxDuplication * 100) {
    recommendations.push({
      type: 'warning',
      category: 'maintenance',
      description: 'High code duplication detected',
      files: metrics.duplication.locations.map(loc => loc.file),
      effort: 'medium'
    });
  }

  // Add test coverage recommendations
  if (metrics.testing.coverage < config.metrics.minTestCoverage * 100) {
    recommendations.push({
      type: 'critical',
      category: 'testing',
      description: 'Test coverage is below minimum threshold',
      files: metrics.testing.uncoveredComponents,
      effort: 'high'
    });
  }

  return recommendations;
}

function findRedundantUtils(): string[] {
  const cache = new Map<string, string>();
  const redundant: string[] = [];

  return redundant;
}

function calculateAverageComplexity(components: ComponentAnalysis[]): number {
  if (components.length === 0) return 0;
  const total = components.reduce((sum, comp) => sum + comp.complexity, 0);
  return total / components.length;
}

async function calculateTestCoverage(): Promise<number> {
  // Implementation using Jest coverage reports
  return 0;
}

function calculateDocumentationCoverage(analysis: AnalysisReport): number {
  const total = analysis.components.length;
  const documented = total - analysis.documentation.missing.length;
  return (documented / total) * 100;
}

// Run the analysis
async function main(): any {
  try {
    const analysis = await analyzeCodebase();
    await generateReport(analysis);
    
    );
  } catch (error) {
    console.error(chalk.red('Analysis failed:'), error);
    process.exit(1);
  }
}

main();

function findRedundantHooks(): string[] {
  const hooksByFunc = new Map<string, string[]>();
  const redundant: string[] = [];

  hooks.forEach(hook => {
    const funcBody = getFunctionBody(hook);
    const normalized = normalizeCode(funcBody);
    
    if (hooksByFunc.has(normalized)) {
      redundant.push(hook);
    } else {
      hooksByFunc.set(normalized, [hook]);
    }
  });

  return redundant;
}

function findExports(ast: ts.Node): string[] {
  const exports: string[] = [];
  
  function visit(node: ts.Node): any {
    if (ts.isExportDeclaration(node) || 
        (ts.isFunctionDeclaration(node) && hasExportModifier(node))) {
      const name = node.name?.getText() || '';
      if (name) exports.push(name);
    }
    node.forEachChild(visit);
  }
  
  ast.forEachChild(visit);
  return exports;
}
