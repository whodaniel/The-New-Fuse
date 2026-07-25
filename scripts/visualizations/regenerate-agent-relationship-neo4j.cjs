#!/usr/bin/env node
/**
 * Regenerate agent-relationship Neo4j packages + reports from the corrected
 * agent-relationship-graph.json (role ⊥ platform taxonomy).
 *
 * Seeds tools/agent-relationship-graph (publish source) and refreshes
 * neo4j-package CSVs / Cypher loaders / centrality disclaimer.
 *
 * Usage (from repo root):
 *   node scripts/visualizations/regenerate-agent-relationship-neo4j.cjs
 *   node scripts/visualizations/publish-graph-artifacts.cjs
 */
/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');

const repoRoot = process.cwd();
const publicGraph = path.join(
  repoRoot,
  'apps/frontend/public/visualizations/graphs/agent-relationship-graph'
);
const toolsGraph = path.join(repoRoot, 'tools/agent-relationship-graph');
const stamp = new Date().toISOString();

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, value) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function csvEscape(value) {
  const s = value == null ? '' : String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function writeCsv(filePath, headers, rows) {
  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(headers.map((h) => csvEscape(row[h])).join(','));
  }
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, `${lines.join('\n')}\n`);
}

function copyDirRecursive(srcDir, destDir) {
  if (!fs.existsSync(srcDir)) return 0;
  ensureDir(destDir);
  let n = 0;
  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    const src = path.join(srcDir, entry.name);
    const dest = path.join(destDir, entry.name);
    if (entry.isDirectory()) n += copyDirRecursive(src, dest);
    else if (entry.isFile()) {
      ensureDir(path.dirname(dest));
      fs.copyFileSync(src, dest);
      n += 1;
    }
  }
  return n;
}

function inferDaccRole(node) {
  if (node.daccRole) return node.daccRole;
  if (node.daccRole_default) return node.daccRole_default;
  if (node.batonHolder || node.baton_identity) return 'orchestrator';
  if (node.kind === 'platform') return 'worker';
  if (node.kind === 'infra') return 'orchestrator';
  if (String(node.workerAction || '').toLowerCase() === 'orchestrator') return 'worker';
  return '';
}

function inferPlatform(node) {
  if (node.platform) return node.platform;
  if (node.id === 'gemini') return 'gemini';
  if (node.id === 'antigravity-platform') return 'antigravity';
  if (node.id === 'master-clock-baton') return 'master-clock';
  return '';
}

function ensureAuthorityEdges(graph) {
  const ids = new Set(graph.nodes.map((n) => n.id));
  const needed = [
    {
      source: 'master-clock-baton',
      target: 'orchestrator-agent',
      type: 'governs',
      strength: 1,
      origin: 'taxonomy-2026-07-25',
      note: 'baton governs domain orchestrator persona (not platform coupling)',
    },
    {
      source: 'master-clock-baton',
      target: 'agent-registry-manager',
      type: 'governs',
      strength: 0.9,
      origin: 'taxonomy-2026-07-25',
    },
    {
      source: 'master-clock-baton',
      target: 'task-agent-router',
      type: 'governs',
      strength: 0.9,
      origin: 'taxonomy-2026-07-25',
    },
  ];

  let added = 0;
  for (const edge of needed) {
    if (!ids.has(edge.source) || !ids.has(edge.target)) continue;
    const exists = graph.edges.some(
      (e) => e.source === edge.source && e.target === edge.target && e.type === edge.type
    );
    if (!exists) {
      graph.edges.push(edge);
      added += 1;
    }
  }
  return added;
}

function degreeCentrality(graph) {
  const deg = new Map();
  for (const n of graph.nodes) deg.set(n.id, 0);
  for (const e of graph.edges) {
    if (deg.has(e.source)) deg.set(e.source, deg.get(e.source) + 1);
    if (deg.has(e.target)) deg.set(e.target, deg.get(e.target) + 1);
  }
  return [...deg.entries()].sort((a, b) => b[1] - a[1]);
}

function relationTypeForCsv(type) {
  return String(type || 'related')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_');
}

function rebuildNeo4jPackage(graphRoot, graph) {
  const neo4jRoot = path.join(graphRoot, 'neo4j-package');
  ensureDir(neo4jRoot);

  const nodeRows = graph.nodes.map((n) => {
    const domains = Array.isArray(n.domains)
      ? n.domains.join('|')
      : n.domains || (n.cluster && n.cluster !== 'runtime-infra' && n.cluster !== 'fulfillment'
          ? ''
          : '');
    return {
      id: n.id,
      kind: n.kind || '',
      cluster: n.cluster || '',
      domains,
      daccRole: inferDaccRole(n),
      platform: inferPlatform(n),
      workerAction: n.workerAction || '',
      batonHolder: n.batonHolder || n.id === 'master-clock-baton' ? 'true' : 'false',
      batonIdentity: n.baton_identity || '',
      axesNote: n.axes_note || '',
    };
  });

  writeCsv(
    path.join(neo4jRoot, 'nodes.csv'),
    [
      'id',
      'kind',
      'cluster',
      'domains',
      'daccRole',
      'platform',
      'workerAction',
      'batonHolder',
      'batonIdentity',
      'axesNote',
    ],
    nodeRows
  );

  const edgeRows = graph.edges.map((e) => ({
    source: e.source,
    target: e.target,
    relationType: relationTypeForCsv(e.type),
    strength: e.strength == null ? '' : e.strength,
    risk: e.risk || '',
    direction: e.direction || (e.type === 'analyzes' ? 'bidirectional' : 'unidirectional'),
  }));

  writeCsv(
    path.join(neo4jRoot, 'edges.csv'),
    ['source', 'target', 'relationType', 'strength', 'risk', 'direction'],
    edgeRows
  );

  const membership = [];
  const existingMembershipPath = path.join(neo4jRoot, 'domain_membership.csv');
  // Prefer domains encoded on nodes.
  for (const n of graph.nodes) {
    const domains = Array.isArray(n.domains)
      ? n.domains
      : String(n.domains || '')
          .split('|')
          .map((d) => d.trim())
          .filter(Boolean);
    for (const d of domains) membership.push({ agentId: n.id, domain: d });
  }
  // Fall back to prior membership file (historical domain tagging) when nodes
  // lack explicit domains — do not invent from orchestration cluster.
  if (membership.length === 0 && fs.existsSync(existingMembershipPath)) {
    const lines = fs.readFileSync(existingMembershipPath, 'utf8').trim().split(/\r?\n/).slice(1);
    for (const line of lines) {
      const [agentId, domain] = line.split(',');
      if (agentId && domain) membership.push({ agentId, domain });
    }
  }
  writeCsv(path.join(neo4jRoot, 'domain_membership.csv'), ['agentId', 'domain'], membership);

  const loadNoApoc = `// Neo4j load script (no APOC required)
// Regenerated ${stamp}
// Axes: daccRole ⊥ platform ⊥ workerAction ⊥ batonHolder
// Place CSV files in Neo4j import directory.

CREATE CONSTRAINT agent_id IF NOT EXISTS
FOR (a:Agent)
REQUIRE a.id IS UNIQUE;

LOAD CSV WITH HEADERS FROM 'file:///nodes.csv' AS row
MERGE (a:Agent {id: row.id})
SET a.kind = row.kind,
    a.cluster = row.cluster,
    a.domains = CASE WHEN row.domains = '' THEN [] ELSE split(row.domains, '|') END,
    a.daccRole = CASE WHEN row.daccRole = '' THEN null ELSE row.daccRole END,
    a.platform = CASE WHEN row.platform = '' THEN null ELSE row.platform END,
    a.workerAction = CASE WHEN row.workerAction = '' THEN null ELSE row.workerAction END,
    a.batonHolder = CASE WHEN row.batonHolder = 'true' THEN true ELSE false END,
    a.batonIdentity = CASE WHEN row.batonIdentity = '' THEN null ELSE row.batonIdentity END,
    a.axesNote = CASE WHEN row.axesNote = '' THEN null ELSE row.axesNote END,
    a.updatedAt = datetime('${stamp}');

LOAD CSV WITH HEADERS FROM 'file:///edges.csv' AS row
MATCH (s:Agent {id: row.source})
MATCH (t:Agent {id: row.target})
MERGE (s)-[r:RELATED {relationType: row.relationType}]->(t)
SET r.strength = CASE WHEN row.strength = '' THEN null ELSE toFloat(row.strength) END,
    r.risk = row.risk,
    r.direction = row.direction,
    r.updatedAt = datetime('${stamp}');

LOAD CSV WITH HEADERS FROM 'file:///domain_membership.csv' AS row
MATCH (a:Agent {id: row.agentId})
MERGE (d:Domain {name: row.domain})
MERGE (a)-[:IN_DOMAIN]->(d);
`;

  const loadApoc = `// Neo4j load script (APOC variant)
// Regenerated ${stamp}
// Axes: daccRole ⊥ platform ⊥ workerAction ⊥ batonHolder

CREATE CONSTRAINT agent_id IF NOT EXISTS
FOR (a:Agent)
REQUIRE a.id IS UNIQUE;

CALL apoc.load.csv('file:///nodes.csv') YIELD map AS row
MERGE (a:Agent {id: row.id})
SET a.kind = row.kind,
    a.cluster = row.cluster,
    a.domains = CASE WHEN row.domains = '' THEN [] ELSE split(row.domains, '|') END,
    a.daccRole = CASE WHEN row.daccRole = '' THEN null ELSE row.daccRole END,
    a.platform = CASE WHEN row.platform = '' THEN null ELSE row.platform END,
    a.workerAction = CASE WHEN row.workerAction = '' THEN null ELSE row.workerAction END,
    a.batonHolder = CASE WHEN row.batonHolder = 'true' THEN true ELSE false END,
    a.batonIdentity = CASE WHEN row.batonIdentity = '' THEN null ELSE row.batonIdentity END,
    a.axesNote = CASE WHEN row.axesNote = '' THEN null ELSE row.axesNote END,
    a.updatedAt = datetime('${stamp}');

CALL apoc.load.csv('file:///edges.csv') YIELD map AS row
MATCH (s:Agent {id: row.source})
MATCH (t:Agent {id: row.target})
MERGE (s)-[r:RELATED {relationType: row.relationType}]->(t)
SET r.strength = CASE WHEN row.strength = '' THEN null ELSE toFloat(row.strength) END,
    r.risk = row.risk,
    r.direction = row.direction,
    r.updatedAt = datetime('${stamp}');

CALL apoc.load.csv('file:///domain_membership.csv') YIELD map AS row
MATCH (a:Agent {id: row.agentId})
MERGE (d:Domain {name: row.domain})
MERGE (a)-[:IN_DOMAIN]->(d);
`;

  fs.writeFileSync(path.join(neo4jRoot, 'load.noapoc.cypher'), loadNoApoc);
  fs.writeFileSync(path.join(neo4jRoot, 'load.apoc.cypher'), loadApoc);

  const readme = `# Agent Relationship Neo4j Package

Regenerated: ${stamp}

## Axis contract

Nodes now include:

- \`daccRole\` — hierarchy seat (director/orchestrator/broker/worker/…)
- \`platform\` — fulfillment surface (antigravity/claude/pi/master-clock/…)
- \`workerAction\` — work type (may be \`orchestrator\` without holding the baton)
- \`batonHolder\` / \`batonIdentity\` — only \`master-clock-baton\` is the protocol baton

\`cluster: orchestration\` is a **work-domain affinity label**, not baton ownership.
Canonical taxonomy viz: \`/visualizations/graphs/dacc-role-platform-axes.html\`

## Files

- \`nodes.csv\`: agent nodes with axis metadata
- \`edges.csv\`: typed relationships
- \`domain_membership.csv\`: agent → domain membership
- \`load.noapoc.cypher\` / \`load.apoc.cypher\`: import scripts
`;

  fs.writeFileSync(path.join(neo4jRoot, 'README.md'), readme);
}

function writeCentralityReport(graphRoot, graph) {
  const ranked = degreeCentrality(graph).slice(0, 10);
  const baton = graph.nodes.find((n) => n.id === 'master-clock-baton');
  const lines = [
    '# Agent Relationship Centrality Report',
    '',
    `Generated: ${stamp.slice(0, 10)}`,
    '',
    '## Axis disclaimer',
    '',
    '- **Degree centrality** measures delegation/dependency topology hubs.',
    '- It does **not** identify the DACC baton. Baton holder is `master-clock-baton`',
    '  (`ORCHESTRATOR-{timestamp}`, platform `master-clock`).',
    '- `orchestrator-agent` may rank high as a **domain coordination persona**;',
    '  that is `workerAction=orchestrator`, not protocol baton ownership.',
    `- Baton node present: ${baton ? 'yes' : 'no'} · batonHolder=${baton ? 'true' : 'n/a'}`,
    '',
    '## full (agent-relationship-graph.json)',
    '',
    `- Nodes: ${graph.nodes.length}`,
    `- Edges: ${graph.edges.length}`,
    '- Top degree hubs (topology only):',
    ...ranked.map(([id, deg]) => {
      const n = graph.nodes.find((x) => x.id === id) || {};
      const role = inferDaccRole(n) || '—';
      const plat = inferPlatform(n) || '—';
      const batonMark = n.id === 'master-clock-baton' ? ' **BATON**' : '';
      return `  - ${id}: ${deg}${batonMark} (daccRole=${role}, platform=${plat})`;
    }),
    '',
    'See domain subgraphs under `subgraphs/` for per-domain hubs.',
    '',
  ];
  ensureDir(path.join(graphRoot, 'reports'));
  fs.writeFileSync(
    path.join(graphRoot, 'reports', 'agent-relationship-centrality-report.md'),
    `${lines.join('\n')}\n`
  );
  writeJson(path.join(graphRoot, 'reports', 'agent-relationship-centrality-report.json'), {
    generatedAt: stamp,
    disclaimer:
      'Degree hubs are topology hubs, not baton holders. Baton = master-clock-baton.',
    nodes: graph.nodes.length,
    edges: graph.edges.length,
    topDegree: ranked.map(([id, degree]) => {
      const n = graph.nodes.find((x) => x.id === id) || {};
      return {
        id,
        degree,
        daccRole: inferDaccRole(n) || null,
        platform: inferPlatform(n) || null,
        batonHolder: n.id === 'master-clock-baton',
      };
    }),
  });
}

function writeOverviewMd(graphRoot, graph) {
  const clusters = {};
  for (const n of graph.nodes) {
    clusters[n.cluster || 'unknown'] = (clusters[n.cluster || 'unknown'] || 0) + 1;
  }
  const edgeTypes = {};
  for (const e of graph.edges) {
    edgeTypes[e.type || 'related'] = (edgeTypes[e.type || 'related'] || 0) + 1;
  }
  const md = `# Agent Relationship Graph

Generated: ${stamp.slice(0, 10)}
Updated: taxonomy alignment (role ⊥ platform)

## Taxonomy

${graph.taxonomy ? JSON.stringify(graph.taxonomy, null, 2) : '(see dacc-role-platform-axes.html)'}

- **Baton**: \`master-clock-baton\` / \`ORCHESTRATOR-{timestamp}\` only
- **Cluster labels** (e.g. \`orchestration\`) are work-domain affinity, not DACC seats
- Canonical viz: \`/visualizations/graphs/dacc-role-platform-axes.html\`

## Snapshot

- Nodes: ${graph.nodes.length}
- Edges: ${graph.edges.length}

### Cluster Distribution

${Object.entries(clusters)
  .sort((a, b) => b[1] - a[1])
  .map(([k, v]) => `- ${k}: ${v}`)
  .join('\n')}

### Relationship Type Distribution

${Object.entries(edgeTypes)
  .sort((a, b) => b[1] - a[1])
  .map(([k, v]) => `- ${k}: ${v}`)
  .join('\n')}

## Neo4j

See \`neo4j-package/README.md\` for axis-aware CSV columns and load scripts.
`;
  fs.writeFileSync(path.join(graphRoot, 'agent-relationship-graph.md'), md);
}

function writeCypherExport(graphRoot, graph) {
  const lines = [
    `// Agent relationship graph export — regenerated ${stamp}`,
    '// Axes: daccRole ⊥ platform ⊥ workerAction ⊥ batonHolder',
    '',
  ];
  for (const n of graph.nodes) {
    const props = {
      id: n.id,
      kind: n.kind || null,
      cluster: n.cluster || null,
      daccRole: inferDaccRole(n) || null,
      platform: inferPlatform(n) || null,
      workerAction: n.workerAction || null,
      batonHolder: n.id === 'master-clock-baton',
      batonIdentity: n.baton_identity || null,
    };
    lines.push(
      `MERGE (a:Agent {id: ${JSON.stringify(n.id)}}) SET a += ${JSON.stringify(props)};`
    );
  }
  lines.push('');
  for (const e of graph.edges) {
    lines.push(
      `MATCH (s:Agent {id: ${JSON.stringify(e.source)}}), (t:Agent {id: ${JSON.stringify(e.target)}}) MERGE (s)-[:RELATED {relationType: ${JSON.stringify(relationTypeForCsv(e.type))}}]->(t);`
    );
  }
  fs.writeFileSync(path.join(graphRoot, 'agent-relationship-graph.noapoc.cypher'), `${lines.join('\n')}\n`);
  fs.writeFileSync(path.join(graphRoot, 'agent-relationship-graph.cypher'), `${lines.join('\n')}\n`);
}

function main() {
  if (!fs.existsSync(path.join(publicGraph, 'agent-relationship-graph.json'))) {
    console.error('Missing public graph JSON:', publicGraph);
    process.exit(1);
  }

  const graph = readJson(path.join(publicGraph, 'agent-relationship-graph.json'));
  graph.updated_at = stamp.slice(0, 10);
  graph.taxonomy = graph.taxonomy || {
    note: 'Cluster labels are work-domain affinity, NOT DACC baton seats.',
    canonical_viz: '/visualizations/graphs/dacc-role-platform-axes.html',
  };

  const added = ensureAuthorityEdges(graph);
  if (graph.metadata) {
    graph.metadata.selected_nodes = graph.nodes.length;
    graph.metadata.selected_edges = graph.edges.length;
    graph.metadata.taxonomy_regen_at = stamp;
    graph.metadata.authority_edges_added = added;
  }

  // Work in tools/ as publish source: seed from public, then overwrite regenerated files.
  ensureDir(toolsGraph);
  copyDirRecursive(publicGraph, toolsGraph);
  writeJson(path.join(toolsGraph, 'agent-relationship-graph.json'), graph);
  rebuildNeo4jPackage(toolsGraph, graph);
  writeCentralityReport(toolsGraph, graph);
  writeOverviewMd(toolsGraph, graph);
  writeCypherExport(toolsGraph, graph);

  // Keep public JSON in sync before publish (publish will re-copy from tools).
  writeJson(path.join(publicGraph, 'agent-relationship-graph.json'), graph);

  console.log(
    JSON.stringify(
      {
        ok: true,
        stamp,
        nodes: graph.nodes.length,
        edges: graph.edges.length,
        authorityEdgesAdded: added,
        toolsGraph: path.relative(repoRoot, toolsGraph),
        next: 'node scripts/visualizations/publish-graph-artifacts.cjs',
      },
      null,
      2
    )
  );
}

main();
