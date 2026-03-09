#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve, join } from 'node:path';

const ROOT = resolve(process.cwd());
const OUT_DIR = join(ROOT, 'tools/framework-master-graph');
const NEO4J_DIR = join(OUT_DIR, 'neo4j-package');

const INPUTS = {
  agentGraph: join(ROOT, 'tools/agent-relationship-graph/agent-relationship-graph.json'),
  routeAudit: join(ROOT, 'apps/frontend/docs/audits/navigation-route-audit.json'),
  linkAudit: join(ROOT, 'apps/frontend/docs/audits/all-links-audit.json'),
  liveCrawl: join(ROOT, 'apps/frontend/docs/audits/live-link-crawl.json'),
  railway: join(ROOT, 'railway_list.json'),
  keywordMentions: join(ROOT, 'reports/keyword-mentions/mentions-map.json'),
};

const nowIso = new Date().toISOString();

const readJson = (path) => {
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return null;
  }
};

const graph = {
  generatedAt: nowIso,
  sourceFiles: INPUTS,
  nodes: [],
  edges: [],
  stats: {},
};

const nodeById = new Map();
const edgeByKey = new Map();

const addNode = (node) => {
  if (!node?.id) return;
  if (nodeById.has(node.id)) {
    const prev = nodeById.get(node.id);
    nodeById.set(node.id, {
      ...prev,
      ...node,
      metadata: {
        ...(prev.metadata || {}),
        ...(node.metadata || {}),
      },
    });
    return;
  }
  nodeById.set(node.id, node);
};

const addEdge = (edge) => {
  if (!edge?.source || !edge?.target || !edge?.type) return;
  const key = `${edge.source}|${edge.type}|${edge.target}`;
  if (edgeByKey.has(key)) {
    const prev = edgeByKey.get(key);
    edgeByKey.set(key, {
      ...prev,
      weight: (prev.weight || 1) + (edge.weight || 1),
      metadata: {
        ...(prev.metadata || {}),
        ...(edge.metadata || {}),
      },
    });
    return;
  }
  edgeByKey.set(key, { ...edge, weight: edge.weight || 1 });
};

const slug = (input) =>
  String(input)
    .toLowerCase()
    .replace(/[^a-z0-9/._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

// Explicit architecture backbone requested by user
addNode({ id: 'framework:tnf', label: 'TNF Framework', kind: 'framework', group: 'architecture' });
addNode({ id: 'tech:agents-react-flow', label: 'AgentsReactFlow', kind: 'technology', group: 'architecture' });
addNode({ id: 'tech:nest-js', label: 'NestJS', kind: 'technology', group: 'architecture' });
addNode({ id: 'visualizer:mermaid', label: 'Mermaid', kind: 'visualizer', group: 'visualization' });
addNode({ id: 'visualizer:neo4j', label: 'Neo4j', kind: 'visualizer', group: 'visualization' });
addEdge({ source: 'framework:tnf', target: 'tech:agents-react-flow', type: 'workflow-backbone' });
addEdge({ source: 'framework:tnf', target: 'tech:nest-js', type: 'backend-framework' });
addEdge({ source: 'framework:tnf', target: 'visualizer:mermaid', type: 'visualized-by' });
addEdge({ source: 'framework:tnf', target: 'visualizer:neo4j', type: 'visualized-by' });

const agentGraph = readJson(INPUTS.agentGraph);
if (agentGraph) {
  addNode({
    id: 'artifact:agent-relationship-graph',
    label: 'Agent Relationship Graph',
    kind: 'artifact',
    group: 'artifacts',
    metadata: { generatedAt: agentGraph.generated_at || null },
  });
  addEdge({ source: 'framework:tnf', target: 'artifact:agent-relationship-graph', type: 'includes' });

  for (const node of agentGraph.nodes || []) {
    const id = `agent:${node.id}`;
    addNode({
      id,
      label: node.id,
      kind: 'agent',
      group: node.cluster || 'agents',
      metadata: { agentKind: node.kind || 'unknown', cluster: node.cluster || 'unknown' },
    });
    addEdge({ source: 'artifact:agent-relationship-graph', target: id, type: 'indexes', weight: 1 });
  }

  for (const edge of agentGraph.edges || []) {
    addEdge({
      source: `agent:${edge.source}`,
      target: `agent:${edge.target}`,
      type: edge.type || 'related_to',
      weight: edge.strength || 1,
      metadata: { risk: edge.risk || '', direction: edge.direction || 'unidirectional' },
    });
  }
}

const routeAudit = readJson(INPUTS.routeAudit);
const routeSet = new Set();
if (routeAudit?.paths) {
  const buckets = [
    ['routerPaths', 'artifact:router-paths'],
    ['effectiveRouterPaths', 'artifact:effective-router-paths'],
    ['allPagesPaths', 'artifact:all-pages-paths'],
    ['canonicalSidebarPaths', 'artifact:canonical-sidebar-paths'],
    ['sidebarPaths', 'artifact:sidebar-paths'],
  ];

  for (const [key, artifactId] of buckets) {
    const values = routeAudit.paths[key] || [];
    addNode({
      id: artifactId,
      label: key,
      kind: 'artifact',
      group: 'navigation',
      metadata: { count: values.length },
    });
    addEdge({ source: 'framework:tnf', target: artifactId, type: 'includes' });

    for (const routePath of values) {
      const rId = `route:${routePath}`;
      routeSet.add(routePath);
      addNode({
        id: rId,
        label: routePath,
        kind: 'route',
        group: 'frontend-routes',
        metadata: {
          isDynamic: routePath.includes(':') || routePath.includes('*'),
          isRoot: routePath === '/',
        },
      });
      addEdge({ source: artifactId, target: rId, type: 'contains_route' });
    }
  }

  addNode({
    id: 'artifact:navigation-route-audit',
    label: 'Navigation Route Audit',
    kind: 'artifact',
    group: 'navigation',
    metadata: routeAudit.counts || {},
  });
  addEdge({ source: 'framework:tnf', target: 'artifact:navigation-route-audit', type: 'includes' });

  for (const artifactId of [
    'artifact:router-paths',
    'artifact:effective-router-paths',
    'artifact:all-pages-paths',
    'artifact:canonical-sidebar-paths',
    'artifact:sidebar-paths',
  ]) {
    addEdge({ source: 'artifact:navigation-route-audit', target: artifactId, type: 'summarizes' });
  }
}

const linkAudit = readJson(INPUTS.linkAudit);
if (linkAudit?.rows) {
  addNode({
    id: 'artifact:all-links-audit',
    label: 'All Links Audit',
    kind: 'artifact',
    group: 'navigation',
    metadata: linkAudit.summary || {},
  });
  addEdge({ source: 'framework:tnf', target: 'artifact:all-links-audit', type: 'includes' });

  for (const row of linkAudit.rows) {
    const sourceFile = row.source || 'unknown';
    const fileId = `file:${sourceFile}`;
    addNode({ id: fileId, label: sourceFile, kind: 'file', group: 'source-files' });

    addEdge({ source: 'artifact:all-links-audit', target: fileId, type: 'scans' });

    const link = row.link || '';
    if (link.startsWith('/')) {
      const routeId = `route:${link}`;
      addNode({
        id: routeId,
        label: link,
        kind: 'route',
        group: 'frontend-routes',
        metadata: {
          isDynamic: link.includes(':') || link.includes('*'),
          inferredOnly: !routeSet.has(link),
        },
      });
      addEdge({
        source: fileId,
        target: routeId,
        type: row.status === 'ok' ? 'references_route' : 'references_broken_route',
      });
    } else if (link.startsWith('http://') || link.startsWith('https://')) {
      const urlId = `url:${slug(link)}`;
      addNode({ id: urlId, label: link, kind: 'url', group: 'external-links' });
      addEdge({ source: fileId, target: urlId, type: row.status === 'external' ? 'references_external' : 'references_url' });
    }
  }
}

const liveCrawl = readJson(INPUTS.liveCrawl);
if (liveCrawl?.summary || liveCrawl?.results) {
  addNode({
    id: 'artifact:live-link-crawl',
    label: 'Live Link Crawl',
    kind: 'artifact',
    group: 'navigation',
    metadata: liveCrawl.summary || {},
  });
  addEdge({ source: 'framework:tnf', target: 'artifact:live-link-crawl', type: 'includes' });

  for (const result of liveCrawl.results || []) {
    const domain = result.domain || 'unknown-domain';
    const domainId = `domain:${domain}`;
    addNode({
      id: domainId,
      label: domain,
      kind: 'domain',
      group: 'domains',
      metadata: {
        seed: result.seed,
        pageStatus: result.pageStatus,
        discoveredLinks: result.discoveredLinks,
        checkedLinks: result.checkedLinks,
      },
    });
    addEdge({ source: 'artifact:live-link-crawl', target: domainId, type: 'checks_domain' });

    for (const checked of result.checked || []) {
      const finalUrl = checked.finalUrl || checked.url;
      if (!finalUrl) continue;
      if (finalUrl.startsWith(`https://${domain}/`) || finalUrl.startsWith(`http://${domain}/`)) {
        try {
          const parsed = new URL(finalUrl);
          const routePath = parsed.pathname || '/';
          const routeId = `route:${routePath}`;
          addNode({
            id: routeId,
            label: routePath,
            kind: 'route',
            group: 'frontend-routes',
            metadata: {
              isDynamic: routePath.includes(':') || routePath.includes('*'),
              fromLiveCrawl: true,
            },
          });
          addEdge({
            source: domainId,
            target: routeId,
            type: checked.broken ? 'serves_broken_route' : 'serves_route',
            metadata: { status: checked.status || null },
          });
        } catch {
          // ignore invalid URL
        }
      } else {
        const externalId = `url:${slug(finalUrl)}`;
        addNode({ id: externalId, label: finalUrl, kind: 'url', group: 'external-links' });
        addEdge({ source: domainId, target: externalId, type: checked.broken ? 'links_to_broken_external' : 'links_to_external' });
      }
    }
  }

  for (const broken of liveCrawl.broken || []) {
    const fromDomain = (() => {
      try {
        return new URL(broken.from).host;
      } catch {
        return 'unknown-domain';
      }
    })();
    const fromDomainId = `domain:${fromDomain}`;
    const brokenId = `url:${slug(broken.finalUrl || broken.url || 'broken-url')}`;
    addNode({ id: brokenId, label: broken.finalUrl || broken.url || 'broken-url', kind: 'url', group: 'broken-links' });
    addEdge({
      source: fromDomainId,
      target: brokenId,
      type: 'broken_link_detected',
      metadata: { status: broken.status || null, text: broken.text || '' },
    });
  }
}

const railwayList = readJson(INPUTS.railway);
if (Array.isArray(railwayList)) {
  for (const project of railwayList) {
    const projectId = `railway-project:${slug(project.name || project.id)}`;
    addNode({
      id: projectId,
      label: project.name || project.id,
      kind: 'railway-project',
      group: 'infrastructure',
      metadata: { id: project.id || null },
    });
    addEdge({ source: 'framework:tnf', target: projectId, type: 'uses_infrastructure_project' });

    for (const envEdge of project.environments?.edges || []) {
      const env = envEdge?.node;
      if (!env) continue;
      const envId = `railway-environment:${env.id}`;
      addNode({
        id: envId,
        label: `${project.name || 'project'}:${env.name || env.id}`,
        kind: 'railway-environment',
        group: 'infrastructure',
        metadata: { id: env.id, name: env.name || null },
      });
      addEdge({ source: projectId, target: envId, type: 'has_environment' });
    }

    for (const svcEdge of project.services?.edges || []) {
      const svc = svcEdge?.node;
      if (!svc) continue;
      const svcId = `service:${slug(svc.name || svc.id)}`;
      addNode({
        id: svcId,
        label: svc.name || svc.id,
        kind: 'service',
        group: 'infrastructure',
        metadata: { id: svc.id || null, project: project.name || null },
      });
      addEdge({ source: projectId, target: svcId, type: 'has_service' });

      for (const instEdge of svc.serviceInstances?.edges || []) {
        const envId = instEdge?.node?.environmentId;
        if (!envId) continue;
        addEdge({ source: svcId, target: `railway-environment:${envId}`, type: 'deployed_in' });
      }

      const lowerName = String(svc.name || '').toLowerCase();
      if (lowerName.includes('frontend') || lowerName.includes('thenewfuse')) {
        addEdge({ source: svcId, target: 'domain:thenewfuse.com', type: 'serves_domain' });
      }
      if (lowerName.includes('poker') || lowerName.includes('casin8')) {
        addEdge({ source: svcId, target: 'domain:poker.ai-arcade.xyz', type: 'serves_domain' });
      }
      if (lowerName.includes('api')) {
        addEdge({ source: svcId, target: 'domain:thenewfuse.com', type: 'api_for_domain' });
      }
    }
  }
}

const keywordMentions = readJson(INPUTS.keywordMentions);
if (keywordMentions?.summary) {
  addNode({
    id: 'artifact:keyword-mentions-map',
    label: 'Keyword Mentions Map',
    kind: 'artifact',
    group: 'governance',
    metadata: keywordMentions.summary,
  });
  addEdge({ source: 'framework:tnf', target: 'artifact:keyword-mentions-map', type: 'includes' });

  const byKeyword = keywordMentions.summary.byKeyword || {};
  for (const [keyword, count] of Object.entries(byKeyword)) {
    const keyId = `keyword:${slug(keyword)}`;
    addNode({ id: keyId, label: keyword, kind: 'keyword', group: 'governance', metadata: { count } });
    addEdge({ source: 'artifact:keyword-mentions-map', target: keyId, type: 'tracks_keyword', weight: Number(count) || 1 });
  }
}

// Explicit workflow system anchors
for (const packageName of ['workflow-engine', 'core', 'api', 'backend', 'frontend']) {
  const pkgPath = join(ROOT, 'packages', packageName);
  if (existsSync(pkgPath)) {
    const pkgId = `package:${packageName}`;
    addNode({ id: pkgId, label: `packages/${packageName}`, kind: 'package', group: 'workflow-system' });
    addEdge({ source: 'tech:agents-react-flow', target: pkgId, type: 'integrates_with' });
  }
}
for (const appName of ['frontend', 'api', 'backend', 'cloud-sandbox', 'relay-server']) {
  const appPath = join(ROOT, 'apps', appName);
  if (existsSync(appPath)) {
    const appId = `app:${appName}`;
    addNode({ id: appId, label: `apps/${appName}`, kind: 'app', group: 'workflow-system' });
    addEdge({ source: 'framework:tnf', target: appId, type: 'contains_application' });
  }
}

if (nodeById.has('package:workflow-engine')) {
  for (const id of ['app:api', 'app:backend', 'app:frontend']) {
    if (nodeById.has(id)) addEdge({ source: 'package:workflow-engine', target: id, type: 'integrates_with' });
  }
}
if (nodeById.has('app:frontend') && nodeById.has('artifact:effective-router-paths')) {
  addEdge({ source: 'app:frontend', target: 'artifact:effective-router-paths', type: 'implements' });
}
if (nodeById.has('app:frontend') && nodeById.has('artifact:all-links-audit')) {
  addEdge({ source: 'app:frontend', target: 'artifact:all-links-audit', type: 'validated_by' });
}
if (nodeById.has('app:frontend') && nodeById.has('artifact:live-link-crawl')) {
  addEdge({ source: 'app:frontend', target: 'artifact:live-link-crawl', type: 'monitored_by' });
}
if (nodeById.has('app:api') && nodeById.has('service:api')) {
  addEdge({ source: 'app:api', target: 'service:api', type: 'deployed_as' });
}
if (nodeById.has('app:backend') && nodeById.has('service:backend')) {
  addEdge({ source: 'app:backend', target: 'service:backend', type: 'deployed_as' });
}
if (nodeById.has('app:frontend') && nodeById.has('service:frontend-application')) {
  addEdge({ source: 'app:frontend', target: 'service:frontend-application', type: 'deployed_as' });
}

addNode({ id: 'tool:agent-relationship-graph', label: 'tools/agent-relationship-graph', kind: 'tool', group: 'visualization' });
addNode({ id: 'tool:framework-master-graph', label: 'tools/framework-master-graph', kind: 'tool', group: 'visualization' });
addEdge({ source: 'tool:framework-master-graph', target: 'visualizer:neo4j', type: 'exports_to' });
addEdge({ source: 'tool:framework-master-graph', target: 'visualizer:mermaid', type: 'exports_to' });
addEdge({ source: 'framework:tnf', target: 'tool:framework-master-graph', type: 'maintained_by' });

if (nodeById.has('artifact:agent-relationship-graph')) {
  addEdge({ source: 'tool:agent-relationship-graph', target: 'artifact:agent-relationship-graph', type: 'produces' });
  addEdge({ source: 'artifact:agent-relationship-graph', target: 'tool:framework-master-graph', type: 'feeds' });
}
if (nodeById.has('artifact:navigation-route-audit')) addEdge({ source: 'artifact:navigation-route-audit', target: 'tool:framework-master-graph', type: 'feeds' });
if (nodeById.has('artifact:all-links-audit')) addEdge({ source: 'artifact:all-links-audit', target: 'tool:framework-master-graph', type: 'feeds' });
if (nodeById.has('artifact:live-link-crawl')) addEdge({ source: 'artifact:live-link-crawl', target: 'tool:framework-master-graph', type: 'feeds' });
if (nodeById.has('artifact:keyword-mentions-map')) addEdge({ source: 'artifact:keyword-mentions-map', target: 'tool:framework-master-graph', type: 'feeds' });

const nodes = [...nodeById.values()].sort((a, b) => a.id.localeCompare(b.id));
const edges = [...edgeByKey.values()].sort((a, b) => {
  if (a.source !== b.source) return a.source.localeCompare(b.source);
  if (a.type !== b.type) return a.type.localeCompare(b.type);
  return a.target.localeCompare(b.target);
});

graph.nodes = nodes;
graph.edges = edges;

const groupCounts = {};
const kindCounts = {};
for (const n of nodes) {
  groupCounts[n.group] = (groupCounts[n.group] || 0) + 1;
  kindCounts[n.kind] = (kindCounts[n.kind] || 0) + 1;
}
graph.stats = {
  nodeCount: nodes.length,
  edgeCount: edges.length,
  groupCounts,
  kindCounts,
};

const mermaidId = (id) => `n_${createHash('sha1').update(String(id)).digest('hex').slice(0, 16)}`;
const esc = (s) => String(s).replace(/"/g, '\\"');

const routeNodes = nodes.filter((n) => n.kind === 'route').sort((a, b) => a.label.localeCompare(b.label));
const services = nodes.filter((n) => n.kind === 'service');
const projects = nodes.filter((n) => n.kind === 'railway-project');
const envs = nodes.filter((n) => n.kind === 'railway-environment');
const domains = nodes.filter((n) => n.kind === 'domain');
const agents = nodes.filter((n) => n.kind === 'agent');
const artifacts = nodes.filter((n) => n.kind === 'artifact');
const apps = nodes.filter((n) => n.kind === 'app');
const packages = nodes.filter((n) => n.kind === 'package');
const visualizers = nodes.filter((n) => n.kind === 'visualizer' || n.kind === 'tool' || n.kind === 'technology' || n.kind === 'framework');

const mermaidLines = [];
mermaidLines.push('flowchart TD');
mermaidLines.push('  %% Auto-generated by build_master_framework_graph.mjs');
mermaidLines.push(`  %% Generated at ${nowIso}`);

const emitSubgraph = (title, list, max = null) => {
  mermaidLines.push(`  subgraph ${title}`);
  const sliced = max ? list.slice(0, max) : list;
  for (const node of sliced) {
    mermaidLines.push(`    ${mermaidId(node.id)}["${esc(node.label)}"]`);
  }
  if (max && list.length > max) {
    const omitted = list.length - max;
    const id = mermaidId(`meta:${title}:omitted`);
    mermaidLines.push(`    ${id}["+ ${omitted} additional nodes"]`);
  }
  mermaidLines.push('  end');
};

emitSubgraph('Core_Architecture', visualizers, null);
emitSubgraph('Infrastructure', [...projects, ...envs, ...services, ...domains], null);
emitSubgraph('Applications', apps, null);
emitSubgraph('Packages', packages, null);
emitSubgraph('Artifacts', artifacts, null);
emitSubgraph('Agents', agents, 80);
emitSubgraph('Frontend_Routes', routeNodes, 220);

const routeIdSetForMermaid = new Set(routeNodes.slice(0, 220).map((n) => n.id));
const agentIdSetForMermaid = new Set(agents.slice(0, 80).map((n) => n.id));

for (const edge of edges) {
  const sourceNode = nodeById.get(edge.source);
  const targetNode = nodeById.get(edge.target);
  if (!sourceNode || !targetNode) continue;

  const isLargeRouteEdge =
    (sourceNode.kind === 'route' && !routeIdSetForMermaid.has(sourceNode.id)) ||
    (targetNode.kind === 'route' && !routeIdSetForMermaid.has(targetNode.id));
  const isLargeAgentEdge =
    (sourceNode.kind === 'agent' && !agentIdSetForMermaid.has(sourceNode.id)) ||
    (targetNode.kind === 'agent' && !agentIdSetForMermaid.has(targetNode.id));

  if (isLargeRouteEdge || isLargeAgentEdge) continue;

  const s = mermaidId(edge.source);
  const t = mermaidId(edge.target);
  mermaidLines.push(`  ${s} -->|${edge.type}| ${t}`);
}

const masterMd = [
  '# Master Framework Graph',
  '',
  `Generated: ${nowIso}`,
  '',
  '## Summary',
  `- Nodes: ${graph.stats.nodeCount}`,
  `- Edges: ${graph.stats.edgeCount}`,
  ...Object.entries(graph.stats.kindCounts).map(([k, v]) => `- Kind ${k}: ${v}`),
  '',
  '## Architecture Notes',
  '- Workflow backbone: `AgentsReactFlow`',
  '- Backend platform: `NestJS`',
  '- Visualization outputs: `Mermaid` + `Neo4j`',
  '',
  '## Master Mermaid',
  '```mermaid',
  ...mermaidLines,
  '```',
  '',
  '## Neo4j',
  '- Use `tools/framework-master-graph/neo4j-package/load.noapoc.cypher` or `load.apoc.cypher` with the CSV files in the same folder.',
  '',
].join('\n');

mkdirSync(OUT_DIR, { recursive: true });
mkdirSync(NEO4J_DIR, { recursive: true });

writeFileSync(join(OUT_DIR, 'master-framework-graph.json'), JSON.stringify(graph, null, 2));
writeFileSync(join(OUT_DIR, 'master-framework-graph.md'), masterMd);
writeFileSync(join(OUT_DIR, 'master-framework-graph.mmd'), `${mermaidLines.join('\n')}\n`);

const noapocCypher = [
  '// Generated by tools/framework-master-graph/build_master_framework_graph.mjs',
  'CREATE CONSTRAINT framework_node_id IF NOT EXISTS',
  'FOR (n:FrameworkNode)',
  'REQUIRE n.id IS UNIQUE;',
  '',
  "LOAD CSV WITH HEADERS FROM 'file:///nodes.csv' AS row",
  'MERGE (n:FrameworkNode {id: row.id})',
  'SET n.label = row.label,',
  '    n.kind = row.kind,',
  '    n.group = row.group,',
  `    n.updatedAt = datetime('${nowIso}');`,
  '',
  "LOAD CSV WITH HEADERS FROM 'file:///edges.csv' AS row",
  'MATCH (s:FrameworkNode {id: row.source})',
  'MATCH (t:FrameworkNode {id: row.target})',
  'MERGE (s)-[r:RELATED {type: row.type}]->(t)',
  'SET r.weight = toFloat(row.weight),',
  `    r.updatedAt = datetime('${nowIso}');`,
  '',
].join('\n');

const apocCypher = [
  '// Generated by tools/framework-master-graph/build_master_framework_graph.mjs',
  '// Requires APOC Core',
  'CREATE CONSTRAINT framework_node_id IF NOT EXISTS',
  'FOR (n:FrameworkNode)',
  'REQUIRE n.id IS UNIQUE;',
  '',
  "LOAD CSV WITH HEADERS FROM 'file:///nodes.csv' AS row",
  'MERGE (n:FrameworkNode {id: row.id})',
  'SET n.label = row.label,',
  '    n.kind = row.kind,',
  '    n.group = row.group,',
  `    n.updatedAt = datetime('${nowIso}');`,
  '',
  "LOAD CSV WITH HEADERS FROM 'file:///edges.csv' AS row",
  'MATCH (s:FrameworkNode {id: row.source})',
  'MATCH (t:FrameworkNode {id: row.target})',
  'CALL apoc.merge.relationship(',
  '  s,',
  '  row.type,',
  '  {},',
  `  {weight: toFloat(row.weight), updatedAt: datetime('${nowIso}')},`,
  '  t',
  ') YIELD rel',
  'RETURN count(rel) AS relationships_upserted;',
  '',
].join('\n');

writeFileSync(join(OUT_DIR, 'master-framework-graph.noapoc.cypher'), `${noapocCypher}\n`);
writeFileSync(join(OUT_DIR, 'master-framework-graph.cypher'), `${apocCypher}\n`);

const csvEscape = (value) => {
  const text = String(value ?? '');
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
};

const nodesCsvLines = ['id,label,kind,group'];
for (const n of nodes) {
  nodesCsvLines.push([n.id, n.label || '', n.kind || '', n.group || ''].map(csvEscape).join(','));
}
writeFileSync(join(NEO4J_DIR, 'nodes.csv'), `${nodesCsvLines.join('\n')}\n`);

const edgesCsvLines = ['source,target,type,weight'];
for (const e of edges) {
  edgesCsvLines.push([e.source, e.target, e.type, e.weight || 1].map(csvEscape).join(','));
}
writeFileSync(join(NEO4J_DIR, 'edges.csv'), `${edgesCsvLines.join('\n')}\n`);

writeFileSync(join(NEO4J_DIR, 'load.noapoc.cypher'), `${noapocCypher}\n`);
writeFileSync(join(NEO4J_DIR, 'load.apoc.cypher'), `${apocCypher}\n`);

const neo4jReadme = [
  '# Master Framework Neo4j Package',
  '',
  `Generated: ${nowIso}`,
  '',
  '## Files',
  '- `nodes.csv`',
  '- `edges.csv`',
  '- `load.noapoc.cypher`',
  '- `load.apoc.cypher`',
  '',
  '## Quick Validation',
  '```cypher',
  'MATCH (n:FrameworkNode) RETURN count(n) AS nodes;',
  'MATCH ()-[r]->() RETURN count(r) AS edges;',
  'MATCH (n:FrameworkNode) RETURN n.kind, count(*) AS n ORDER BY n DESC;',
  'MATCH (a:FrameworkNode {kind:"agent"})-[r]->(b:FrameworkNode) RETURN a.id, type(r), b.id LIMIT 50;',
  '```',
  '',
].join('\n');
writeFileSync(join(NEO4J_DIR, 'README.md'), neo4jReadme);

console.log(`[framework-master-graph] nodes=${nodes.length} edges=${edges.length}`);
console.log(`[framework-master-graph] wrote ${join(OUT_DIR, 'master-framework-graph.json')}`);
console.log(`[framework-master-graph] wrote ${join(OUT_DIR, 'master-framework-graph.md')}`);
console.log(`[framework-master-graph] wrote ${join(OUT_DIR, 'master-framework-graph.mmd')}`);
console.log(`[framework-master-graph] wrote ${join(OUT_DIR, 'master-framework-graph.noapoc.cypher')}`);
console.log(`[framework-master-graph] wrote ${join(OUT_DIR, 'master-framework-graph.cypher')}`);
console.log(`[framework-master-graph] wrote ${join(NEO4J_DIR, 'nodes.csv')}`);
console.log(`[framework-master-graph] wrote ${join(NEO4J_DIR, 'edges.csv')}`);
