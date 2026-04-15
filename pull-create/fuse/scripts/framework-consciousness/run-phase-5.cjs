#!/usr/bin/env node
/**
 * Framework Consciousness - Phase 5
 *
 * Emergence & Evolution:
 *  - Self-analysis capability snapshot
 *  - Evolutionary pathway generation
 *  - Adaptive learning loop signals
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECT_ROOT = path.resolve(__dirname, '../..');
const OUTPUT_DIR = path.join(PROJECT_ROOT, '.framework-consciousness');

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

function countLines(cmd) {
  const out = safeRun(cmd, '0').trim();
  const num = Number(out);
  return Number.isFinite(num) ? num : 0;
}

function selfAnalysis() {
  const packageJson = readJson(path.join(PROJECT_ROOT, 'package.json'), { scripts: {} });
  const scripts = Object.keys(packageJson.scripts || {});

  const diagnostics = {
    hasTnfDoctor: scripts.includes('tnf:doctor'),
    hasImproverScan: scripts.includes('improver:scan'),
    hasHealthCheck: scripts.includes('health-check'),
    hasHealthCheckFull: scripts.includes('health-check:full'),
    hasSupercycle: scripts.includes('factory:supercycle')
  };

  const metrics = {
    performanceSignals: {
      monitoringRefs: countLines(
        "rg -n 'monitoring|metrics|latency|throughput|health check' docs scripts packages apps --glob '!**/node_modules/**' | wc -l"
      ),
      loadTestAssets: countLines("find scripts -name '*load*test*' -o -name 'run-load-tests.js' | wc -l")
    },
    qualitySignals: {
      testFileCount: countLines("find apps packages test tests -name '*test*' -o -name '*spec*' 2>/dev/null | wc -l"),
      lintScripts: scripts.filter(s => s.startsWith('lint')).length,
      typecheckScripts: scripts.filter(s => s.includes('type-check')).length
    },
    growthSignals: {
      tnfSkillCount: countLines("find .agent/skills -name SKILL.md | wc -l"),
      claudeSkillCount: countLines("find .claude/skills -name '*.md' | wc -l"),
      agentTemplateCount: countLines("find .agent/agents -name '*.md' | wc -l"),
      docsCount: countLines("find docs -name '*.md' | wc -l")
    }
  };

  return {
    diagnostics,
    metrics
  };
}

function evolutionaryPathways(selfSnapshot) {
  const todoCount = countLines("rg -n '\\bTODO\\b|\\bFIXME\\b|\\bXXX\\b' apps packages scripts docs --glob '!**/node_modules/**' | wc -l");
  const unresolvedConflictMarkers = countLines("rg -n '<<<<<<<|=======|>>>>>>>' apps packages scripts docs --glob '!**/node_modules/**' | wc -l");
  const docsRoadmapSignals = countLines("rg -n 'roadmap|next steps|pending|backlog' docs .agent --glob '!**/node_modules/**' | wc -l");

  const pathways = [
    {
      name: 'Incremental Enhancement',
      priority: 'P1',
      rationale: 'Existing diagnostics and health-check scripts indicate continuous hardening path.',
      actions: [
        'Run tnf:doctor and improver:scan on schedule',
        'Promote failing checks to actionable tasks',
        'Track closure rate of TODO/FIXME items'
      ],
      signal: {
        hasDiagnostics: selfSnapshot.diagnostics.hasTnfDoctor && selfSnapshot.diagnostics.hasImproverScan,
        todoCount
      }
    },
    {
      name: 'Capability Addition',
      priority: 'P1',
      rationale: 'Large skill inventory indicates capacity to add specialized capabilities quickly.',
      actions: [
        'Expand MCP connectors where signal density is high',
        'Add missing framework-consciousness phase runners (Phase 6)',
        'Template new agent personas for repetitive ops'
      ],
      signal: {
        skillBase: selfSnapshot.metrics.growthSignals.tnfSkillCount + selfSnapshot.metrics.growthSignals.claudeSkillCount,
        roadmapSignals: docsRoadmapSignals
      }
    },
    {
      name: 'Pattern Refinement',
      priority: 'P2',
      rationale: 'High volume of docs and workflow references supports standardization for lower variance.',
      actions: [
        'Unify workflow playbooks under docs/process',
        'Normalize health metrics schema across services',
        'Reduce duplicate scripts with shared utilities'
      ],
      signal: {
        docsCount: selfSnapshot.metrics.growthSignals.docsCount
      }
    },
    {
      name: 'Emergent Synthesis',
      priority: 'P2',
      rationale: 'Cross-system integration signals suggest strong potential from combining orchestration + monitoring + learning loops.',
      actions: [
        'Link orchestration events to learning artifacts',
        'Score workflow outcomes and feed routing decisions',
        'Publish monthly capability delta reports'
      ],
      signal: {
        unresolvedConflictMarkers
      }
    }
  ];

  return {
    opportunitySignals: {
      todoCount,
      unresolvedConflictMarkers,
      docsRoadmapSignals
    },
    pathways
  };
}

function adaptiveLearningLoops() {
  const loops = [
    {
      name: 'Pattern Recognition Loop',
      query: "rg -n 'pattern|classification|concept extraction|knowledge graph' docs .documentation-system scripts .agent --glob '!**/node_modules/**'"
    },
    {
      name: 'Feedback Integration Loop',
      query: "rg -n 'feedback|review|retrospective|handoff' docs .agent scripts --glob '!**/node_modules/**'"
    },
    {
      name: 'Error Learning Loop',
      query: "rg -n 'error|failure|postmortem|incident|conflict' docs scripts .agent --glob '!**/node_modules/**'"
    },
    {
      name: 'Success Amplification Loop',
      query: "rg -n 'success|best practice|playbook|quick start|guide' docs .agent scripts --glob '!**/node_modules/**'"
    }
  ];

  return loops.map(loop => {
    const refs = safeRun(`${loop.query} | head -n 40`, '');
    const lines = refs.split('\n').map(s => s.trim()).filter(Boolean);
    return {
      name: loop.name,
      signalCount: lines.length,
      active: lines.length > 0,
      sampleRefs: lines.slice(0, 10)
    };
  });
}

function main() {
  ensureOutputDir();
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  FRAMEWORK CONSCIOUSNESS - Phase 5                        ║');
  console.log('║  Emergence & Evolution                                    ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  console.log('[1/4] Self-Analysis Capability');
  const selfSnapshot = selfAnalysis();
  console.log('  ✅ Self-analysis metrics captured\n');

  console.log('[2/4] Evolutionary Pathways');
  const evolution = evolutionaryPathways(selfSnapshot);
  console.log(`  ✅ Pathways generated: ${evolution.pathways.length}\n`);

  console.log('[3/4] Adaptive Learning Loops');
  const learningLoops = adaptiveLearningLoops();
  const activeLoops = learningLoops.filter(l => l.active).length;
  console.log(`  ✅ Active learning loops detected: ${activeLoops}/${learningLoops.length}\n`);

  const phase4Report = readJson(path.join(OUTPUT_DIR, 'phase-4-capability-synthesis-report.json'), null);
  const report = {
    timestamp: new Date().toISOString(),
    phase: 'Phase 5: Emergence & Evolution',
    status: 'Complete',
    input: {
      phase4ReportPresent: Boolean(phase4Report),
      phase4Timestamp: phase4Report?.timestamp || null
    },
    selfAnalysis: selfSnapshot,
    evolution,
    learningLoops,
    nextPhase: 'Phase 6: Reach & Value'
  };

  const outPath = path.join(OUTPUT_DIR, 'phase-5-emergence-evolution-report.json');
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2));

  console.log('[4/4] Report Generation');
  console.log(`  ✅ Report saved: ${outPath}\n`);
  console.log('Phase 5 complete. Continue with reach and value maximization.\n');
}

main();
