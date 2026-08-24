#!/usr/bin/env node
/**
 * Control-surface ecosystem hydrate bridge (CJS).
 *
 * Usage:
 *   node scripts/runtime/tnf-ecosystem-hydrate.cjs [--json] [--require-auth]
 */
'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {
  SPEC,
  resolveProfile,
  readSession,
  readJson,
  writeJson,
} = require('./agent-state-quota-ecosystem-lib.cjs');

function listJsonFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const name of fs.readdirSync(dir)) {
    if (!name.endsWith('.json')) continue;
    const data = readJson(path.join(dir, name));
    if (data != null) out.push(data);
  }
  return out;
}

function hydrate(options = {}) {
  const tnfHome = options.tnfHome || process.env.TNF_HOME || path.join(os.homedir(), '.tnf');
  const env = options.env || process.env;
  const profile = options.profile || resolveProfile(tnfHome, env);
  const requireAuth = options.requireAuth !== false;
  const session = readSession(tnfHome, profile);
  if (requireAuth && !session) {
    const err = new Error(
      `Authentication required for ecosystem hydration (profile '${profile}'). Run: tnf profile login`
    );
    err.code = 'UNAUTHENTICATED';
    throw err;
  }

  const profileDoc = readJson(path.join(tnfHome, 'profiles', `${profile}.json`));
  const latest = readJson(path.join(tnfHome, 'agent-state', profile, 'latest.json'));
  const agents = Array.isArray(latest?.agents) ? latest.agents : [];
  const quotas = agents.map((a) => a.quota).filter(Boolean);
  const handoff = readJson(path.join(tnfHome, 'handoff-current.json')) || {};
  const tasks = [];
  if (Array.isArray(handoff.IMMEDIATE_TASKS)) tasks.push(...handoff.IMMEDIATE_TASKS);
  if (Array.isArray(handoff.next_actions)) tasks.push(...handoff.next_actions);
  tasks.push(...listJsonFiles(path.join(tnfHome, 'tasks')));

  const userRoot = path.join(tnfHome, 'user-context', 'data', profile);
  const sources = listJsonFiles(path.join(userRoot, 'sources'));
  const projects = listJsonFiles(path.join(userRoot, 'working')).filter((row) => {
    if (!row || typeof row !== 'object') return false;
    return row.kind === 'project' || row.type === 'project' || row.projectId || row.repo;
  });

  const platforms = [];
  if (profileDoc?.services && typeof profileDoc.services === 'object') {
    for (const [name, enabled] of Object.entries(profileDoc.services)) {
      platforms.push({ kind: 'service', name, enabled: Boolean(enabled) });
    }
  }

  const websites = [{ name: 'TNF Local Control', url: 'tnf://local', kind: 'control-surface' }];
  if (session?.cloudEndpoint) {
    websites.push({ name: 'TNF Cloud', url: session.cloudEndpoint, kind: 'control-surface' });
  }

  const snapshot = {
    spec: SPEC,
    profile,
    generatedAt: new Date().toISOString(),
    authenticated: Boolean(session),
    slices: {
      profile: profileDoc,
      session,
      agents,
      quotas,
      tasks,
      projects,
      sources,
      platforms,
      websites,
    },
    receipts: [
      { slice: 'profile', status: profileDoc ? 'ok' : 'missing', detail: profile },
      { slice: 'session', status: session ? 'ok' : 'missing', detail: session ? session.sessionId : 'none' },
      { slice: 'agents', status: agents.length ? 'ok' : 'empty', detail: `${agents.length} agents` },
      { slice: 'quotas', status: quotas.length ? 'ok' : 'empty', detail: `${quotas.length} quotas` },
      { slice: 'tasks', status: tasks.length ? 'ok' : 'empty', detail: `${tasks.length} tasks` },
      { slice: 'projects', status: projects.length ? 'ok' : 'empty', detail: `${projects.length} projects` },
      { slice: 'sources', status: sources.length ? 'ok' : 'empty', detail: `${sources.length} sources` },
      { slice: 'platforms', status: platforms.length ? 'ok' : 'empty', detail: `${platforms.length} platforms` },
      { slice: 'websites', status: websites.length ? 'ok' : 'empty', detail: `${websites.length} websites` },
    ],
  };

  writeJson(path.join(userRoot, 'working', 'ecosystem-latest.json'), snapshot);
  writeJson(path.join(tnfHome, 'agent-state', profile, 'ecosystem-latest.json'), snapshot);
  return snapshot;
}

function parseArgs(argv) {
  const out = { json: false, requireAuth: true, profile: null, orient: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--json') out.json = true;
    else if (arg === '--orient') out.orient = true;
    else if (arg === '--no-require-auth') out.requireAuth = false;
    else if (arg === '--require-auth') out.requireAuth = true;
    else if (arg === '--profile' && argv[i + 1]) out.profile = argv[++i];
  }
  return out;
}

function orient(options = {}) {
  const tnfHome = options.tnfHome || process.env.TNF_HOME || path.join(os.homedir(), '.tnf');
  const env = options.env || process.env;
  const profile = options.profile || resolveProfile(tnfHome, env);
  const requireAuth = options.requireAuth !== false;
  const session = readSession(tnfHome, profile);
  if (requireAuth && !session) {
    const err = new Error(
      `Authentication required for ecosystem orientation (profile '${profile}'). Run: tnf profile login`
    );
    err.code = 'UNAUTHENTICATED';
    throw err;
  }
  const latest = readJson(path.join(tnfHome, 'agent-state', profile, 'latest.json'));
  const agents = Array.isArray(latest?.agents) ? latest.agents : [];
  const quotas = agents.map((a) => a.quota).filter(Boolean);
  const rolesPath = path.join(tnfHome, 'authority', 'roles.json');
  const rolesDoc = readJson(rolesPath);
  const orientation = {
    spec: SPEC,
    kind: 'boot-orientation',
    profile,
    generatedAt: new Date().toISOString(),
    authenticated: Boolean(session),
    enlistedProviders: [],
    runtimeHealth: {
      handoffPresent: fs.existsSync(path.join(tnfHome, 'handoff-current.json')),
      agentStateLatestPresent: Boolean(latest),
      rolesPresent: fs.existsSync(rolesPath),
    },
    authorityRefs: {
      rolesPath,
      agentRoleCount: rolesDoc?.agents ? Object.keys(rolesDoc.agents).length : 0,
    },
    quotaFreshnessSummary: {
      fresh: quotas.filter((q) => q && !q.degraded && q.confidence !== 'unknown').length,
      degraded: quotas.filter((q) => q?.degraded).length,
      unknown: quotas.filter((q) => q?.confidence === 'unknown').length,
      total: quotas.length,
    },
    communicationSurfaces: [
      { name: 'TNF Local Control', url: 'tnf://local', kind: 'control-surface' },
      ...(session?.cloudEndpoint
        ? [{ name: 'TNF Cloud', url: session.cloudEndpoint, kind: 'control-surface' }]
        : []),
    ],
    receipts: [
      {
        slice: 'hosted',
        status: session?.cloudEndpoint ? 'ok' : 'missing',
        detail: session?.cloudEndpoint
          ? 'cloud endpoint linked'
          : 'private hosted control plane absent — OSS runtime degrades cleanly',
      },
    ],
  };
  writeJson(path.join(tnfHome, 'agent-state', profile, 'orient-latest.json'), orientation);
  return orientation;
}

if (require.main === module) {
  try {
    const args = parseArgs(process.argv.slice(2));
    const snapshot = args.orient
      ? orient({ profile: args.profile || undefined, requireAuth: args.requireAuth })
      : hydrate({ profile: args.profile || undefined, requireAuth: args.requireAuth });
    if (args.json) {
      process.stdout.write(`${JSON.stringify(snapshot, null, 2)}\n`);
    } else if (args.orient) {
      console.log(`TNF ecosystem oriented for profile '${snapshot.profile}'`);
    } else {
      console.log(`TNF ecosystem hydrated for profile '${snapshot.profile}'`);
      console.log(`agents=${snapshot.slices.agents.length} tasks=${snapshot.slices.tasks.length}`);
    }
  } catch (err) {
    console.error(err.message || String(err));
    process.exit(err.code === 'UNAUTHENTICATED' ? 2 : 1);
  }
}

module.exports = { hydrate, orient, SPEC };
