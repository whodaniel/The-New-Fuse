#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const TNF_HOME = path.join(os.homedir(), '.tnf');
const REPO_ROOT = process.env.TNF_ROOT_DIR
  ? path.resolve(process.env.TNF_ROOT_DIR)
  : path.resolve(__dirname, '../..');

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function inferAlias(session) {
  const cmd = `${session.foregroundCommand || ''} ${session.foregroundArgs || ''}`.toLowerCase();
  if (cmd.includes('cursor-agent')) {
    return { alias: 'local-subdirector-owner', role: 'local-subdirector-owner', tags: ['coordination', 'owner', 'cursor-auto'] };
  }
  if (cmd.includes('hermes')) {
    return { alias: 'hermes-runtime-lane', role: 'runtime-agent', tags: ['hermes', 'active'] };
  }
  if (cmd.includes('tnf-cli') || (cmd.includes('tnf') && cmd.includes('cli.ts'))) {
    return { alias: 'tnf-cli-lane', role: 'analysis-agent', tags: ['tnf', 'cli', 'active'] };
  }
  if (cmd.includes('gemini')) {
    return { alias: 'gemini-lane', role: 'analysis-agent', tags: ['gemini', 'active'] };
  }
  if (cmd.includes(' pi') || cmd.startsWith('pi')) {
    return { alias: 'pi-lane', role: 'analysis-agent', tags: ['pi', 'active'] };
  }
  if (cmd.includes('zsh') || cmd.includes('bash')) {
    return { alias: 'standby-shell', role: 'standby-shell', tags: ['idle', 'reserve'] };
  }
  return { alias: 'agent-terminal', role: 'analysis-agent', tags: ['active'] };
}

function pickOwner(observed, previousOwner) {
  if (previousOwner?.agentId) {
    const stillLive = observed.find((s) => s.agentId === previousOwner.agentId);
    if (stillLive) {
      return {
        agentId: stillLive.agentId,
        tty: stillLive.tty,
        source: 'reconcile-previous-owner-verified',
      };
    }
  }
  const cursor = observed.find((s) => String(s.foregroundArgs || s.foregroundCommand || '').includes('cursor-agent'));
  if (cursor) {
    return { agentId: cursor.agentId, tty: cursor.tty, source: 'reconcile-cursor-owner' };
  }
  const firstAgent = observed.find((s) => s.agentLike);
  if (firstAgent) {
    return { agentId: firstAgent.agentId, tty: firstAgent.tty, source: 'reconcile-first-agent' };
  }
  return null;
}

function reconcile() {
  const terminalHbPath = path.join(TNF_HOME, 'terminal-heartbeat', 'state', 'terminal-heartbeat-latest.json');
  const subdirectorHbPath = path.join(TNF_HOME, 'local-subdirector', 'state', 'local-subdirector-heartbeat.json');
  const roleMapPath = path.join(TNF_HOME, 'session-discovery', 'terminal-role-map.json');
  const snapshotPath = path.join(TNF_HOME, 'fleet', 'state', 'fleet-snapshot-latest.json');

  const terminalHb = readJson(terminalHbPath);
  const subdirectorHb = readJson(subdirectorHbPath);
  const previousRoleMap = readJson(roleMapPath);

  const observed = Array.isArray(terminalHb?.observed) ? terminalHb.observed : [];
  const processSessions = Array.isArray(subdirectorHb?.sessions) ? subdirectorHb.sessions : [];

  const aliases = {};
  for (const session of observed) {
    if (!session.agentId) continue;
    const inferred = inferAlias(session);
    aliases[session.agentId] = inferred;
    if (session.tty) {
      aliases[session.tty] = { ...inferred, alias: inferred.alias };
    }
  }

  const owner = pickOwner(observed, previousRoleMap?.owner);
  const roleMap = {
    schemaVersion: 'tnf-terminal-role-map/v1',
    generatedAt: new Date().toISOString(),
    actorId: 'tnf-fleet-reconcile',
    host: os.hostname(),
    user: os.userInfo().username,
    owner,
    aliases,
  };

  fs.mkdirSync(path.dirname(roleMapPath), { recursive: true });
  fs.writeFileSync(roleMapPath, JSON.stringify(roleMap, null, 2));

  const terminalIds = new Set(observed.map((s) => s.agentId));
  const processAgentIds = new Set(processSessions.map((s) => s.agentId));
  const orphans = {
    terminalsWithoutProcess: [...terminalIds].filter((id) => !processAgentIds.has(id) && id.startsWith('tnf-local-terminal-')),
    processesWithoutTerminal: [...processAgentIds].filter((id) => !id.startsWith('tnf-local-terminal-')),
  };

  const snapshot = {
    generatedAt: new Date().toISOString(),
    actorId: 'tnf-fleet-reconcile',
    repoRoot: REPO_ROOT,
    reconcile: {
      roleMapPath,
      terminalHeartbeatAt: terminalHb?.generatedAt || null,
      subdirectorHeartbeatAt: subdirectorHb?.generatedAt || null,
      observedTerminals: observed.length,
      processSessions: processSessions.length,
      owner,
      orphans,
    },
    terminals: observed.map((s) => ({
      agentId: s.agentId,
      tty: s.tty,
      busy: s.busy,
      cwd: s.cwd,
      agentLike: s.agentLike,
      taskHint: `${s.foregroundCommand || ''} ${s.foregroundArgs || ''}`.trim().slice(0, 120),
    })),
    processes: processSessions.map((s) => ({
      agentId: s.agentId,
      status: s.status,
      foregroundCommand: s.foregroundCommand,
    })),
  };

  fs.mkdirSync(path.dirname(snapshotPath), { recursive: true });
  fs.writeFileSync(snapshotPath, JSON.stringify(snapshot, null, 2));

  return snapshot;
}

function main() {
  const snapshot = reconcile();
  const json = process.argv.includes('--json');
  if (json) {
    console.log(JSON.stringify(snapshot, null, 2));
  } else {
    console.log(`[fleet-reconcile] role map refreshed (${snapshot.reconcile.observedTerminals} terminals, ${snapshot.reconcile.processSessions} process lanes)`);
    console.log(`[fleet-reconcile] owner=${snapshot.reconcile.owner?.agentId || 'none'}`);
    if (snapshot.reconcile.orphans.terminalsWithoutProcess.length) {
      console.log(`[fleet-reconcile] terminal-only: ${snapshot.reconcile.orphans.terminalsWithoutProcess.join(', ')}`);
    }
    if (snapshot.reconcile.orphans.processesWithoutTerminal.length) {
      console.log(`[fleet-reconcile] process-only: ${snapshot.reconcile.orphans.processesWithoutTerminal.join(', ')}`);
    }
    console.log(`[fleet-reconcile] snapshot=${path.join(TNF_HOME, 'fleet', 'state', 'fleet-snapshot-latest.json')}`);
  }
}

if (require.main === module) {
  main();
}

module.exports = { reconcile };
