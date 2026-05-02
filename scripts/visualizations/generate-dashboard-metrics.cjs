#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function walkFiles(root, matcher) {
  if (!fs.existsSync(root)) return [];
  const out = [];
  const stack = [root];
  while (stack.length > 0) {
    const current = stack.pop();
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === '.DS_Store') continue;
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(full);
        continue;
      }
      if (!entry.isFile()) continue;
      if (matcher(full, entry.name)) out.push(full);
    }
  }
  return out.sort();
}

function countByKey(items, keyFn) {
  const map = new Map();
  for (const item of items) {
    const key = keyFn(item);
    map.set(key, (map.get(key) || 0) + 1);
  }
  return map;
}

function safeReadJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
}

function listPersonas(repoRoot) {
  const sources = [
    { id: 'agent_agents', relDir: '.agent/agents', exts: new Set(['.md', '.json']) },
    { id: 'claude_agents', relDir: '.claude/agents', exts: new Set(['.md', '.json']) },
    { id: 'config_ai_agents', relDir: 'config/ai-agents', exts: new Set(['.json', '.md']) },
    { id: 'config_agents', relDir: 'config/agents', exts: new Set(['.json', '.md']) },
  ];

  const records = [];
  for (const source of sources) {
    const abs = path.join(repoRoot, source.relDir);
    const files = walkFiles(abs, (full) => source.exts.has(path.extname(full).toLowerCase()));
    for (const file of files) {
      const ext = path.extname(file);
      const stem = path.basename(file, ext).toLowerCase();
      records.push({
        source: source.id,
        relPath: path.relative(repoRoot, file),
        nameStem: stem,
      });
    }
  }

  const uniqueNames = new Set(records.map((r) => r.nameStem));
  const duplicateCounts = countByKey(records, (r) => r.nameStem);
  const duplicates = Array.from(duplicateCounts.entries())
    .filter(([, count]) => count > 1)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }));

  const bySource = {};
  for (const source of sources) {
    bySource[source.id] = records.filter((r) => r.source === source.id).length;
  }

  return {
    raw_files: records.length,
    unique_names: uniqueNames.size,
    by_source: bySource,
    duplicates,
  };
}

function getSkillStats(repoRoot) {
  const dotSkills = walkFiles(path.join(repoRoot, '.skills'), (full, name) => name === 'SKILL.md').length;
  const agentSkills = walkFiles(path.join(repoRoot, '.agent/skills'), (full, name) => name === 'SKILL.md').length;
  const snapshots = walkFiles(path.join(repoRoot, '.agent/skill-bank/snapshots'), (full, name) => name === 'SKILL.md').length;

  const promotedCatalogPath = path.join(
    repoRoot,
    '.skills/skill-catalog/promoted-snapshot-skills.json'
  );
  const promotedCatalog = safeReadJson(promotedCatalogPath);
  const promotedCount = Number(promotedCatalog?.totals?.skills || 0);

  return {
    permanent_dot_skills: dotSkills,
    permanent_agent_skills: agentSkills,
    permanent_total: dotSkills + agentSkills,
    snapshot_skills: snapshots,
    promoted_snapshot_skills: promotedCount,
  };
}

function getGraphStats(repoRoot) {
  const subgraphsDir = path.join(repoRoot, 'tools/agent-relationship-graph/subgraphs');
  const subgraphHtmlFiles = walkFiles(subgraphsDir, (full) =>
    /agent-relationship-.*-subgraph\.html$/i.test(path.basename(full))
  );
  const domainNames = subgraphHtmlFiles
    .map((f) => {
      const m = path.basename(f).match(/^agent-relationship-(.+)-subgraph\.html$/i);
      return m ? m[1].toLowerCase() : null;
    })
    .filter(Boolean);
  const uniqueDomains = new Set(domainNames);

  const graphPath = path.join(repoRoot, 'tools/agent-relationship-graph/agent-relationship-graph.json');
  const graphJson = safeReadJson(graphPath) || {};
  const nodeCount = Array.isArray(graphJson.nodes) ? graphJson.nodes.length : 0;
  const edgeCount = Array.isArray(graphJson.edges) ? graphJson.edges.length : 0;

  return {
    domain_subgraphs: uniqueDomains.size,
    domain_list: Array.from(uniqueDomains).sort(),
    relationship_nodes: nodeCount,
    relationship_edges: edgeCount,
  };
}

function getIntelligenceStats(repoRoot) {
  const kbPath = path.join(repoRoot, '../my-ai-knowledge-base/AI_Knowledge_Base.md');
  const libPath = path.join(repoRoot, '../my-ai-knowledge-base/video-library/ai_video_library.html');
  
  let artifactsCount = 0;
  let libraryCount = 0;

  if (fs.existsSync(kbPath)) {
    const kbContent = fs.readFileSync(kbPath, 'utf8');
    const matches = kbContent.match(/## #(\d+):/g);
    artifactsCount = matches ? matches.length : 0;
  }

  if (fs.existsSync(libPath)) {
    const libContent = fs.readFileSync(libPath, 'utf8');
    const matches = libContent.match(/<td class="index-col">(\d+)<\/td>/g);
    if (matches) {
      const indices = matches.map(m => parseInt(m.match(/\d+/)[0]));
      libraryCount = Math.max(...indices);
    }
  }

  return {
    master_library: libraryCount,
    executable_artifacts: artifactsCount,
    extraction_density: libraryCount > 0 ? ((artifactsCount / libraryCount) * 100).toFixed(1) + '%' : '0%',
    status: "[STATUS:SYNCHRONIZED]"
  };
}

function getDashboardCardStats() {
  return {
    graph_cards: 7,
    system_cards: 6,
    docs_cards: 8,
    interactive_visualizations: 14, // Increased for Intelligence Map
  };
}

function main() {
  const repoRoot = process.cwd();
  const outputPath = path.join(
    repoRoot,
    'apps/frontend/public/visualizations/data/dashboard-metrics.json'
  );
  ensureDir(path.dirname(outputPath));

  const payload = {
    generated_at: new Date().toISOString(),
    source: {
      repo_root: repoRoot,
      generator: 'scripts/visualizations/generate-dashboard-metrics.cjs',
    },
    intelligence: getIntelligenceStats(repoRoot),
    agents: listPersonas(repoRoot),
    skills: getSkillStats(repoRoot),
    graph: getGraphStats(repoRoot),
    dashboard: getDashboardCardStats(),
  };

  fs.writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  console.log(`Dashboard metrics written: ${outputPath}`);
  console.log(
    JSON.stringify(
      {
        generated_at: payload.generated_at,
        intelligence_density: payload.intelligence.extraction_density,
        agents_unique: payload.agents.unique_names,
        agents_raw: payload.agents.raw_files,
        domains: payload.graph.domain_subgraphs,
        interactive_visualizations: payload.dashboard.interactive_visualizations,
      },
      null,
      2
    )
  );
}

main();

