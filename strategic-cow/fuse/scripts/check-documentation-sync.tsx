import { glob } from 'glob';
import * as fs from 'fs';
import { parse as parseMarkdown } from 'marked';

interface DocAnalysis {
  path: string;
  referencedComponents: string[];
  referencedRoutes: string[];
  lastUpdated: Date;
  status: 'current' | 'outdated' | 'missing';
}

async function analyzeDocumentation(): any {
  const docs = await glob('docs/**/*.md');
  const analysis = new Map<string, DocAnalysis>();

  for (const doc of docs) {
    const content = fs.readFileSync(doc, 'utf-8');
    const ast = parseMarkdown(content);

    analysis.set(doc, {
      path: doc,
      referencedComponents: extractComponentReferences(ast),
      referencedRoutes: extractRouteReferences(ast),
      lastUpdated: fs.statSync(doc).mtime,
      status: determineDocStatus(doc, ast)
    });
  }

  return analysis;
}

function generateDocSyncReport(docAnalysis: ReturnType<typeof analyzeDocumentation>): any {
  return {
    outdatedDocs: Array.from(docAnalysis.values())
      .filter(doc => doc.status === 'outdated'),
    missingDocs: Array.from(docAnalysis.values())
      .filter(doc => doc.status === 'missing'),
    recommendations: generateDocRecommendations(docAnalysis)
  };
}

function extractComponentReferences(ast: any): string[] {
  const references = new Set<string>();
  
  function traverse(node: any): any {
    if (node.type === 'code' && node.lang === 'typescript') {
      // Extract component names from code blocks
      const componentMatches = node.text.match(/(?:class|interface|type|const)\s+(\w+)/g);
      if (componentMatches) {
        componentMatches.forEach((match: string) => {
          references.add(match.split(/\s+/)[1]);
        });
      }
    }
    
    if (node.children) {
      node.children.forEach(traverse);
    }
  }
  
  traverse(ast);
  return Array.from(references);
}

function extractRouteReferences(ast: any): string[] {
  const references = new Set<string>();
  
  function traverse(node: any): any {
    if (node.type === 'code' && node.lang === 'typescript') {
      // Extract route paths from code blocks
      const routeMatches = node.text.match(/path:\s*['"]([^'"]+)['"]/g);
      if (routeMatches) {
        routeMatches.forEach((match: string) => {
          references.add(match.split(/['"]/)[1]);
        });
      }
    }
    
    if (node.children) {
      node.children.forEach(traverse);
    }
  }
  
  traverse(ast);
  return Array.from(references);
}

function determineDocStatus(
  docPath: string,
  ast: any
): 'current' | 'outdated' | 'missing' {
  const docStats = fs.statSync(docPath);
  const componentPath = docPath.replace(/\.md$/, '.tsx');
  
  if (!fs.existsSync(componentPath)) {
    return 'missing';
  }
  
  const componentStats = fs.statSync(componentPath);
  
  if (componentStats.mtime > docStats.mtime) {
    return 'outdated';
  }
  
  return 'current';
}

function generateDocRecommendations(
  docAnalysis: ReturnType<typeof analyzeDocumentation>
): string[] {
  const recommendations: string[] = [];
  
  const outdatedCount = Array.from(docAnalysis.values())
    .filter(doc => doc.status === 'outdated').length;
  
  const missingCount = Array.from(docAnalysis.values())
    .filter(doc => doc.status === 'missing').length;
  
  if (outdatedCount > 0) {
    recommendations.push(
      `Update ${outdatedCount} outdated documentation files to match current component implementations`
    );
  }
  
  if (missingCount > 0) {
    recommendations.push(
      `Create documentation for ${missingCount} components that are missing documentation`
    );
  }
  
  return recommendations;
}
