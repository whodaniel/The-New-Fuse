#!/usr/bin/env node
/**
 * demo-external-teammate-handoff.cjs
 *
 * Dry-run of TNF → External Teammate Runtime (ETR) assignment span.
 * Default peer: etr:spacexai:grok-bot
 *
 * Does NOT call vendor APIs or transmit credentials.
 * Appends a lineage row to ~/.tnf/logs/etr-handoff.jsonl
 */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');

const REQUIRED = [
  'type',
  'tenant_id',
  'correlation_id',
  'target',
  'task',
  'policy',
  'callback',
];

function fail(msg) {
  console.error(`FAIL: ${msg}`);
  process.exit(1);
}

function validate(envelope) {
  for (const key of REQUIRED) {
    if (envelope[key] == null) fail(`missing field ${key}`);
  }
  if (envelope.type !== 'tnf.etr.assign.v1') fail('type must be tnf.etr.assign.v1');
  if (!envelope.target.runtime_id) fail('target.runtime_id required');
  const grant = envelope.policy.credential_grant;
  if (!['none', 'named-connector', 'session-delegate'].includes(grant)) {
    fail(`invalid credential_grant: ${grant}`);
  }
  if (!Array.isArray(envelope.policy.require_approval)) {
    fail('policy.require_approval must be an array');
  }
  if (!['relay', 'webhook', 'twip-bridge'].includes(envelope.callback.channel)) {
    fail('invalid callback.channel');
  }
}

function main() {
  const correlationId = crypto.randomUUID();
  const lineageParent = process.env.TNF_LINEAGE_PARENT || null;
  const lineageChild = crypto.randomUUID();

  const envelope = {
    type: 'tnf.etr.assign.v1',
    tenant_id: process.env.TNF_TENANT_ID || 'local-dev',
    correlation_id: correlationId,
    lineage_parent: lineageParent,
    target: {
      runtime_id: 'etr:spacexai:grok-bot',
      bot_role: 'specialist',
    },
    task: {
      summary: 'Demo: summarize overnight inbox triage criteria and return draft owners',
      acceptance: ['draft owners listed', 'no outbound messages sent'],
      artifacts_expected: ['etr-demo-result.json'],
    },
    policy: {
      require_approval: ['send_message', 'purchase', 'delete', 'prod_change'],
      data_classes_allowed: ['public', 'internal'],
      credential_grant: 'none',
    },
    callback: {
      channel: 'relay',
      address: 'tnf:direct:orchestrator',
    },
    fleet_note: {
      grok_4_6_is: 'TNF fleet model lane (not this ETR)',
      etr_is: 'external teammate runtime peer',
    },
  };

  validate(envelope);

  // Simulated ETR execution + callback (no network).
  const callback = {
    status: 'completed',
    correlation_id: correlationId,
    lineage_child: lineageChild,
    runtime_id: envelope.target.runtime_id,
    at: new Date().toISOString(),
    artifacts: ['etr-demo-result.json'],
  };

  const logDir = path.join(os.homedir(), '.tnf', 'logs');
  fs.mkdirSync(logDir, { recursive: true });
  const logPath = path.join(logDir, 'etr-handoff.jsonl');
  const row = {
    at: new Date().toISOString(),
    span: { parent: lineageParent, child: lineageChild },
    assign: envelope,
    callback,
  };
  fs.appendFileSync(logPath, `${JSON.stringify(row)}\n`, 'utf8');

  const reportDir = path.join(
    __dirname,
    '..',
    '..',
    'docs',
    'protocols',
    'bridges',
    'reports'
  );
  try {
    fs.mkdirSync(reportDir, { recursive: true });
    const reportPath = path.join(reportDir, 'tnf-to-external-teammate-runtime.md');
    const line = `- ${row.at} demo OK correlation=${correlationId} child=${lineageChild} runtime=${envelope.target.runtime_id}\n`;
    if (!fs.existsSync(reportPath)) {
      fs.writeFileSync(
        reportPath,
        '# tnf-to-external-teammate-runtime bridge log\n\n',
        'utf8'
      );
    }
    fs.appendFileSync(reportPath, line, 'utf8');
  } catch (err) {
    console.warn('WARN: could not append bridge report:', err.message);
  }

  console.log('PASS: tnf.etr.assign.v1 validated');
  console.log(JSON.stringify({ envelope, callback, logPath }, null, 2));
}

main();
