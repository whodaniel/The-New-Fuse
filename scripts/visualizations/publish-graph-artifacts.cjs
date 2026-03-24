#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function exists(filePath) {
  return fs.existsSync(filePath);
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function copyFileSafe(src, dest) {
  if (!exists(src)) return false;
  ensureDir(path.dirname(dest));
  fs.copyFileSync(src, dest);
  return true;
}

function copyDirRecursive(srcDir, destDir) {
  if (!exists(srcDir)) return 0;
  ensureDir(destDir);
  let copied = 0;

  const entries = fs.readdirSync(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    const src = path.join(srcDir, entry.name);
    const dest = path.join(destDir, entry.name);
    if (entry.isDirectory()) {
      copied += copyDirRecursive(src, dest);
      continue;
    }
    if (!entry.isFile()) continue;
    ensureDir(path.dirname(dest));
    fs.copyFileSync(src, dest);
    copied += 1;
  }
  return copied;
}

function csvRowCount(filePath) {
  if (!exists(filePath)) return 0;
  const text = fs.readFileSync(filePath, 'utf8').trim();
  if (!text) return 0;
  const lines = text.split(/\r?\n/);
  return Math.max(0, lines.length - 1);
}

function toPublicPath(filePath, publicRoot) {
  return `/${path.relative(publicRoot, filePath).replace(/\\/g, '/')}`;
}

function collectSubgraphs(subgraphsDir, publicRoot) {
  if (!exists(subgraphsDir)) return [];
  const files = fs.readdirSync(subgraphsDir);
  const jsonFiles = files.filter((name) =>
    /^agent-relationship-(.+)-subgraph\.json$/i.test(name)
  );

  return jsonFiles
    .map((jsonFile) => {
      const match = jsonFile.match(/^agent-relationship-(.+)-subgraph\.json$/i);
      if (!match) return null;
      const domain = match[1].toLowerCase();
      const jsonAbs = path.join(subgraphsDir, jsonFile);
      const htmlAbs = path.join(subgraphsDir, `agent-relationship-${domain}-subgraph.html`);
      const mdAbs = path.join(subgraphsDir, `agent-relationship-${domain}-subgraph.md`);
      const cypherAbs = path.join(subgraphsDir, `agent-relationship-${domain}-subgraph.noapoc.cypher`);
      const payload = readJson(jsonAbs) || {};
      const nodes = Array.isArray(payload.nodes) ? payload.nodes.length : 0;
      const edges = Array.isArray(payload.edges) ? payload.edges.length : 0;

      return {
        domain,
        nodes,
        edges,
        files: {
          json: exists(jsonAbs) ? toPublicPath(jsonAbs, publicRoot) : null,
          html: exists(htmlAbs) ? toPublicPath(htmlAbs, publicRoot) : null,
          markdown: exists(mdAbs) ? toPublicPath(mdAbs, publicRoot) : null,
          cypherNoApoc: exists(cypherAbs) ? toPublicPath(cypherAbs, publicRoot) : null,
        },
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.domain.localeCompare(b.domain));
}

function publishAgentRelationship(repoRoot, publicRoot) {
  const sourceRoot = path.join(repoRoot, 'tools', 'agent-relationship-graph');
  const targetRoot = path.join(publicRoot, 'agent-relationship-graph');

  const copied = {
    files: 0,
    directories: 0,
  };

  const topLevelFiles = [
    'agent-relationship-graph.json',
    'agent-relationship-graph.md',
    'agent-relationship-graph.cypher',
    'agent-relationship-graph.noapoc.cypher',
    'agent-relationship-subgraphs-index.md',
  ];

  for (const rel of topLevelFiles) {
    const ok = copyFileSafe(path.join(sourceRoot, rel), path.join(targetRoot, rel));
    if (ok) copied.files += 1;
  }

  const dirCopies = [
    { from: 'subgraphs', to: 'subgraphs' },
    { from: 'neo4j-package', to: 'neo4j-package' },
    { from: 'reports', to: 'reports' },
  ];

  for (const rel of dirCopies) {
    copied.files += copyDirRecursive(path.join(sourceRoot, rel.from), path.join(targetRoot, rel.to));
    copied.directories += 1;
  }

  // Publish only latest temporal artifacts for UI.
  const snapshotFiles = [
    'latest-snapshot.json',
    'latest-delta.json',
    'latest-delta.md',
    'latest-alert.json',
    'latest-alert.md',
  ];
  for (const file of snapshotFiles) {
    const ok = copyFileSafe(
      path.join(sourceRoot, 'snapshots', file),
      path.join(targetRoot, 'snapshots', file)
    );
    if (ok) copied.files += 1;
  }

  const graphJsonPath = path.join(targetRoot, 'agent-relationship-graph.json');
  const graphJson = readJson(graphJsonPath) || {};
  const nodeCount = Array.isArray(graphJson.nodes) ? graphJson.nodes.length : 0;
  const edgeCount = Array.isArray(graphJson.edges) ? graphJson.edges.length : 0;

  const neo4jRoot = path.join(targetRoot, 'neo4j-package');
  const neo4j = {
    files: {
      nodesCsv: toPublicPath(path.join(neo4jRoot, 'nodes.csv'), publicRoot),
      edgesCsv: toPublicPath(path.join(neo4jRoot, 'edges.csv'), publicRoot),
      domainMembershipCsv: toPublicPath(path.join(neo4jRoot, 'domain_membership.csv'), publicRoot),
      loadNoApocCypher: toPublicPath(path.join(neo4jRoot, 'load.noapoc.cypher'), publicRoot),
      loadApocCypher: toPublicPath(path.join(neo4jRoot, 'load.apoc.cypher'), publicRoot),
      readme: toPublicPath(path.join(neo4jRoot, 'README.md'), publicRoot),
    },
    rows: {
      nodes: csvRowCount(path.join(neo4jRoot, 'nodes.csv')),
      edges: csvRowCount(path.join(neo4jRoot, 'edges.csv')),
      domainMembership: csvRowCount(path.join(neo4jRoot, 'domain_membership.csv')),
    },
  };

  const missingRequirements = [];
  if (!exists(graphJsonPath)) missingRequirements.push('graph-json');
  if (!exists(path.join(neo4jRoot, 'nodes.csv'))) missingRequirements.push('neo4j-nodes-csv');
  if (!exists(path.join(neo4jRoot, 'edges.csv'))) missingRequirements.push('neo4j-edges-csv');
  if (!exists(path.join(neo4jRoot, 'load.noapoc.cypher')))
    missingRequirements.push('neo4j-load-noapoc-cypher');
  if (!exists(path.join(neo4jRoot, 'load.apoc.cypher')))
    missingRequirements.push('neo4j-load-apoc-cypher');

  const subgraphs = collectSubgraphs(path.join(targetRoot, 'subgraphs'), publicRoot);
  if (subgraphs.length === 0) missingRequirements.push('subgraph-html-json-bundle');

  return {
    id: 'agent-relationship-graph',
    title: 'Agent Relationship Graph',
    sourceRoot: path.relative(repoRoot, sourceRoot),
    publicRoot: toPublicPath(targetRoot, publicRoot),
    copied,
    graph: {
      file: toPublicPath(graphJsonPath, publicRoot),
      nodes: nodeCount,
      edges: edgeCount,
    },
    subgraphs,
    neo4j,
    reports: {
      centralityJson: toPublicPath(
        path.join(targetRoot, 'reports', 'agent-relationship-centrality-report.json'),
        publicRoot
      ),
      centralityMarkdown: toPublicPath(
        path.join(targetRoot, 'reports', 'agent-relationship-centrality-report.md'),
        publicRoot
      ),
      hubsMarkdown: toPublicPath(
        path.join(targetRoot, 'reports', 'agent-relationship-subgraph-hubs.md'),
        publicRoot
      ),
    },
    temporal: {
      latestSnapshot: toPublicPath(path.join(targetRoot, 'snapshots', 'latest-snapshot.json'), publicRoot),
      latestDeltaJson: toPublicPath(path.join(targetRoot, 'snapshots', 'latest-delta.json'), publicRoot),
      latestDeltaMarkdown: toPublicPath(path.join(targetRoot, 'snapshots', 'latest-delta.md'), publicRoot),
      latestAlertJson: toPublicPath(path.join(targetRoot, 'snapshots', 'latest-alert.json'), publicRoot),
      latestAlertMarkdown: toPublicPath(path.join(targetRoot, 'snapshots', 'latest-alert.md'), publicRoot),
    },
    missingRequirements,
  };
}

function publishFrameworkMaster(repoRoot, publicRoot) {
  const sourceRoot = path.join(repoRoot, 'tools', 'framework-master-graph');
  const targetRoot = path.join(publicRoot, 'framework-master-graph');

  const copied = {
    files: 0,
    directories: 0,
  };

  const topLevelFiles = [
    'master-framework-graph.json',
    'master-framework-graph.md',
    'master-framework-graph.mmd',
    'master-framework-graph.cypher',
    'master-framework-graph.noapoc.cypher',
  ];

  for (const rel of topLevelFiles) {
    const ok = copyFileSafe(path.join(sourceRoot, rel), path.join(targetRoot, rel));
    if (ok) copied.files += 1;
  }

  copied.files += copyDirRecursive(path.join(sourceRoot, 'neo4j-package'), path.join(targetRoot, 'neo4j-package'));
  copied.directories += 1;

  const graphJsonPath = path.join(targetRoot, 'master-framework-graph.json');
  const graphJson = readJson(graphJsonPath) || {};
  const nodeCount = Array.isArray(graphJson.nodes) ? graphJson.nodes.length : 0;
  const edgeCount = Array.isArray(graphJson.edges) ? graphJson.edges.length : 0;

  const neo4jRoot = path.join(targetRoot, 'neo4j-package');
  const neo4j = {
    files: {
      nodesCsv: toPublicPath(path.join(neo4jRoot, 'nodes.csv'), publicRoot),
      edgesCsv: toPublicPath(path.join(neo4jRoot, 'edges.csv'), publicRoot),
      loadNoApocCypher: toPublicPath(path.join(neo4jRoot, 'load.noapoc.cypher'), publicRoot),
      loadApocCypher: toPublicPath(path.join(neo4jRoot, 'load.apoc.cypher'), publicRoot),
      readme: toPublicPath(path.join(neo4jRoot, 'README.md'), publicRoot),
    },
    rows: {
      nodes: csvRowCount(path.join(neo4jRoot, 'nodes.csv')),
      edges: csvRowCount(path.join(neo4jRoot, 'edges.csv')),
    },
  };

  const missingRequirements = [];
  if (!exists(graphJsonPath)) missingRequirements.push('graph-json');
  if (!exists(path.join(neo4jRoot, 'nodes.csv'))) missingRequirements.push('neo4j-nodes-csv');
  if (!exists(path.join(neo4jRoot, 'edges.csv'))) missingRequirements.push('neo4j-edges-csv');
  if (!exists(path.join(neo4jRoot, 'load.noapoc.cypher')))
    missingRequirements.push('neo4j-load-noapoc-cypher');
  if (!exists(path.join(neo4jRoot, 'load.apoc.cypher')))
    missingRequirements.push('neo4j-load-apoc-cypher');

  return {
    id: 'framework-master-graph',
    title: 'Framework Master Graph',
    sourceRoot: path.relative(repoRoot, sourceRoot),
    publicRoot: toPublicPath(targetRoot, publicRoot),
    copied,
    graph: {
      file: toPublicPath(graphJsonPath, publicRoot),
      nodes: nodeCount,
      edges: edgeCount,
    },
    subgraphs: [],
    neo4j,
    reports: {},
    temporal: {},
    missingRequirements,
  };
}

function main() {
  const repoRoot = process.cwd();
  const publicGraphRoot = path.join(repoRoot, 'apps', 'frontend', 'public', 'visualizations', 'graphs');
  const outputPath = path.join(
    repoRoot,
    'apps',
    'frontend',
    'public',
    'visualizations',
    'data',
    'graph-artifacts.index.json'
  );

  ensureDir(publicGraphRoot);
  ensureDir(path.dirname(outputPath));

  const datasets = [
    publishAgentRelationship(repoRoot, publicGraphRoot),
    publishFrameworkMaster(repoRoot, publicGraphRoot),
  ];

  const missingImplementations = datasets.flatMap((dataset) =>
    (dataset.missingRequirements || []).map((missing) => ({
      datasetId: dataset.id,
      requirement: missing,
    }))
  );

  const payload = {
    generatedAt: new Date().toISOString(),
    source: 'scripts/visualizations/publish-graph-artifacts.cjs',
    datasets,
    missingImplementations,
    totals: {
      datasets: datasets.length,
      graphNodes: datasets.reduce((sum, dataset) => sum + Number(dataset.graph.nodes || 0), 0),
      graphEdges: datasets.reduce((sum, dataset) => sum + Number(dataset.graph.edges || 0), 0),
      subgraphs: datasets.reduce((sum, dataset) => sum + (dataset.subgraphs || []).length, 0),
      missingImplementations: missingImplementations.length,
    },
  };

  fs.writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');

  console.log(`Published graph artifacts: ${path.relative(repoRoot, publicGraphRoot)}`);
  console.log(`Wrote artifact index: ${path.relative(repoRoot, outputPath)}`);
  console.log(
    JSON.stringify(
      {
        datasets: payload.totals.datasets,
        graphNodes: payload.totals.graphNodes,
        graphEdges: payload.totals.graphEdges,
        subgraphs: payload.totals.subgraphs,
        missingImplementations: payload.totals.missingImplementations,
      },
      null,
      2
    )
  );
}

main();
