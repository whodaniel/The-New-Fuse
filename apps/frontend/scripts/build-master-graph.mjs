import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repo = path.resolve(app, '../..');

// Parse real JSX, excluding comments and catalog entries. The app currently mounts
// ComprehensiveRouter directly; dormant route modules are not runtime destinations.
export function extractDeclaredRoutes(content) {
  const source = ts.createSourceFile(
    'routes.tsx',
    content,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
  );
  const routes = new Set();
  function visit(node) {
    if (
      (ts.isJsxSelfClosingElement(node) || ts.isJsxOpeningElement(node)) &&
      node.tagName.getText(source) === 'Route'
    ) {
      for (const attr of node.attributes.properties) {
        if (
          ts.isJsxAttribute(attr) &&
          attr.name.getText(source) === 'path' &&
          attr.initializer &&
          ts.isStringLiteral(attr.initializer) &&
          attr.initializer.text.startsWith('/')
        )
          routes.add(attr.initializer.text);
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
  return [...routes].sort();
}

export function buildMasterGraph() {
  const source = 'tools/framework-master-graph/master-framework-graph.json';
  const raw = JSON.parse(fs.readFileSync(path.join(repo, source), 'utf8'));
  const revision = execFileSync('git', ['rev-parse', 'HEAD'], {
    cwd: repo,
    encoding: 'utf8',
  }).trim();
  const generatedAt = execFileSync('git', ['show', '-s', '--format=%cI', 'HEAD'], {
    cwd: repo,
    encoding: 'utf8',
  }).trim();
  const historical = { source, observedAt: raw.generatedAt, status: 'historical' };
  const nodes = raw.nodes.map((n) => ({
    id: n.id,
    label: n.label,
    kind: n.kind,
    group: n.group,
    evidence: historical,
  }));
  const edges = raw.edges.map((e, i) => ({
    id: `snapshot:${i}`,
    source: e.source,
    target: e.target,
    type: e.type,
    directed: e.metadata?.direction !== 'bidirectional',
    evidence: historical,
  }));
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const files = ['src/ComprehensiveRouter.tsx'];
  // Only explicit absolute JSX route declarations qualify. Catalog names and inferred
  // routes are not proof, and dynamic templates are never turned into clickable URLs.
  for (const file of files) {
    const content = fs.readFileSync(path.join(app, file), 'utf8');
    for (const route of extractDeclaredRoutes(content)) {
      const id = `route:${route}`;
      let n = byId.get(id);
      if (!n) {
        n = { id, label: route, kind: 'route', group: 'frontend-routes' };
        nodes.push(n);
        byId.set(id, n);
      }
      // Current route identity must not inherit a legacy draft feature title.
      n.label = route;
      n.kind = 'route';
      n.group = 'frontend-routes';
      n.evidence = { source: `apps/frontend/${file}`, observedAt: generatedAt, status: 'declared' };
      if (
        !edges.some(
          (e) => e.source === 'app:frontend' && e.target === id && e.type === 'declares_route'
        )
      )
        edges.push({
          id: `declaration:${id}`,
          source: 'app:frontend',
          target: id,
          type: 'declares_route',
          directed: true,
          evidence: n.evidence,
        });
      if (/^\/(?!\/)[a-zA-Z0-9/_-]*$/.test(route)) n.href = route;
    }
  }
  // File existence is evidence of source presence, not completed functionality.
  for (const n of nodes.filter(
    (n) => n.kind === 'file' || n.kind === 'package' || n.kind === 'app'
  )) {
    const candidate = n.label;
    if (
      typeof candidate === 'string' &&
      !candidate.includes('..') &&
      /^(apps|packages|scripts|tools)\//.test(candidate) &&
      fs.existsSync(path.join(repo, candidate))
    )
      n.evidence = { source: candidate, observedAt: generatedAt, status: 'source-present' };
  }
  return {
    schemaVersion: 'tnf.master-graph/v1',
    generatedAt,
    snapshotAt: raw.generatedAt,
    revision,
    nodes,
    edges,
    issues: [],
    sources: [
      {
        id: source,
        status: 'available',
        message:
          'Historical architecture plus build-time route declarations; not a runtime health assertion',
      },
    ],
  };
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const output = path.resolve(app, 'dist/data/master-graph.json');
  const graph = buildMasterGraph();
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, JSON.stringify(graph));
  console.log(
    `Master graph: ${graph.nodes.length} nodes, ${graph.edges.length} source edges → ${output}`
  );
}
