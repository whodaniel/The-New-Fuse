#!/usr/bin/env node
/**
 * TNF Report Lifecycle Manager
 *
 * Shared utility used by all swarm test agents to:
 * 1. Add lifecycle metadata to reports (aligned with Product Experience Architecture)
 * 2. Rotate/prune old reports to prevent unbounded growth
 * 3. Maintain a rolling summary of recent report health
 *
 * Product Experience Architecture domains covered:
 *   - Observe: analytics, observability, health, live view
 *   - Govern: admin, audit, security, settings, controls
 *
 * @see docs/roadmaps/PRODUCT_EXPERIENCE_ARCHITECTURE_2026-03-03.md
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '../..');
const REPORT_DIR = path.join(ROOT_DIR, '.agent/test-reports');
const SUMMARY_PATH = path.join(REPORT_DIR, '_rolling-summary.json');

// ─── Configuration ──────────────────────────────────────────────────────
const CONFIG = {
  // Maximum reports to keep PER report type
  maxReportsPerType: parseInt(process.env.REPORT_MAX_PER_TYPE || '50', 10),
  // Maximum age in milliseconds (default 7 days)
  maxAgeMs: parseInt(process.env.REPORT_MAX_AGE_MS || String(7 * 24 * 60 * 60 * 1000), 10),
  // Rolling summary window (last N reports per type)
  summaryWindow: parseInt(process.env.REPORT_SUMMARY_WINDOW || '10', 10),
};

// ─── Report type registry ───────────────────────────────────────────────
// Maps each report prefix to its architectural metadata
const REPORT_TYPES = {
  'test-report': {
    domain: 'Observe',
    lifecycleLabel: 'production',
    owner: 'website-testing-agent',
    description: 'Frontend/backend build, lint, type-check, and unit test results',
    canonicalJourney: 'Detect -> Triage -> Execute',
    phaseRelevance: ['Phase 1: Product Metadata Foundation', 'Phase 4: System Integrity'],
  },
  'integration-report': {
    domain: 'Observe',
    lifecycleLabel: 'production',
    owner: 'integration-test-agent',
    description: 'API endpoint, database, and cross-service health checks',
    canonicalJourney: 'Incident -> Root Cause -> Mitigation -> Verification',
    phaseRelevance: ['Phase 1: Product Metadata Foundation', 'Phase 4: System Integrity'],
  },
  'uiux-report': {
    domain: 'Observe',
    lifecycleLabel: 'production',
    owner: 'uiux-testing-agent',
    description: 'Component structure, accessibility, design consistency, and routing checks',
    canonicalJourney: 'Design -> Simulate -> Deploy -> Monitor',
    phaseRelevance: [
      'Phase 2: Navigation and Entry-Point Convergence',
      'Phase 3: Workflow-Level UX Convergence',
      'Phase 4: System Integrity',
    ],
  },
};

// ─── Lifecycle metadata enrichment ──────────────────────────────────────

/**
 * Enrich a report object with lifecycle metadata before writing.
 *
 * @param {string} reportType - One of 'test-report', 'integration-report', 'uiux-report'
 * @param {object} reportData - The raw report data from the agent
 * @param {object} opts - Optional overrides
 * @param {number} [opts.cycleNumber] - Supercycle number if known
 * @returns {object} The enriched report
 */
function enrichReport(reportType, reportData, opts = {}) {
  const meta = REPORT_TYPES[reportType] || {
    domain: 'Observe',
    lifecycleLabel: 'internal',
    owner: 'unknown',
    description: 'Unregistered report type',
    canonicalJourney: null,
    phaseRelevance: [],
  };

  return {
    ...reportData,
    _metadata: {
      reportType,
      domain: meta.domain,
      lifecycle: meta.lifecycleLabel,
      owner: meta.owner,
      description: meta.description,
      canonicalJourney: meta.canonicalJourney,
      phaseRelevance: meta.phaseRelevance,
      generatedAt: new Date().toISOString(),
      cycleNumber: opts.cycleNumber || null,
      version: '1.0.0',
      schema: 'tnf-report-lifecycle-v1',
    },
  };
}

// ─── Report rotation / pruning ──────────────────────────────────────────

/**
 * Prune old reports for a given type prefix. Keeps up to `maxReportsPerType`
 * and removes anything older than `maxAgeMs`.
 *
 * @param {string} prefix - Report filename prefix (e.g. 'test-report')
 * @returns {{ kept: number, pruned: number }}
 */
function pruneReports(prefix) {
  if (!fs.existsSync(REPORT_DIR)) return { kept: 0, pruned: 0 };

  const allFiles = fs
    .readdirSync(REPORT_DIR)
    .filter((f) => f.startsWith(prefix + '-') && f.endsWith('.json'))
    .sort(); // lexicographic = chronological since filenames contain timestamps

  const now = Date.now();
  const cutoffTime = now - CONFIG.maxAgeMs;
  let pruned = 0;

  // First pass: remove files older than maxAge
  const afterAgePrune = [];
  for (const file of allFiles) {
    const tsMatch = file.match(/(\d{13})\.json$/);
    if (tsMatch) {
      const fileTs = parseInt(tsMatch[1], 10);
      if (fileTs < cutoffTime) {
        try {
          fs.unlinkSync(path.join(REPORT_DIR, file));
          pruned++;
        } catch (e) {
          // Ignore permission errors, log quietly
        }
        continue;
      }
    }
    afterAgePrune.push(file);
  }

  // Second pass: if still too many, remove oldest to stay under maxReportsPerType
  if (afterAgePrune.length > CONFIG.maxReportsPerType) {
    const toRemove = afterAgePrune.slice(0, afterAgePrune.length - CONFIG.maxReportsPerType);
    for (const file of toRemove) {
      try {
        fs.unlinkSync(path.join(REPORT_DIR, file));
        pruned++;
      } catch (e) {
        // Ignore
      }
    }
  }

  const kept = Math.min(afterAgePrune.length, CONFIG.maxReportsPerType);
  return { kept, pruned };
}

/**
 * Prune all known report types at once.
 *
 * @returns {object} Results per type
 */
function pruneAllReports() {
  const results = {};
  for (const prefix of Object.keys(REPORT_TYPES)) {
    results[prefix] = pruneReports(prefix);
  }
  return results;
}

// ─── Rolling summary ────────────────────────────────────────────────────

/**
 * Update the rolling summary with latest report scores.
 * Keeps a window of the last N reports per type for trend analysis.
 */
function updateRollingSummary() {
  if (!fs.existsSync(REPORT_DIR)) return;

  const summary = {
    generatedAt: new Date().toISOString(),
    schema: 'tnf-rolling-summary-v1',
    config: CONFIG,
    types: {},
  };

  for (const [prefix, meta] of Object.entries(REPORT_TYPES)) {
    const files = fs
      .readdirSync(REPORT_DIR)
      .filter((f) => f.startsWith(prefix + '-') && f.endsWith('.json'))
      .sort()
      .slice(-CONFIG.summaryWindow); // latest N

    const entries = [];
    for (const file of files) {
      try {
        const data = JSON.parse(fs.readFileSync(path.join(REPORT_DIR, file), 'utf8'));
        entries.push({
          file,
          timestamp: data.timestamp || null,
          score: data.overall?.score ?? null,
          status: data.overall?.status ?? null,
          lifecycle: data._metadata?.lifecycle ?? meta.lifecycleLabel,
        });
      } catch (e) {
        // Skip corrupt files
      }
    }

    const scores = entries.map((e) => e.score).filter((s) => typeof s === 'number');

    summary.types[prefix] = {
      domain: meta.domain,
      lifecycle: meta.lifecycleLabel,
      owner: meta.owner,
      totalOnDisk: fs
        .readdirSync(REPORT_DIR)
        .filter((f) => f.startsWith(prefix + '-') && f.endsWith('.json')).length,
      recentCount: entries.length,
      recentAvgScore:
        scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null,
      recentMinScore: scores.length > 0 ? Math.min(...scores) : null,
      recentMaxScore: scores.length > 0 ? Math.max(...scores) : null,
      trend:
        scores.length >= 3
          ? scores[scores.length - 1] >= scores[0]
            ? 'stable-or-improving'
            : 'declining'
          : 'insufficient-data',
      latestReport: entries.length > 0 ? entries[entries.length - 1] : null,
      entries,
    };
  }

  fs.writeFileSync(SUMMARY_PATH, JSON.stringify(summary, null, 2));
  return summary;
}

// ─── Convenience: write report with full lifecycle ──────────────────────

/**
 * Write a report with lifecycle metadata and trigger rotation + summary.
 *
 * @param {string} reportType - Report type prefix
 * @param {object} reportData - Raw report data
 * @param {object} opts - Optional overrides
 * @returns {{ filePath: string, pruneResult: object }}
 */
function writeReportWithLifecycle(reportType, reportData, opts = {}) {
  if (!fs.existsSync(REPORT_DIR)) {
    fs.mkdirSync(REPORT_DIR, { recursive: true });
  }

  // Enrich with metadata
  const enriched = enrichReport(reportType, reportData, opts);

  // Write the report
  const filePath = path.join(REPORT_DIR, `${reportType}-${Date.now()}.json`);
  fs.writeFileSync(filePath, JSON.stringify(enriched, null, 2));

  // Prune old reports for this type
  const pruneResult = pruneReports(reportType);

  // Update rolling summary (non-blocking, best-effort)
  try {
    updateRollingSummary();
  } catch (e) {
    // Summary update failure should not break the agent
  }

  return { filePath, pruneResult };
}

// ─── CLI mode ───────────────────────────────────────────────────────────
// Run directly to prune all reports and regenerate summary
if (require.main === module) {
  console.log('📋 TNF Report Lifecycle Manager');
  console.log(
    `   Config: maxPerType=${CONFIG.maxReportsPerType}, maxAge=${Math.round(CONFIG.maxAgeMs / 86400000)}d`
  );

  const pruneResults = pruneAllReports();
  for (const [type, result] of Object.entries(pruneResults)) {
    console.log(`   ${type}: kept=${result.kept}, pruned=${result.pruned}`);
  }

  const summary = updateRollingSummary();
  if (summary) {
    console.log(`\n📊 Rolling Summary Updated:`);
    for (const [type, data] of Object.entries(summary.types)) {
      console.log(
        `   ${type}: avgScore=${data.recentAvgScore ?? 'n/a'}, trend=${data.trend}, onDisk=${data.totalOnDisk}`
      );
    }
  }

  console.log(`\n✅ Report lifecycle maintenance complete.`);
}

// ─── Exports ────────────────────────────────────────────────────────────
module.exports = {
  enrichReport,
  pruneReports,
  pruneAllReports,
  updateRollingSummary,
  writeReportWithLifecycle,
  REPORT_TYPES,
  CONFIG,
  REPORT_DIR,
};
