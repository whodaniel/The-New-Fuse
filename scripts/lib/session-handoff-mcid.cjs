#!/usr/bin/env node
/**
 * Session handoff mcid v1.1 helpers — links session N → session N+1 via causation_id.
 */

const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');

function readJsonFile(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function readPriorHandoff(repoRoot) {
  const candidates = [
    path.join(repoRoot, 'docs/protocols/reports/SESSION_HANDOFF_LATEST.json'),
    path.join(os.homedir(), '.tnf/handoff-current.json'),
    path.join(os.homedir(), '.tnf/handoff-lineage.json'),
  ];

  for (const filePath of candidates) {
    const raw = readJsonFile(filePath);
    if (!raw) continue;

    const lineage = raw.federation_lineage || raw;
    const cumulativeId = lineage.cumulativeId || raw.cumulativeId;
    if (!cumulativeId?.id) continue;

    return {
      handoff_id: raw.handoff_id || null,
      cumulativeId,
      gateDecisions: lineage.gateDecisions || raw.gateDecisions || [],
    };
  }

  return null;
}

function defaultGateDecisions(nowIso) {
  return [
    { gate: 'TURN_ZERO_GATE', decision: 'allow', at: nowIso },
    { gate: 'HANDOFF_CONTINUITY_GATE', decision: 'allow', at: nowIso },
    { gate: 'TRACE_CONTINUITY_GATE', decision: 'allow', at: nowIso },
  ];
}

function buildHandoffCumulativeId(options = {}) {
  const handoffId = options.handoffId || crypto.randomUUID();
  const prior = options.prior || null;
  const sessionKey = options.sessionKey || handoffId;
  const tenantId = options.tenantId || 'tnf-local';
  const nowIso = new Date().toISOString();
  const correlationId = crypto.randomUUID();
  const causationId =
    prior?.cumulativeId?.id ||
    prior?.cumulativeId?.lineage?.correlation_id ||
    null;

  const cumulativeId = {
    spec: 'tnf/mcid/0.1',
    id: crypto.randomUUID(),
    scope: {
      tenant_id: tenantId,
      session_key: sessionKey,
      workflow_id: null,
      channel_id: options.channelId || null,
    },
    lineage: {
      trace_id: null,
      correlation_id: correlationId,
      causation_id: causationId,
      handoff_packet_id: handoffId,
      twid: null,
      task_id: null,
    },
    federation: {
      domain: tenantId,
      route: prior
        ? ['tnf', 'session-handoff', 'emit', 'continued']
        : ['tnf', 'session-handoff', 'emit'],
      hop_count: prior ? 2 : 1,
      gate_decisions: defaultGateDecisions(nowIso),
    },
    issued_at: nowIso,
  };

  return {
    cumulativeId,
    gateDecisions: cumulativeId.federation.gate_decisions,
    prior_handoff_id: prior?.handoff_id || null,
  };
}

function writeHandoffLineageMirror(handoffPayload, repoRoot) {
  const lineageDir = path.join(os.homedir(), '.tnf');
  fs.mkdirSync(lineageDir, { recursive: true });

  const mirror = {
    handoff_id: handoffPayload.handoff_id,
    created_at: handoffPayload.created_at,
    federation_lineage: handoffPayload.federation_lineage,
  };

  fs.writeFileSync(
    path.join(lineageDir, 'handoff-current.json'),
    `${JSON.stringify(handoffPayload, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(lineageDir, 'handoff-lineage.json'),
    `${JSON.stringify(mirror, null, 2)}\n`,
    'utf8'
  );
}

module.exports = {
  buildHandoffCumulativeId,
  defaultGateDecisions,
  readPriorHandoff,
  writeHandoffLineageMirror,
};
