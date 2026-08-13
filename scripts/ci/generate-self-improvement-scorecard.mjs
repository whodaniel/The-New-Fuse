#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

const CWD = resolve(process.cwd());
const ROOT = existsSync(join(CWD, 'apps/frontend/docs/audits'))
  ? CWD
  : existsSync(join(CWD, 'docs/audits'))
    ? resolve(CWD, '..', '..')
    : CWD;
const AUDIT_DIR = existsSync(join(CWD, 'apps/frontend/docs/audits'))
  ? join(CWD, 'apps/frontend/docs/audits')
  : existsSync(join(CWD, 'docs/audits'))
    ? join(CWD, 'docs/audits')
    : join(ROOT, 'apps/frontend/docs/audits');

const LIVE_AUDIT_PATH = join(AUDIT_DIR, 'live-link-crawl.json');
const SEMANTIC_AUDIT_PATH = join(AUDIT_DIR, 'all-routes-semantic-audit.json');
const AUTH_AUDIT_PATH = join(AUDIT_DIR, 'auth-path-audit.json');

const SCORECARD_JSON = join(AUDIT_DIR, 'self-improvement-scorecard.json');
const SCORECARD_MD = join(AUDIT_DIR, 'self-improvement-scorecard.md');

const FAIL_ON_SCORECARD = process.env.FAIL_ON_SCORECARD !== '0';

function readJson(path) {
  if (!existsSync(path)) {
    return null;
  }
  return JSON.parse(readFileSync(path, 'utf8'));
}

function summarizeLive(live) {
  if (!live?.summary) {
    return { available: false, passed: false, reason: 'missing live-link-crawl.json' };
  }

  const totalBroken = Number(live.summary.totalBroken ?? 0);
  const semanticBroken = Number(live.summary.semanticBroken ?? 0);
  const passed = totalBroken === 0 && semanticBroken === 0;

  return {
    available: true,
    passed,
    totalChecked: Number(live.summary.totalChecked ?? 0),
    totalBroken,
    semanticBroken,
    generatedAt: live.summary.generatedAt ?? null,
  };
}

function summarizeSemantic(semantic) {
  if (!semantic?.summary) {
    return { available: false, passed: false, reason: 'missing all-routes-semantic-audit.json' };
  }

  const hardBroken = Number(semantic.summary.hardBroken ?? 0);
  const networkBroken = Number(semantic.summary.networkBroken ?? 0);
  const sameAsRoot = Number(semantic.summary.sameAsRoot ?? 0);
  const passed = hardBroken === 0 && networkBroken === 0 && sameAsRoot === 0;

  return {
    available: true,
    passed,
    totalRoutes: Number(semantic.summary.totalRoutes ?? 0),
    hardBroken,
    networkBroken,
    sameAsRoot,
    duplicateFingerprintGroups: Number(semantic.summary.duplicateFingerprintGroups ?? 0),
    generatedAt: semantic.summary.generatedAt ?? null,
  };
}

function summarizeAuth(auth) {
  if (!auth?.summary) {
    return { available: false, passed: false, reason: 'missing auth-path-audit.json' };
  }

  const failed = Number(auth.summary.failed ?? 0);
  const passed = failed === 0;

  return {
    available: true,
    passed,
    totalChecks: Number(auth.summary.total ?? 0),
    passedChecks: Number(auth.summary.passed ?? 0),
    failedChecks: failed,
    generatedAt: auth.summary.generatedAt ?? null,
  };
}

function toMarkdown(scorecard) {
  const statusIcon = scorecard.overall.passed ? 'PASS' : 'FAIL';
  return [
    '# TNF Self-Improvement Scorecard',
    '',
    `- Generated: ${scorecard.generatedAt}`,
    `- Overall: ${statusIcon}`,
    `- Required audits present: ${scorecard.overall.requiredAuditsPresent ? 'yes' : 'no'}`,
    '',
    '## Live Link Crawl',
    scorecard.live.available
      ? `- checked: ${scorecard.live.totalChecked}\n- broken: ${scorecard.live.totalBroken}\n- semantic broken: ${scorecard.live.semanticBroken}\n- passed: ${scorecard.live.passed}`
      : `- ${scorecard.live.reason}`,
    '',
    '## Semantic Route Audit',
    scorecard.semantic.available
      ? `- routes: ${scorecard.semantic.totalRoutes}\n- hard broken: ${scorecard.semantic.hardBroken}\n- network broken: ${scorecard.semantic.networkBroken}\n- same as root: ${scorecard.semantic.sameAsRoot}\n- duplicate groups: ${scorecard.semantic.duplicateFingerprintGroups}\n- passed: ${scorecard.semantic.passed}`
      : `- ${scorecard.semantic.reason}`,
    '',
    '## Auth Path Audit',
    scorecard.auth.available
      ? `- checks: ${scorecard.auth.totalChecks}\n- failed checks: ${scorecard.auth.failedChecks}\n- passed: ${scorecard.auth.passed}`
      : `- ${scorecard.auth.reason}`,
    '',
    '## Notes',
    '- This scorecard is produced by scripts/ci/generate-self-improvement-scorecard.mjs.',
    '- Failures should trigger immediate route/auth remediation before release promotion.',
    '',
  ].join('\n');
}

function main() {
  const live = summarizeLive(readJson(LIVE_AUDIT_PATH));
  const semantic = summarizeSemantic(readJson(SEMANTIC_AUDIT_PATH));
  const auth = summarizeAuth(readJson(AUTH_AUDIT_PATH));

  const requiredAuditsPresent = live.available && semantic.available && auth.available;
  const passed = requiredAuditsPresent && live.passed && semantic.passed && auth.passed;

  const scorecard = {
    generatedAt: new Date().toISOString(),
    overall: {
      passed,
      requiredAuditsPresent,
    },
    live,
    semantic,
    auth,
  };

  mkdirSync(dirname(SCORECARD_JSON), { recursive: true });
  writeFileSync(SCORECARD_JSON, JSON.stringify(scorecard, null, 2));
  writeFileSync(SCORECARD_MD, toMarkdown(scorecard));

  console.log(
    JSON.stringify(
      {
        ok: passed,
        scorecardJson: SCORECARD_JSON,
        scorecardMd: SCORECARD_MD,
        overall: scorecard.overall,
      },
      null,
      2
    )
  );

  if (!passed && FAIL_ON_SCORECARD) {
    process.exitCode = 1;
  }
}

main();
