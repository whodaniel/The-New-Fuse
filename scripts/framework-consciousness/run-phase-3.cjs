#!/usr/bin/env node
/**
 * Framework Consciousness - Phase 3
 *
 * Integration Intelligence:
 *  - Dependency graph construction
 *  - Cross-system integration mapping
 *  - Skill interaction analysis signals
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECT_ROOT = path.resolve(__dirname, '../..');
const OUTPUT_DIR = path.join(PROJECT_ROOT, '.framework-consciousness');
const SCAN_ROOTS = ['apps', 'packages', 'tools'];

function run(cmd) {
  return execSync(cmd, { cwd: PROJECT_ROOT, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
}

function safeRun(cmd, fallback = '') {
  try {
    return run(cmd);
  } catch (_err) {
    return fallback;
  }
}

function readJson(filePath, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch (_err) {
    return fallback;
  }
}

function ensureOutputDir() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
}

function findWorkspacePackages() {
  const pkgFiles = [];
  for (const root of SCAN_ROOTS) {
    const rootPath = path.join(PROJECT_ROOT, root);
    if (!fs.existsSync(rootPath)) continue;
    const result = safeRun(`find "${root}" -name package.json -not -path '*/node_modules/*'`, '');
    const files = result.split('\n').map(s => s.trim()).filter(Boolean);
    pkgFiles.push(...files);
  }

  const packages = [];
  for (const relPath of pkgFiles) {
    const absPath = path.join(PROJECT_ROOT, relPath);
    const pkg = readJson(absPath, null);
    if (!pkg || !pkg.name) continue;
    packages.push({
      name: pkg.name,
      path: relPath,
      json: pkg
    });
  }
  return packages;
}

function buildDependencyGraph(packages) {
  const names = new Set(packages.map(p => p.name));
  const edges = [];

  for (const pkg of packages) {
    const depFields = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies'];
    for (const field of depFields) {
      const deps = pkg.json[field] || {};
      for (const [depName, depVersion] of Object.entries(deps)) {
        edges.push({
          from: pkg.name,
          to: depName,
          kind: field,
          spec: depVersion,
          internal: names.has(depName)
        });
      }
    }
  }

  const internalEdges = edges.filter(e => e.internal);
  const externalEdges = edges.filter(e => !e.internal);

  const outDegree = new Map();
  for (const edge of internalEdges) {
    outDegree.set(edge.from, (outDegree.get(edge.from) || 0) + 1);
  }

  const topInternalDependers = Array.from(outDegree.entries())
    .map(([name, count]) => ({ name, internalDeps: count }))
    .sort((a, b) => b.internalDeps - a.internalDeps)
    .slice(0, 15);

  return {
    nodeCount: packages.length,
    edgeCount: edges.length,
    internalEdgeCount: internalEdges.length,
    externalEdgeCount: externalEdges.length,
    topInternalDependers,
    sampleInternalEdges: internalEdges.slice(0, 30),
    sampleExternalEdges: externalEdges.slice(0, 30)
  };
}

function mapIntegrations() {
  const integrations = [
    {
      name: 'Gemini',
      query: `rg -n 'gemini' apps packages scripts docs .gemini --glob '!**/node_modules/**' | head -n 20`
    },
    {
      name: 'Claude',
      query: `rg -n 'claude|anthropic' apps packages scripts docs .claude --glob '!**/node_modules/**' | head -n 20`
    },
    {
      name: 'n8n',
      query: `rg -n '\\bn8n\\b|workflow engine' apps packages scripts docs --glob '!**/node_modules/**' | head -n 20`
    },
    {
      name: 'PostgreSQL',
      query: `rg -n 'postgres|postgresql|drizzle' apps packages scripts data --glob '!**/node_modules/**' | head -n 20`
    },
    {
      name: 'Redis',
      query: `rg -n 'redis|cache|ttl|expire' apps packages scripts --glob '!**/node_modules/**' | head -n 20`
    },
    {
      name: 'CloudRuntime',
      query: `rg -n 'cloud_runtime|CLOUD_RUNTIME_' apps packages scripts docs cloud_runtime.toml --glob '!**/node_modules/**' | head -n 20`
    },
    {
      name: 'GitHub',
      query: `rg -n 'github|GITHUB_|actions' .github apps packages scripts docs --glob '!**/node_modules/**' | head -n 20`
    },
    {
      name: 'Slack',
      query: `rg -n 'slack|SLACK_' apps packages scripts docs data --glob '!**/node_modules/**' | head -n 20`
    },
    {
      name: 'Browser Automation',
      query: `rg -n 'playwright|puppeteer|chrome extension|browsermcp' apps packages scripts docs --glob '!**/node_modules/**' | head -n 20`
    },
    {
      name: 'MCP',
      query: `rg -n 'modelcontextprotocol|\\bMCP\\b|mcp-server|mcp_config' apps packages scripts src data docs --glob '!**/node_modules/**' | head -n 30`
    }
  ];

  return integrations.map(item => {
    const hits = safeRun(item.query, '');
    const lines = hits.split('\n').map(s => s.trim()).filter(Boolean);
    return {
      name: item.name,
      signalCount: lines.length,
      detected: lines.length > 0,
      sampleRefs: lines.slice(0, 10)
    };
  });
}

function analyzeSkillInteractions() {
  const tnfSkillsCount = Number(safeRun(`find .agent/skills -name SKILL.md | wc -l`, '0')) || 0;
  const claudeSkillsCount = Number(safeRun(`find .claude/skills -name '*.md' | wc -l`, '0')) || 0;
  const orchestrationSignalCount = Number(
    safeRun(
      `rg -n 'orchestrator|delegate|coordination|swarm|task distribution' .agent docs scripts apps packages --glob '!**/node_modules/**' | wc -l`,
      '0'
    )
  ) || 0;

  return {
    tnfSkillsCount,
    claudeSkillsCount,
    totalKnownSkills: tnfSkillsCount + claudeSkillsCount,
    orchestrationSignalCount
  };
}

function main() {
  ensureOutputDir();
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  FRAMEWORK CONSCIOUSNESS - Phase 3                        ║');
  console.log('║  Integration Intelligence                                  ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  console.log('[1/4] Dependency Graph Construction');
  const packages = findWorkspacePackages();
  const dependencyGraph = buildDependencyGraph(packages);
  console.log(
    `  ✅ Graph built: ${dependencyGraph.nodeCount} nodes, ${dependencyGraph.edgeCount} edges (${dependencyGraph.internalEdgeCount} internal)\n`
  );

  console.log('[2/4] Cross-System Integration Mapping');
  const integrations = mapIntegrations();
  const detectedCount = integrations.filter(i => i.detected).length;
  console.log(`  ✅ Integration signals detected: ${detectedCount}/${integrations.length}\n`);

  console.log('[3/4] Skill Interaction Analysis');
  const skillInteractions = analyzeSkillInteractions();
  console.log(`  ✅ Skill inventory signals: ${skillInteractions.totalKnownSkills} known skill docs\n`);

  const phase2Report = readJson(path.join(OUTPUT_DIR, 'phase-2-pattern-recognition-report.json'), null);
  const report = {
    timestamp: new Date().toISOString(),
    phase: 'Phase 3: Integration Intelligence',
    status: 'Complete',
    input: {
      phase2ReportPresent: Boolean(phase2Report),
      phase2Timestamp: phase2Report?.timestamp || null
    },
    dependencyGraph,
    integrations,
    skillInteractions,
    nextPhase: 'Phase 4: Capability Synthesis'
  };

  const outPath = path.join(OUTPUT_DIR, 'phase-3-integration-intelligence-report.json');
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2));

  console.log('[4/4] Report Generation');
  console.log(`  ✅ Report saved: ${outPath}\n`);
  console.log('Phase 3 complete. Continue with capability synthesis.\n');
}

main();
