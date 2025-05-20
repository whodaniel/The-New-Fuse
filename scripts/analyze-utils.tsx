import { readFileSync } from 'fs';
import * as ts from 'typescript';
import { ComponentAnalysis } from './analyze.js';

export function analyzeProps(ast: ts.Node): PropAnalysis[] {
  const props: PropAnalysis[] = [];
  
  function visit(node: ts.Node): any {
    if (ts.isPropertySignature(node)) {
      props.push({
        name: node.name.getText(),
        type: node.type?.getText() || 'any',
        isUsed: false,
        occurrences: 0
      });
    }
    node.forEachChild(visit);
  }
  
  ast.forEachChild(visit);
  return props;
}

export function findHooks(ast: ts.Node): string[] {
  const hooks: string[] = [];
  
  function visit(node: ts.Node): any {
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
      const name = node.expression.getText();
      if (name.startsWith('use')) {
        hooks.push(name);
      }
    }
    node.forEachChild(visit);
  }
  
  ast.forEachChild(visit);
  return hooks;
}

export function checkDocumentation(file: string): 'missing' | 'outdated' | 'current' {
  const content = readFileSync(file, 'utf8');
  if (!content.includes('/**')) return 'missing';
  
  // Check for outdated documentation
  const docDate = extractDocumentationDate(content);
  const fileDate = extractLastModifiedDate(file);
  
  return docDate < fileDate ? 'outdated' : 'current';
}

export async function checkTestCoverage(file: string): Promise<'missing' | 'incomplete' | 'complete'> {
  const testFile = file.replace(/\.(tsx|ts)$/, '.test.$1');
  try {
    const content = readFileSync(testFile, 'utf8');
    return isTestComplete(content) ? 'complete' : 'incomplete';
  } catch {
    return 'missing';
  }
}

export function extractDocumentationDate(content: string): Date {
  const lastUpdatedMatch = content.match(/@lastUpdated\s+(\d{4}-\d{2}-\d{2})/);
  return lastUpdatedMatch ? new Date(lastUpdatedMatch[1]) : new Date(0);
}

export function extractLastModifiedDate(file: string): Date {
  return new Date(fs.statSync(file).mtime);
}

export function isTestComplete(content: string): boolean {
  const hasDescribe = /describe\(.*\)/.test(content);
  const hasExpect = /expect\(.*\)/.test(content);
  const hasCoverage = content.includes('test.each') || 
                      content.includes('it.each') ||
                      (content.match(/it\(/g) || []).length > 2;
  
  return hasDescribe && hasExpect && hasCoverage;
}

export function findDuplicateCode(content: string, threshold: number = 0.8): string[] {
  const lines = content.split('\n');
  const duplicates: string[] = [];
  const codeBlocks = new Map<string, number>();

  for (let i = 0; i < lines.length - 5; i++) {
    const block = lines.slice(i, i + 5).join('\n');
    const normalized = normalizeCode(block);
    
    if (codeBlocks.has(normalized)) {
      duplicates.push(block);
    } else {
      codeBlocks.set(normalized, i);
    }
  }

  return duplicates;
}

function normalizeCode(code: string): string {
  return code
    .replace(/\s+/g, ' ')
    .replace(/['"`]/g, '"')
    .trim()
    .toLowerCase();
}

export function getFunctionBody(content: string): string {
  const ast = parseTypeScript(content);
  let body = '';

  function visit(node: ts.Node): any {
    if (ts.isFunctionDeclaration(node) || ts.isArrowFunction(node)) {
      body = node.body?.getText() || '';
      return;
    }
    node.forEachChild(visit);
  }

  ast.forEachChild(visit);
  return body;
}

export function hasExportModifier(node: ts.Node): boolean {
  return node.modifiers?.some(mod => mod.kind === ts.SyntaxKind.ExportKeyword) || false;
}

export function getNodeType(node: ts.Node): string {
  if (!node.type) return 'any';
  return node.type.getText();
}