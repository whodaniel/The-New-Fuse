/**
 * Tests for agent-state ledger, quotas, profile sessions, and ecosystem hydrate.
 * Run: tsx src/services/AgentStateQuotaEcosystem.test.ts
 */
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { AgentQuotaService, rankAgentsForDelegation } from './AgentQuotaService.js';
import { AgentStateLedgerService } from './AgentStateLedgerService.js';
import { EcosystemHydrationService } from './EcosystemHydrationService.js';
import { ProfileSessionService } from './ProfileSessionService.js';
import type { AgentStateEntry } from './agent-state-types.js';

let pass = 0;
let fail = 0;

// Isolate from operator shell (TNF_PROFILE must not leak into fixture homes).
delete process.env.TNF_PROFILE;

function check(name: string, cond: boolean, detail = ''): void {
  if (cond) {
    console.log(`  PASS  ${name}`);
    pass += 1;
  } else {
    console.log(`  FAIL  ${name} ${detail}`);
    fail += 1;
  }
}

function makeTempHome(): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'tnf-ase-'));
  fs.mkdirSync(path.join(root, 'profiles'), { recursive: true, mode: 0o700 });
  fs.mkdirSync(path.join(root, 'metrics'), { recursive: true, mode: 0o700 });
  return root;
}

const NOW = new Date('2026-08-24T16:00:00.000Z');

console.log('\nagent-state ledger + retention');

{
  const tnfHome = makeTempHome();
  fs.writeFileSync(path.join(tnfHome, 'profiles', 'default'), 'tester\n');
  const ledger = new AgentStateLedgerService({
    tnfHome,
    profile: 'tester',
    historyCap: 3,
    retentionDays: 14,
    jsonlLines: 5,
    now: () => NOW,
  });

  const agents: AgentStateEntry[] = [
    {
      agentId: 'a1',
      name: 'alpha',
      platform: 'claude',
      isOnline: true,
      source: 'test',
      capabilities: ['code'],
    },
    {
      agentId: 'a2',
      name: 'beta',
      platform: 'gemini',
      isOnline: false,
      source: 'test',
      capabilities: ['search'],
    },
  ];

  // Write more snapshots than the cap using advancing clocks.
  for (let i = 0; i < 5; i += 1) {
    const stamp = new Date(NOW.getTime() + i * 1000);
    const slice = new AgentStateLedgerService({
      tnfHome,
      profile: 'tester',
      historyCap: 3,
      now: () => stamp,
    });
    slice.writeSnapshot({ agents, writer: `test-${i}` });
  }

  const latest = ledger.readLatest();
  check('latest snapshot exists', !!latest);
  check('latest has two agents', latest?.agents.length === 2, String(latest?.agents.length));
  check('latest embeds quotas', !!latest?.agents[0]?.quota);

  const historyFiles = ledger.listHistory(20);
  check('history capped at 3', historyFiles.length === 3, String(historyFiles.length));

  // Force jsonl over line cap
  const jsonl = ledger.historyJsonlPath();
  fs.writeFileSync(jsonl, Array.from({ length: 12 }, (_, i) => JSON.stringify({ i })).join('\n') + '\n');
  const pruned = ledger.pruneHistory();
  check('jsonl truncated when over cap', pruned.truncatedJsonl === true);
  const lines = fs.readFileSync(jsonl, 'utf8').split('\n').filter(Boolean).length;
  check('jsonl kept at 5 lines', lines === 5, String(lines));

  fs.rmSync(tnfHome, { recursive: true, force: true });
}

console.log('\nquota freshness + delegation rank');

{
  const tnfHome = makeTempHome();
  fs.writeFileSync(
    path.join(tnfHome, 'provider-config.json'),
    JSON.stringify({
      providers: {
        claude: { quotaLimit: 1000, quotaUnit: 'tokens' },
        gemini: { quotaLimit: 100, quotaUnit: 'tokens' },
      },
    })
  );
  fs.writeFileSync(
    path.join(tnfHome, 'metrics', 'health-latest.json'),
    JSON.stringify({
      usage: {
        a1: 100,
        a2: 90,
      },
    })
  );

  const quotas = new AgentQuotaService({ tnfHome, now: () => NOW });
  const q1 = quotas.refreshForAgent({ agentId: 'a1', name: 'alpha', platform: 'claude' });
  const q2 = quotas.refreshForAgent({ agentId: 'a2', name: 'beta', platform: 'gemini' });
  check('claude remaining computed', q1.remaining === 900, String(q1.remaining));
  check('gemini remaining computed', q2.remaining === 10, String(q2.remaining));
  check('fresh quota not degraded', q1.degraded !== true);

  const stale = quotas.markFreshness(
    {
      ...q1,
      observedAt: new Date(NOW.getTime() - 600_000).toISOString(),
      refreshedAt: new Date(NOW.getTime() - 600_000).toISOString(),
    },
    NOW.getTime()
  );
  check('stale quota marked degraded', stale.degraded === true, String(stale.degraded));

  const ranked = rankAgentsForDelegation(
    [
      {
        agentId: 'a1',
        name: 'alpha',
        platform: 'claude',
        isOnline: true,
        source: 'test',
        capabilities: ['code'],
        quota: q1,
      },
      {
        agentId: 'a2',
        name: 'beta',
        platform: 'gemini',
        isOnline: true,
        source: 'test',
        capabilities: ['code'],
        quota: q2,
      },
    ],
    { capabilities: ['code'], now: NOW.getTime() }
  );
  check('higher remaining ranks first', ranked[0]?.agent.agentId === 'a1', ranked[0]?.agent.agentId);

  fs.rmSync(tnfHome, { recursive: true, force: true });
}

console.log('\nprofile session gate');

{
  const tnfHome = makeTempHome();
  const sessions = new ProfileSessionService({ tnfHome, now: () => NOW });
  check('starts unauthenticated', sessions.isAuthenticated('alice') === false);

  let threw = false;
  try {
    sessions.requireActiveSession('alice');
  } catch {
    threw = true;
  }
  check('requireActiveSession throws when logged out', threw);

  const session = sessions.login({ profile: 'alice', passphrase: 'secret' });
  check('login creates session', !!session.sessionId);
  check('authenticated after login', sessions.isAuthenticated('alice') === true);
  const who = sessions.whoami();
  check(
    'whoami shows profile',
    who.identity.profile === 'alice',
    `got=${who.identity.profile} envTNF_PROFILE=${process.env.TNF_PROFILE || ''}`
  );
  check(
    'whoami disclaimer separates identity/auth/capability/authority',
    who.disclaimer.includes('identity/profile')
  );

  // Login alone must not grant mutation when agent context lacks role.
  const prevAgent = process.env.TNF_AGENT_ID;
  process.env.TNF_AGENT_ID = 'alice-unprivileged';
  fs.mkdirSync(path.join(tnfHome, 'authority'), { recursive: true });
  fs.writeFileSync(
    path.join(tnfHome, 'authority', 'roles.json'),
    JSON.stringify({ version: 1, agents: { 'tnf-local-subdirector': { role: 'sub-director' } } })
  );
  let unauthorized = false;
  try {
    sessions.requireMutationAuthority({ action: 'test-mutation', agentId: 'alice-unprivileged' });
  } catch {
    unauthorized = true;
  }
  check('logged-in without authority cannot mutate', unauthorized);
  if (prevAgent === undefined) delete process.env.TNF_AGENT_ID;
  else process.env.TNF_AGENT_ID = prevAgent;

  let badLogin = false;
  try {
    sessions.login({ profile: 'alice', passphrase: 'wrong' });
  } catch {
    badLogin = true;
  }
  check('bad passphrase rejected', badLogin);

  sessions.logout('alice');
  check('logout clears session', sessions.isAuthenticated('alice') === false);

  fs.rmSync(tnfHome, { recursive: true, force: true });
}

console.log('\necosystem hydration (task-scoped)');

{
  const tnfHome = makeTempHome();
  const sessions = new ProfileSessionService({ tnfHome, now: () => NOW });
  sessions.login({ profile: 'alice', identityMode: 'local' });
  fs.writeFileSync(
    path.join(tnfHome, 'handoff-current.json'),
    JSON.stringify({ IMMEDIATE_TASKS: ['do-thing'] })
  );

  const ledger = new AgentStateLedgerService({ tnfHome, profile: 'alice', now: () => NOW });
  ledger.writeSnapshot({
    writer: 'test',
    agents: [
      {
        agentId: 'a1',
        name: 'alpha',
        platform: 'claude',
        isOnline: true,
        source: 'test',
      },
    ],
  });

  const hydrator = new EcosystemHydrationService({
    tnfHome,
    profile: 'alice',
    profileSessions: sessions,
    ledger,
    now: () => NOW,
    requireAuth: true,
  });
  const snap = hydrator.hydrate();
  check('ecosystem authenticated', snap.authenticated === true);
  check('ecosystem has agents', snap.slices.agents.length === 1);
  check('ecosystem has tasks', snap.slices.tasks.includes('do-thing'));
  check('hydrate kind task-scoped', snap.kind === 'task-scoped-hydration');
  check(
    'ecosystem persisted',
    fs.existsSync(path.join(tnfHome, 'user-context', 'data', 'alice', 'working', 'ecosystem-latest.json'))
  );

  sessions.logout('alice');
  let blocked = false;
  try {
    hydrator.hydrate();
  } catch {
    blocked = true;
  }
  check('hydrate requires auth', blocked);

  fs.rmSync(tnfHome, { recursive: true, force: true });
}

console.log('\nadversarial: unknown/stale quota, authority gate, recovery, orient');

{
  const tnfHome = makeTempHome();
  fs.mkdirSync(path.join(tnfHome, 'authority'), { recursive: true });
  fs.writeFileSync(
    path.join(tnfHome, 'authority', 'roles.json'),
    JSON.stringify({
      version: 1,
      agents: { a1: { role: 'sub-director' }, a2: { role: 'worker' } },
    })
  );

  const quotas = new AgentQuotaService({ tnfHome, now: () => NOW });
  const unknown = quotas.refreshForAgent({
    agentId: 'ghost',
    name: 'ghost',
    platform: 'no-such-provider',
  });
  check('unknown quota confidence', unknown.confidence === 'unknown');
  check('unknown remaining is null not zero', unknown.remaining === null);
  check('unknown limit is null not unlimited', unknown.limit === null);

  fs.writeFileSync(
    path.join(tnfHome, 'provider-config.json'),
    JSON.stringify({ providers: { claude: { quotaLimit: 1000, quotaUnit: 'tokens' } } })
  );
  fs.writeFileSync(
    path.join(tnfHome, 'metrics', 'health-latest.json'),
    JSON.stringify({ usage: { a1: 50 } })
  );
  const q1 = quotas.refreshForAgent({ agentId: 'a1', name: 'alpha', platform: 'claude' });
  const stale = quotas.markFreshness(
    {
      ...q1,
      observedAt: new Date(NOW.getTime() - 600_000).toISOString(),
      refreshedAt: new Date(NOW.getTime() - 600_000).toISOString(),
    },
    NOW.getTime()
  );
  check('stale quota degraded', stale.degraded === true);

  const withRoles = quotas.attachAuthorityRoles([
    {
      agentId: 'a1',
      name: 'alpha',
      platform: 'claude',
      isOnline: false,
      source: 'test',
      capabilities: ['code'],
      quota: q1,
    },
    {
      agentId: 'a2',
      name: 'beta',
      platform: 'claude',
      isOnline: true,
      source: 'test',
      capabilities: ['code'],
      quota: { ...q1, agentId: 'a2', remaining: 999, remainingFraction: 0.999 },
    },
  ]);
  const ranked = rankAgentsForDelegation(withRoles, {
    requiredAuthorityRoles: ['sub-director'],
    capabilities: ['code'],
    now: NOW.getTime(),
  });
  check('authority hard-gate beats high quota', ranked[0]?.agent.agentId === 'a1');
  check('worker marked ineligible', ranked.find((r) => r.agent.agentId === 'a2')?.authorityEligible === false);
  check('correct authority but offline still ranks with offline penalty', ranked[0]?.reasons.includes('offline'));

  const ledger = new AgentStateLedgerService({
    tnfHome,
    profile: 'alice',
    historyCap: 3,
    now: () => NOW,
  });
  for (let i = 0; i < 4; i += 1) {
    new AgentStateLedgerService({
      tnfHome,
      profile: 'alice',
      historyCap: 3,
      now: () => new Date(NOW.getTime() + i * 1000),
    }).writeSnapshot({
      agents: [{ agentId: 'a1', name: 'alpha', platform: 'claude', isOnline: true, source: 'test' }],
      writer: `adv-${i}`,
    });
  }
  fs.unlinkSync(ledger.latestPath());
  const recovered = ledger.recoverLatestFromHistory();
  check('recover after truncated latest', !!recovered);
  check('recovered not authoritative', recovered?.authority === 'not-authoritative');
  check('recovered kind observation-history', recovered?.kind === 'observation-history');

  const sessions = new ProfileSessionService({ tnfHome, now: () => NOW });
  sessions.login({ profile: 'alice' });
  const orient = new EcosystemHydrationService({
    tnfHome,
    profile: 'alice',
    profileSessions: sessions,
    now: () => NOW,
    requireAuth: true,
  }).orient();
  check('orient is boot-orientation', orient.kind === 'boot-orientation');
  check(
    'hosted missing degrades cleanly',
    orient.receipts.some((r) => r.slice === 'hosted' && (r.status === 'missing' || r.status === 'degraded' || r.status === 'empty'))
  );

  fs.rmSync(tnfHome, { recursive: true, force: true });
}

console.log(`\nAgentStateQuotaEcosystem: ${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
