#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../..');
const workflowsDir = path.join(root, '.github', 'workflows');
const strict = process.argv.includes('--strict');
const json = process.argv.includes('--json');

const workflowFiles = fs
  .readdirSync(workflowsDir)
  .filter((name) => /\.ya?ml$/i.test(name))
  .sort();

const findings = [];

for (const name of workflowFiles) {
  const file = path.join(workflowsDir, name);
  const text = fs.readFileSync(file, 'utf8');
  const header = text.split(/^jobs:/m)[0] || text;
  const hasSchedule = /^\s*schedule\s*:/m.test(header);
  const automaticEvent = /^\s*(push|pull_request|pull_request_target|issues|issue_comment|pull_request_review|pull_request_review_comment)\s*:/m.test(
    header
  );
  const githubHosted = /runs-on:\s*(?:\[\s*)?(?:ubuntu|windows|macos)-/i.test(text);
  const selfHosted = /runs-on:\s*(?:\[\s*)?self-hosted/i.test(text);
  const providerAi = /anthropics\/claude-code-action|google-github-actions\/.*gemini|openai\//i.test(
    text
  );
  const explicitCostApproval = /TNF_COST_APPROVED_SCHEDULE:/i.test(text);

  if (hasSchedule && !explicitCostApproval) {
    findings.push({
      file: name,
      severity: 'high',
      kind: 'unapproved-schedule',
      message: 'Recurring GitHub Actions schedule has no explicit TNF cost approval.',
    });
  }

  if (automaticEvent && githubHosted && !selfHosted) {
    findings.push({
      file: name,
      severity: 'medium',
      kind: 'automatic-github-hosted-compute',
      message: 'Automatic event can consume GitHub-hosted runner minutes.',
    });
  }

  if (automaticEvent && providerAi) {
    findings.push({
      file: name,
      severity: 'high',
      kind: 'automatic-provider-ai',
      message: 'Automatic event can invoke an externally billed AI provider.',
    });
  }
}

const summary = {
  policy: 'local-first-paid-cloud-opt-in',
  scanned: workflowFiles.length,
  findings,
  counts: findings.reduce((acc, finding) => {
    acc[finding.kind] = (acc[finding.kind] || 0) + 1;
    return acc;
  }, {}),
};

if (json) {
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
} else {
  console.log(`GitHub Actions cost audit: ${workflowFiles.length} workflow files scanned`);
  if (!findings.length) {
    console.log('PASS: no unapproved recurring/provider-billed cost surfaces found.');
  } else {
    for (const finding of findings) {
      console.log(`[${finding.severity.toUpperCase()}] ${finding.file}: ${finding.kind} — ${finding.message}`);
    }
    console.log(`Findings: ${findings.length}`);
  }
}

if (strict && findings.length) process.exit(1);
