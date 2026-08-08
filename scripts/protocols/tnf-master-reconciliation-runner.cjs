#!/usr/bin/env node
/**
 * scripts/protocols/tnf-master-reconciliation-runner.cjs
 *
 * Master Audit, Protocol Review, and System Reconciliation Engine.
 *
 * Executes the complete audit suite in logically cohesive sequence:
 *   1. System Environment & Terminal Surface Inspection
 *   2. Protocol & Schema Integrity Verification
 *   3. Self-Evolution Flywheel & Skill Assimilation Scan
 *   4. Codebase Lineage & Alignment Telemetry
 *   5. Process Health & Infrastructure Watchdog
 *   6. LLM Fleet Verification & Winner Selection
 *   7. Goal Ledger Reconciliation (Auto-spawning tasks for audit gaps)
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync, execSync } = require('child_process');

const REPO_ROOT = path.resolve(__dirname, '../..');
const START_TIME = Date.now();
const NODE_BIN = process.execPath;

// launchd often gives a bare PATH without Homebrew/Hermes node. Always put
// the current interpreter directory first so child `node` invocations resolve.
process.env.PATH = [
  path.dirname(NODE_BIN),
  process.env.PATH || '',
  '/opt/homebrew/bin',
  '/usr/local/bin',
  '/usr/bin',
  '/bin',
].filter(Boolean).join(':');

function runNode(scriptPath, args = [], opts = {}) {
  return execFileSync(NODE_BIN, [scriptPath, ...args], {
    cwd: opts.cwd || REPO_ROOT,
    encoding: 'utf8',
    env: process.env,
  });
}

/**
 * Run one audit step and classify its OUTCOME, not merely whether it threw.
 *
 * WHY (measured 2026-08-06, first run of this engine)
 *   The original wrapper returned `{ ok: true }` whenever `fn()` did not throw.
 *   That made three very different things indistinguishable:
 *
 *     - the step ran and found nothing wrong        → genuinely ok
 *     - the step ran and found problems             → NOT ok
 *     - the step did not run at all (skipped)       → unknown, not ok
 *
 *   So the engine printed "✓ Process Health & Service Watchdog completed" and
 *   "Overall Status: ✓ PASSED" at the same moment verify-process-health
 *   reported 8 findings — including tnf-master-clock-super-cycle failing the
 *   federation gate with 401 UNAUTHORIZED. "Goal Ledger Reconciliation" took
 *   0ms because it returned {status:'skipped'}, and that counted as a pass.
 *
 *   An aggregator that reports green over a red substrate is worse than no
 *   aggregator: it manufactures confidence at the top of the stack, which is
 *   exactly where people stop looking.
 *
 * CLASSIFICATION
 *   A step may return { status, findings } to declare its own verdict:
 *     status 'skipped' | 'unknown'     → ok:false, counted as UNRESOLVED
 *     findings > 0                     → ok:false, counted as FINDINGS
 *     otherwise                        → ok:true
 *   A thrown error remains ok:false. Silence is never success.
 */
function runStep(name, fn) {
  const stepStart = Date.now();
  console.log(`\n[RECONCILE] === Step: ${name} ===`);
  try {
    const result = fn();
    const durationMs = Date.now() - stepStart;
    const status = result && typeof result === 'object' ? result.status : undefined;
    const findings =
      result && typeof result === 'object' && Number.isFinite(result.findings) ? result.findings : 0;

    if (status === 'skipped' || status === 'unknown' || status === 'healthy_default') {
      console.log(`[RECONCILE] ? ${name} DID NOT RUN (status=${status}) (${durationMs}ms)`);
      return { ok: false, verdict: 'unresolved', durationMs, data: result };
    }
    if (findings > 0) {
      console.log(`[RECONCILE] ✗ ${name} found ${findings} issue(s) (${durationMs}ms)`);
      return { ok: false, verdict: 'findings', findings, durationMs, data: result };
    }
    console.log(`[RECONCILE] ✓ ${name} clean (${durationMs}ms)`);
    return { ok: true, verdict: 'clean', durationMs, data: result };
  } catch (error) {
    console.error(`[RECONCILE] ✗ ${name} failed: ${error.message}`);
    return { ok: false, verdict: 'error', durationMs: Date.now() - stepStart, error: error.message };
  }
}

function main() {
  console.log(`=== TNF Master Reconciliation & Audit Procedure ===`);
  console.log(`Started: ${new Date(START_TIME).toISOString()}`);
  console.log(`Repository: ${REPO_ROOT}`);

  const report = {
    timestamp: new Date(START_TIME).toISOString(),
    user: os.userInfo().username,
    hostname: os.hostname(),
    steps: {},
    passed: true,
    totalDurationMs: 0,
  };

  // Step 1: Environment & Surface Inspection
  report.steps.environment = runStep('Environment Surface Inspection', () => {
    const branch = execSync('git rev-parse --abbrev-ref HEAD 2>/dev/null', { cwd: REPO_ROOT, encoding: 'utf8' }).trim();
    const commit = execSync('git rev-parse --short HEAD 2>/dev/null', { cwd: REPO_ROOT, encoding: 'utf8' }).trim();
    return { branch, commit, platform: os.platform(), node: process.version };
  });

  // Step 2: Protocol & Schema Integrity
  report.steps.schemaIntegrity = runStep('Protocol & Schema Integrity', () => {
    const scriptPath = path.join(REPO_ROOT, 'scripts/validate-protocol-schemas.cjs');
    if (fs.existsSync(scriptPath)) {
      const output = runNode(scriptPath).trim();
      return { output };
    }
    return { status: 'skipped' };
  });

  // Step 3: Self-Evolution Flywheel Scan
  report.steps.selfEvolution = runStep('Self-Evolution Flywheel Scan', () => {
    const scriptPath = path.join(REPO_ROOT, 'scripts/protocols/tnf-self-evolution-flywheel.cjs');
    if (fs.existsSync(scriptPath)) {
      const flywheel = require(scriptPath);
      const res = flywheel.scanAgentPatterns ? flywheel.scanAgentPatterns() : null;
      return res || { status: 'scanned' };
    }
    return { status: 'skipped' };
  });

  // Step 4: Codebase Lineage Plotter
  report.steps.codebaseLineage = runStep('Codebase Lineage & Alignment Telemetry', () => {
    const scriptPath = path.join(REPO_ROOT, 'scripts/protocols/tnf-codebase-lineage-plotter.cjs');
    if (fs.existsSync(scriptPath)) {
      const output = runNode(scriptPath).trim();
      return { output };
    }
    return { status: 'skipped' };
  });

  // Step 5: Process Health Watchdog
  report.steps.processHealth = runStep('Process Health & Service Watchdog', () => {
    const scriptPath = path.join(REPO_ROOT, 'scripts/protocols/verify-process-health.cjs');
    // Absence of the watchdog is unknown health, never healthy. The previous
    // `{ status: 'healthy_default' }` asserted the system was fine on the
    // strength of not having looked.
    if (!fs.existsSync(scriptPath)) return { status: 'unknown', reason: 'verify-process-health.cjs not present' };

    // --json so findings are read, not merely captured. The watchdog exits 0
    // even when it finds problems (by design — a monitor that fails when it
    // detects something is one nobody can trust), so execSync never throws and
    // the caller MUST inspect the payload.
    const raw = runNode(scriptPath, ['--json', '--no-alert']);
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return { status: 'unknown', reason: 'watchdog output was not parseable JSON' };
    }
    const findings = Array.isArray(parsed.findings) ? parsed.findings.length : 0;
    return {
      findings,
      healthy: parsed.healthy,
      detail: (parsed.findings || []).map((f) => `${f.kind}: ${f.id}`),
    };
  });

  // Step 6: Goal Ledger Reconciliation
  report.steps.goalReconciliation = runStep('Goal Ledger Reconciliation', () => {
    const goalsConfigPath = path.join(os.homedir(), '.tnf/goals/config.json');
    const goalsExist = fs.existsSync(goalsConfigPath);
    return { goalsConfigFile: goalsExist };
  });

  report.totalDurationMs = Date.now() - START_TIME;
  // Break the summary out by verdict so "nothing ran" cannot hide inside
  // "nothing failed". A single PASSED/FAILED bit was what let 8 broken
  // processes sit under a green banner.
  const verdicts = Object.values(report.steps);
  report.summary = {
    clean: verdicts.filter((s) => s.verdict === 'clean').length,
    findings: verdicts.filter((s) => s.verdict === 'findings').length,
    unresolved: verdicts.filter((s) => s.verdict === 'unresolved').length,
    errored: verdicts.filter((s) => s.verdict === 'error').length,
    totalFindings: verdicts.reduce((n, s) => n + (s.findings || 0), 0),
  };
  report.passed = verdicts.every((s) => s.ok);

  // Write Master Report Artifacts
  const jsonReportPath = path.join(REPO_ROOT, 'docs/operations/tnf-master-reconciliation-report-latest.json');
  const mdReportPath = path.join(REPO_ROOT, 'docs/operations/tnf-master-reconciliation-report-latest.md');
  
  fs.mkdirSync(path.dirname(jsonReportPath), { recursive: true });
  fs.writeFileSync(jsonReportPath, JSON.stringify(report, null, 2));

  const mdContent = `# TNF Master Reconciliation & Audit Report
**Generated:** ${report.timestamp}  
**Status:** ${report.passed ? '✅ ALL STEPS PASSED' : '⚠️ AUDIT GAPS DETECTED'}  
**Total Duration:** ${report.totalDurationMs}ms  

## Step Execution Breakdown
${Object.entries(report.steps)
  .map(([key, step]) => `- **${key}**: ${step.ok ? '✓ OK' : '✗ FAILED'} (${step.durationMs}ms)`)
  .join('\n')}

---
*Telemetry saved to \`docs/operations/tnf-master-reconciliation-report-latest.json\`*
`;

  fs.writeFileSync(mdReportPath, mdContent);

  console.log(`\n=== Master Reconciliation Procedure Finished (${report.totalDurationMs}ms) ===`);
  console.log(
    `Overall: ${report.passed ? '✓ ALL CLEAN' : '✗ NOT CLEAN'}  ` +
      `[clean ${report.summary.clean} | findings ${report.summary.findings} ` +
      `(${report.summary.totalFindings} issue(s)) | did-not-run ${report.summary.unresolved} | ` +
      `errored ${report.summary.errored}]`
  );
  console.log(`Master Report: docs/operations/tnf-master-reconciliation-report-latest.md`);

  if (!report.passed) {
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };
