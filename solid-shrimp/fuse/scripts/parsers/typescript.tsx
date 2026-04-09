import * as ts from 'typescript';

export function parseAst(content: string): ts.Node {
  return ts.createSourceFile(
    'temp.ts',
    content,
    ts.ScriptTarget.Latest,
    true
  );
}

export function getNodesByKind(ast: ts.Node, kind: ts.SyntaxKind): ts.Node[] {
  const nodes: ts.Node[] = [];
  
  function visit(node: ts.Node): any {
    if (node.kind === kind) {
      nodes.push(node);
    }
    node.forEachChild(visit);
  }
  
  ast.forEachChild(visit);
  return nodes;
}

export function getFunctionComplexity(node: ts.Node): number {
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
  
  visit(node);
  return complexity;
}

export function analyzeTypeUsage(ast: ts.Node): Map<string, number> {
  const typeUsage = new Map<string, number>();

  function visit(node: ts.Node): any {
    if (ts.isTypeReferenceNode(node)) {
      const typeName = node.typeName.getText();
      typeUsage.set(typeName, (typeUsage.get(typeName) || 0) + 1);
    }
    node.forEachChild(visit);
  }

  ast.forEachChild(visit);
  return typeUsage;
}

export function findUnusedExports(ast: ts.Node, imports: ImportAnalysis[]): string[] {
  const exports = new Set<string>();
  const used = new Set<string>();

  // Find all exports
  getNodesByKind(ast, ts.SyntaxKind.ExportDeclaration)
    .forEach(node => exports.add(node.getText()));

  // Check which exports are used in imports
  imports.forEach(imp => {
    imp.names.forEach(name => {
      if (exports.has(name)) used.add(name);
    });
  });

  return Array.from(exports).filter(exp => !used.has(exp));
}
