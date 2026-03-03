#!/usr/bin/env node
/**
 * Framework-consciousness guardrail checks.
 *
 * Default baseline: data/framework-consciousness-baseline.json
 *
 * Commands:
 *   node scripts/framework-consciousness/guardrail-check.cjs
 *   node scripts/framework-consciousness/guardrail-check.cjs --write-baseline
 *   node scripts/framework-consciousness/guardrail-check.cjs --baseline path/to/file.json
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const OUTPUT_DIR = path.join(ROOT, '.framework-consciousness');
const DEFAULT_BASELINE = path.join(ROOT, 'data', 'framework-consciousness-baseline.json');
const RESULT_PATH = path.join(OUTPUT_DIR, 'guardrail-result.json');

function readJson(filePath, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch (_err) {
    return fallback;
  }
}

function writeJson(filePath, value) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2));
}

function hasFlag(flag) {
  return process.argv.includes(flag);
}

function getArg(flag, fallback) {
  const idx = process.argv.indexOf(flag);
  if (idx === -1) return fallback;
  const value = process.argv[idx + 1];
  if (!value || value.startsWith('--')) return fallback;
  return value;
}

function loadCurrentMetrics() {
  const foundation = readJson(path.join(OUTPUT_DIR, 'foundation-discovery-report.json'));
  const phase5 = readJson(path.join(OUTPUT_DIR, 'phase-5-emergence-evolution-report.json'));
  const phase6 = readJson(path.join(OUTPUT_DIR, 'phase-6-reach-value-report.json'));
  const evolution = readJson(path.join(OUTPUT_DIR, 'evolution-summary.json'));

  if (!foundation || !phase5 || !phase6 || !evolution) {
    const missing = [
      !foundation ? 'foundation-discovery-report.json' : null,
      !phase5 ? 'phase-5-emergence-evolution-report.json' : null,
      !phase6 ? 'phase-6-reach-value-report.json' : null,
      !evolution ? 'evolution-summary.json' : null
    ].filter(Boolean);
    throw new Error(`Missing required report files: ${missing.join(', ')}`);
  }

  return {
    completionPct: Number(evolution.completionPct || 0),
    latestPhase: evolution.latestPhase || null,
    valueScore: Number((phase6.valueScore && phase6.valueScore.score) || 0),
    docs: Number(foundation.discoveries?.documentation?.totalFiles || 0),
    packages: Number(foundation.discoveries?.codebase?.packages || 0),
    apps: Number(foundation.discoveries?.codebase?.applications || 0),
    tnfSkills: Number(phase5.selfAnalysis?.metrics?.growthSignals?.tnfSkillCount || 0),
    claudeSkills: Number(phase5.selfAnalysis?.metrics?.growthSignals?.claudeSkillCount || 0),
    integrationsDetected: Number(
      (phase6.integrationExpansion || []).filter(item => item && item.detected === true).length
    )
  };
}

function compare(current, baseline) {
  const failures = [];

  if (current.completionPct < 100) {
    failures.push(`completionPct < 100 (current=${current.completionPct})`);
  }

  if (current.latestPhase !== 'Phase 6: Reach & Value') {
    failures.push(`latestPhase mismatch (current="${current.latestPhase}")`);
  }

  if (current.valueScore < baseline.valueScore) {
    failures.push(`valueScore regressed (baseline=${baseline.valueScore}, current=${current.valueScore})`);
  }

  const shrinkChecks = ['packages', 'apps', 'tnfSkills', 'claudeSkills', 'integrationsDetected'];
  for (const key of shrinkChecks) {
    if (current[key] < baseline[key]) {
      failures.push(`${key} regressed (baseline=${baseline[key]}, current=${current[key]})`);
    }
  }

  return failures;
}

function main() {
  const baselinePath = path.resolve(ROOT, getArg('--baseline', path.relative(ROOT, DEFAULT_BASELINE)));
  const writeBaseline = hasFlag('--write-baseline');

  const current = loadCurrentMetrics();

  if (writeBaseline) {
    const baselinePayload = {
      updatedAt: new Date().toISOString(),
      source: '.framework-consciousness reports',
      metrics: current
    };
    writeJson(baselinePath, baselinePayload);
    writeJson(RESULT_PATH, {
      status: 'baseline-written',
      baselinePath,
      metrics: current
    });
    console.log(`Baseline written: ${baselinePath}`);
    return;
  }

  const baselineRaw = readJson(baselinePath);
  if (!baselineRaw || !baselineRaw.metrics) {
    throw new Error(`Baseline missing or invalid: ${baselinePath}`);
  }

  const baseline = baselineRaw.metrics;
  const failures = compare(current, baseline);

  const result = {
    timestamp: new Date().toISOString(),
    baselinePath,
    baseline,
    current,
    failures,
    passed: failures.length === 0
  };
  writeJson(RESULT_PATH, result);

  const summaryLines = [
    `Framework-consciousness guardrails: ${result.passed ? 'PASS' : 'FAIL'}`,
    `completionPct=${current.completionPct}`,
    `valueScore=${current.valueScore}`,
    `packages=${current.packages}, apps=${current.apps}, tnfSkills=${current.tnfSkills}, claudeSkills=${current.claudeSkills}, integrationsDetected=${current.integrationsDetected}`
  ];
  if (!result.passed) {
    summaryLines.push('Failures:');
    for (const f of failures) summaryLines.push(`- ${f}`);
  }
  const summary = summaryLines.join('\n');
  console.log(summary);

  if (process.env.GITHUB_STEP_SUMMARY) {
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `## Framework Consciousness Guardrails\n\n\`\`\`\n${summary}\n\`\`\`\n`);
  }

  if (!result.passed) process.exit(1);
}

main();
