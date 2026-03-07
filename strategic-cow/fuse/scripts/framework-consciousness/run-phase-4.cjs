#!/usr/bin/env node
/**
 * Framework Consciousness - Phase 4
 *
 * Capability Synthesis:
 *  - Capability extraction by category
 *  - Workflow pattern recognition
 *  - Value chain mapping
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

function collectSignals(query, maxRefs = 10) {
  const out = safeRun(`${query} | head -n 40`, '');
  const lines = out.split('\n').map(s => s.trim()).filter(Boolean);
  return {
    signalCount: lines.length,
    sampleRefs: lines.slice(0, maxRefs)
  };
}

function extractCapabilities() {
  const categories = [
    {
      name: 'Agent Orchestration',
      query:
        "rg -n 'orchestrator|swarm|task distribution|agent coordination|relay' apps packages scripts docs .agent --glob '!**/node_modules/**'"
    },
    {
      name: 'Browser Automation',
      query:
        "rg -n 'playwright|puppeteer|browsermcp|chrome-extension|automation' apps packages scripts docs --glob '!**/node_modules/**'"
    },
    {
      name: 'Documentation Management',
      query:
        "rg -n 'documentation system|knowledge graph|concept extraction|documentation' .documentation-system docs scripts .agent --glob '!**/node_modules/**'"
    },
    {
      name: 'Development Automation',
      query:
        "rg -n 'build|test|deploy|pipeline|ci|release gate' package.json scripts docs .github --glob '!**/node_modules/**'"
    },
    {
      name: 'Communication',
      query:
        "rg -n 'WebSocket|channel|message routing|agent communication|relay' apps packages scripts docs --glob '!**/node_modules/**'"
    }
  ];

  return categories.map(category => {
    const signals = collectSignals(category.query);
    return {
      category: category.name,
      detected: signals.signalCount > 0,
      signalCount: signals.signalCount,
      sampleRefs: signals.sampleRefs
    };
  });
}

function extractWorkflowPatterns() {
  const workflows = [
    {
      name: 'Session initialization',
      query:
        "rg -n 'onboard|frontload|session bootstrap|runtime-state' AGENTS.md docs scripts .agent --glob '!**/node_modules/**'"
    },
    {
      name: 'Multi-agent orchestration',
      query:
        "rg -n 'orchestrator|delegate|swarm|multi-agent' docs scripts packages .agent --glob '!**/node_modules/**'"
    },
    {
      name: 'Federated analysis execution',
      query:
        "rg -n 'federated|analysis|stage 3|concept extraction' docs scripts .documentation-system .agent --glob '!**/node_modules/**'"
    },
    {
      name: 'Continuous deployment and operations',
      query:
        "rg -n 'railway|deploy|supervisor|loop|cron' docs scripts railway.toml .github --glob '!**/node_modules/**'"
    },
    {
      name: 'Agent registration and discovery',
      query:
        "rg -n 'agent registry|available agents|discover|agent bank' docs scripts .agent --glob '!**/node_modules/**'"
    },
    {
      name: 'Documentation improvement cycle',
      query:
        "rg -n 'living documentation|improve documentation|classification|manifest|concept' docs .documentation-system scripts .agent --glob '!**/node_modules/**'"
    }
  ];

  return workflows.map(workflow => {
    const signals = collectSignals(workflow.query);
    return {
      workflow: workflow.name,
      detected: signals.signalCount > 0,
      signalCount: signals.signalCount,
      sampleRefs: signals.sampleRefs
    };
  });
}

function mapValueChains() {
  const chains = [
    {
      name: 'Problem -> Analysis -> Solution -> Deployment',
      steps: ['Problem intake', 'Analysis', 'Implementation', 'Deployment'],
      query:
        "rg -n 'analysis|implementation|deploy|release gate|fix' docs scripts .agent --glob '!**/node_modules/**'"
    },
    {
      name: 'Idea -> Planning -> Execution -> Validation',
      steps: ['Idea capture', 'Planning', 'Execution', 'Validation'],
      query:
        "rg -n 'plan|task_plan|execute|verify|validation|test' docs scripts .agent --glob '!**/node_modules/**'"
    },
    {
      name: 'Data -> Processing -> Knowledge -> Insight',
      steps: ['Data collection', 'Processing', 'Knowledge extraction', 'Insight'],
      query:
        "rg -n 'data|processing|extract|knowledge|insight|report' docs scripts packages apps --glob '!**/node_modules/**'"
    },
    {
      name: 'Question -> Research -> Answer -> Action',
      steps: ['Question', 'Research', 'Answer', 'Action'],
      query:
        "rg -n 'research|answer|action|next steps|recommendation' docs scripts .agent --glob '!**/node_modules/**'"
    }
  ];

  return chains.map(chain => {
    const signals = collectSignals(chain.query);
    return {
      chain: chain.name,
      steps: chain.steps,
      detected: signals.signalCount > 0,
      signalCount: signals.signalCount,
      sampleRefs: signals.sampleRefs
    };
  });
}

function main() {
  ensureOutputDir();
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  FRAMEWORK CONSCIOUSNESS - Phase 4                        ║');
  console.log('║  Capability Synthesis                                     ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  console.log('[1/4] Capability Extraction');
  const capabilities = extractCapabilities();
  const capabilityDetected = capabilities.filter(c => c.detected).length;
  console.log(`  ✅ Capability categories detected: ${capabilityDetected}/${capabilities.length}\n`);

  console.log('[2/4] Workflow Pattern Recognition');
  const workflows = extractWorkflowPatterns();
  const workflowsDetected = workflows.filter(w => w.detected).length;
  console.log(`  ✅ Workflow patterns detected: ${workflowsDetected}/${workflows.length}\n`);

  console.log('[3/4] Value Chain Mapping');
  const valueChains = mapValueChains();
  const chainsDetected = valueChains.filter(v => v.detected).length;
  console.log(`  ✅ Value chains detected: ${chainsDetected}/${valueChains.length}\n`);

  const phase3Report = readJson(path.join(OUTPUT_DIR, 'phase-3-integration-intelligence-report.json'), null);
  const report = {
    timestamp: new Date().toISOString(),
    phase: 'Phase 4: Capability Synthesis',
    status: 'Complete',
    input: {
      phase3ReportPresent: Boolean(phase3Report),
      phase3Timestamp: phase3Report?.timestamp || null
    },
    capabilityCatalog: capabilities,
    workflowPatterns: workflows,
    valueChains,
    nextPhase: 'Phase 5: Emergence & Evolution'
  };

  const outPath = path.join(OUTPUT_DIR, 'phase-4-capability-synthesis-report.json');
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2));

  console.log('[4/4] Report Generation');
  console.log(`  ✅ Report saved: ${outPath}\n`);
  console.log('Phase 4 complete. Continue with emergence and evolution.\n');
}

main();
