#!/usr/bin/env node
/**
 * Framework Consciousness - Phase 6
 *
 * Reach & Value:
 *  - Integration expansion opportunities
 *  - Value demonstration portfolio signals
 *  - Community building readiness
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
  const raw = safeRun(cmd, '0').trim();
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
}

function collectRefs(query, max = 10) {
  const out = safeRun(`${query} | head -n 60`, '');
  const lines = out.split('\n').map(s => s.trim()).filter(Boolean);
  return {
    signalCount: lines.length,
    refs: lines.slice(0, max)
  };
}

function integrationExpansion() {
  const targets = [
    {
      name: 'AI Models (OpenAI/Anthropic/Google)',
      query: "rg -n 'openai|anthropic|google|generative-ai|llm provider' docs scripts packages apps .agent --glob '!**/node_modules/**'"
    },
    {
      name: 'Automation Platforms (n8n/Zapier/IFTTT)',
      query: "rg -n '\\bn8n\\b|zapier|ifttt|workflow automation' docs scripts packages apps --glob '!**/node_modules/**'"
    },
    {
      name: 'Dev Platforms (GitHub/GitLab/Linear)',
      query: "rg -n 'github|gitlab|linear|issues|pr|pull request' docs scripts packages apps .agent --glob '!**/node_modules/**'"
    },
    {
      name: 'Communication Platforms (Slack/Discord/Teams)',
      query: "rg -n 'slack|discord|teams|notification|channel' docs scripts packages apps --glob '!**/node_modules/**'"
    },
    {
      name: 'MCP Connectors',
      query: "rg -n 'mcp_config|mcp server|modelcontextprotocol|mcpServers' data docs scripts src apps packages --glob '!**/node_modules/**'"
    }
  ];

  return targets.map(target => {
    const sig = collectRefs(target.query, 10);
    return {
      target: target.name,
      detected: sig.signalCount > 0,
      signalCount: sig.signalCount,
      sampleRefs: sig.refs
    };
  });
}

function valueDemonstrationPortfolio() {
  const demoSignals = {
    demosAndWalkthroughs: collectRefs(
      "rg -n 'demo|walkthrough|proof|showcase|video' docs scripts apps packages --glob '!**/node_modules/**'",
      12
    ),
    caseStudiesAndReports: collectRefs(
      "rg -n 'case study|summary|report|readiness|audit' docs .agent scripts --glob '!**/node_modules/**'",
      12
    ),
    metricsDashboards: collectRefs(
      "rg -n 'dashboard|metrics|monitoring|status|health' docs scripts apps packages --glob '!**/node_modules/**'",
      12
    )
  };

  return {
    demosAndWalkthroughs: demoSignals.demosAndWalkthroughs,
    caseStudiesAndReports: demoSignals.caseStudiesAndReports,
    metricsDashboards: demoSignals.metricsDashboards
  };
}

function communityReadiness() {
  const docs = {
    quickstartCount: countLines("find docs .agent -name '*QUICKSTART*.md' -o -name '*QUICK_START*.md' 2>/dev/null | wc -l"),
    onboardingCount: countLines("find docs .agent -name '*ONBOARD*' -o -name '*GETTING_STARTED*' 2>/dev/null | wc -l"),
    guideCount: countLines("find docs -name '*GUIDE*.md' | wc -l"),
    apiDocCount: countLines("find docs -name '*API*.md' | wc -l")
  };

  const signals = collectRefs(
    "rg -n 'onboarding|tutorial|guide|community|support|contributing|quick start' docs README.md AGENTS.md .agent --glob '!**/node_modules/**'",
    15
  );

  return {
    docs,
    signalCount: signals.signalCount,
    sampleRefs: signals.refs
  };
}

function valueScore(expansion, portfolio, community) {
  const expansionDetected = expansion.filter(x => x.detected).length;
  const portfolioSignals =
    portfolio.demosAndWalkthroughs.signalCount +
    portfolio.caseStudiesAndReports.signalCount +
    portfolio.metricsDashboards.signalCount;
  const docSignals = community.docs.quickstartCount + community.docs.onboardingCount + community.docs.guideCount;

  const raw = expansionDetected * 20 + Math.min(portfolioSignals, 60) + Math.min(docSignals, 40);
  return Math.min(raw, 100);
}

function main() {
  ensureOutputDir();
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  FRAMEWORK CONSCIOUSNESS - Phase 6                        ║');
  console.log('║  Reach & Value                                             ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  console.log('[1/4] Integration Expansion Mapping');
  const expansion = integrationExpansion();
  const expansionDetected = expansion.filter(x => x.detected).length;
  console.log(`  ✅ Expansion targets signaled: ${expansionDetected}/${expansion.length}\n`);

  console.log('[2/4] Value Demonstration Portfolio');
  const portfolio = valueDemonstrationPortfolio();
  console.log('  ✅ Portfolio signals mapped\n');

  console.log('[3/4] Community Readiness');
  const community = communityReadiness();
  console.log(`  ✅ Community/onboarding signals captured (${community.signalCount} refs)\n`);

  const phase5Report = readJson(path.join(OUTPUT_DIR, 'phase-5-emergence-evolution-report.json'), null);
  const score = valueScore(expansion, portfolio, community);

  const report = {
    timestamp: new Date().toISOString(),
    phase: 'Phase 6: Reach & Value',
    status: 'Complete',
    input: {
      phase5ReportPresent: Boolean(phase5Report),
      phase5Timestamp: phase5Report?.timestamp || null
    },
    integrationExpansion: expansion,
    valueDemonstrationPortfolio: portfolio,
    communityReadiness: community,
    valueScore: {
      score,
      scale: '0-100',
      interpretation:
        score >= 85
          ? 'high'
          : score >= 60
            ? 'medium'
            : 'early'
    },
    lifecycle: {
      frameworkConsciousnessPhasesCompleted: 6,
      overallStatus: 'Framework consciousness cycle complete'
    }
  };

  const outPath = path.join(OUTPUT_DIR, 'phase-6-reach-value-report.json');
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2));

  console.log('[4/4] Report Generation');
  console.log(`  ✅ Report saved: ${outPath}\n`);
  console.log('Phase 6 complete. Framework consciousness cycle fully executed.\n');
}

main();
