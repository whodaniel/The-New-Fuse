#!/usr/bin/env node
/**
 * Framework Consciousness - Phase 2
 *
 * Performs deep pattern recognition for:
 *  - Protocol analysis
 *  - Architectural pattern mining
 *  - Data flow signal mapping
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECT_ROOT = path.resolve(__dirname, '../..');
const OUTPUT_DIR = path.join(PROJECT_ROOT, '.framework-consciousness');

const PROTOCOL_CANDIDATES = [
  'PROTOCOL_ALIGNMENT_FRAMEWORK.md',
  'INFORMATION_SEQUENCING_PROTOCOL.md',
  'MASTER_ORCHESTRATOR_COORDINATION_PROTOCOLS.md',
  'AGENT_COMMUNICATION_PROTOCOL.md',
  'DACC-v1.md',
  'MCP.md'
];

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

function analyzeProtocols() {
  const catalog = [];

  for (const protocolName of PROTOCOL_CANDIDATES) {
    const matches = safeRun(`rg --files -g '*${protocolName}'`, '')
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);

    if (matches.length === 0) {
      catalog.push({
        protocol: protocolName,
        found: false
      });
      continue;
    }

    const protocolPath = matches[0];
    const absPath = path.join(PROJECT_ROOT, protocolPath);
    const lineCount = Number(safeRun(`wc -l < "${protocolPath}"`, '0')) || 0;
    const heading = safeRun(`sed -n '1,40p' "${protocolPath}" | rg -n '^#' | head -n 1`, '');

    catalog.push({
      protocol: protocolName,
      found: true,
      path: protocolPath,
      lineCount,
      firstHeading: heading || null,
      sizeBytes: fs.statSync(absPath).size
    });
  }

  return {
    requiredProtocols: PROTOCOL_CANDIDATES.length,
    discoveredProtocols: catalog.filter(p => p.found).length,
    coveragePct: Number(((catalog.filter(p => p.found).length / PROTOCOL_CANDIDATES.length) * 100).toFixed(1)),
    catalog
  };
}

function analyzeArchitecture() {
  const pnpmWorkspace = fs.existsSync(path.join(PROJECT_ROOT, 'pnpm-workspace.yaml'));
  const packageJson = readJson(path.join(PROJECT_ROOT, 'package.json'), { workspaces: [] });

  const nestJsHits = Number(safeRun(`rg -n '"@nestjs/' apps packages src --glob '!**/node_modules/**' | wc -l`, '0')) || 0;
  const webSocketHits = Number(
    safeRun(`rg -n 'WebSocket|websocket|socket\\.io|\\bws\\b' apps packages src relay-server --glob '!**/node_modules/**' | wc -l`, '0')
  ) || 0;
  const mcpHits = Number(
    safeRun(
      `rg -n 'modelcontextprotocol|MCP|mcp-server|server-mcp' apps packages src tools data --glob '!**/node_modules/**' | wc -l`,
      '0'
    )
  ) || 0;

  return {
    monorepo: {
      detected: pnpmWorkspace,
      workspaceDeclCount: Array.isArray(packageJson.workspaces) ? packageJson.workspaces.length : 0
    },
    patterns: [
      {
        name: 'NestJS service architecture',
        detected: nestJsHits > 0,
        signalCount: nestJsHits
      },
      {
        name: 'WebSocket relay pattern',
        detected: webSocketHits > 0,
        signalCount: webSocketHits
      },
      {
        name: 'MCP integration pattern',
        detected: mcpHits > 0,
        signalCount: mcpHits
      }
    ]
  };
}

function analyzeDataFlowSignals() {
  const flows = [
    {
      name: 'WebSocket message routing',
      query: `rg -n 'message routing|route.*message|WebSocketGateway|ws' apps packages relay-server --glob '!**/node_modules/**' | head -n 25`
    },
    {
      name: 'Agent-to-agent communication',
      query: `rg -n 'agent.*communication|orchestrator|channel|relay' .agent docs scripts apps packages --glob '!**/node_modules/**' | head -n 25`
    },
    {
      name: 'Browser extension to backend',
      query: `rg -n 'chrome-extension|runtime\\.sendMessage|fetch\\(|api-gateway|backend' apps scripts docs --glob '!**/node_modules/**' | head -n 25`
    },
    {
      name: 'Database persistence patterns',
      query: `rg -n 'drizzle|postgres|persist|repository|INSERT|SELECT' apps packages db data --glob '!**/node_modules/**' | head -n 25`
    },
    {
      name: 'Cache and invalidation',
      query: `rg -n 'redis|cache|invalidate|ttl|expire' apps packages scripts --glob '!**/node_modules/**' | head -n 25`
    }
  ];

  return flows.map(flow => {
    const sample = safeRun(flow.query, '');
    const lines = sample.split('\n').map(s => s.trim()).filter(Boolean);
    return {
      name: flow.name,
      signalCount: lines.length,
      sampleRefs: lines.slice(0, 10)
    };
  });
}

function main() {
  ensureOutputDir();
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  FRAMEWORK CONSCIOUSNESS - Phase 2                        ║');
  console.log('║  Deep Pattern Recognition                                 ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  console.log('[1/4] Protocol Analysis');
  const protocols = analyzeProtocols();
  console.log(
    `  ✅ Found ${protocols.discoveredProtocols}/${protocols.requiredProtocols} target protocols (${protocols.coveragePct}% coverage)\n`
  );

  console.log('[2/4] Architectural Pattern Mining');
  const architecture = analyzeArchitecture();
  const detectedPatternCount = architecture.patterns.filter(p => p.detected).length;
  console.log(`  ✅ Detected ${detectedPatternCount}/${architecture.patterns.length} core architecture patterns\n`);

  console.log('[3/4] Data Flow Signal Mapping');
  const dataFlows = analyzeDataFlowSignals();
  const signaledFlows = dataFlows.filter(f => f.signalCount > 0).length;
  console.log(`  ✅ Detected signal evidence in ${signaledFlows}/${dataFlows.length} key flows\n`);

  const foundationReport = readJson(path.join(OUTPUT_DIR, 'foundation-discovery-report.json'), null);
  const report = {
    timestamp: new Date().toISOString(),
    phase: 'Phase 2: Deep Pattern Recognition',
    status: 'Complete',
    input: {
      foundationReportPresent: Boolean(foundationReport),
      foundationTimestamp: foundationReport?.timestamp || null
    },
    protocolAnalysis: protocols,
    architecturePatterns: architecture,
    dataFlowSignals: dataFlows,
    nextPhase: 'Phase 3: Integration Intelligence'
  };

  const outPath = path.join(OUTPUT_DIR, 'phase-2-pattern-recognition-report.json');
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2));

  console.log('[4/4] Report Generation');
  console.log(`  ✅ Report saved: ${outPath}\n`);
  console.log('Phase 2 complete. Continue with integration intelligence.\n');
}

main();
