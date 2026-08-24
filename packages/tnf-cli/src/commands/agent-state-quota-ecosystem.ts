/**
 * Command surface: tnf profile | tnf agent state/quotas | tnf ecosystem
 */
import chalk from 'chalk';
import type { Command } from 'commander';
import * as os from 'node:os';
import * as path from 'node:path';
import { AgentManagerService } from '../services/AgentManagerService.js';
import { AgentQuotaService, rankAgentsForDelegation } from '../services/AgentQuotaService.js';
import { AgentStateLedgerService } from '../services/AgentStateLedgerService.js';
import { EcosystemHydrationService } from '../services/EcosystemHydrationService.js';
import {
  ProfileSessionError,
  ProfileSessionService,
} from '../services/ProfileSessionService.js';
import type { AgentStateEntry } from '../services/agent-state-types.js';
import { getOrCreateCommand } from './_registry.js';

function defaultTnfHome(): string {
  return process.env.TNF_HOME || path.join(os.homedir(), '.tnf');
}

function fail(err: unknown): never {
  const message = err instanceof Error ? err.message : String(err);
  console.error(chalk.red(message));
  process.exit(1);
}

function toLedgerAgents(manager: AgentManagerService): AgentStateEntry[] {
  return manager.list().map((a) => ({
    agentId: a.id,
    name: a.name,
    role: a.role,
    platform: a.platform,
    capabilities: a.capabilities,
    isOnline: a.isOnline,
    lastSeen: a.lastSeen,
    source: 'agent-manager',
  }));
}

export function registerProfileCommands(program: Command, repoRoot: string): void {
  const profile = getOrCreateCommand(program, 'profile', 'Manage local TNF user profiles and sessions');
  const sessions = () => new ProfileSessionService({ tnfHome: defaultTnfHome() });

  profile
    .command('list')
    .alias('ls')
    .description('List local TNF profiles')
    .option('--json', 'Machine-readable JSON')
    .action((opts: { json?: boolean }) => {
      try {
        const svc = sessions();
        const active = svc.getActiveProfileName();
        const rows = svc.listProfiles().map((name) => ({
          name,
          active: name === active,
          authenticated: svc.isAuthenticated(name),
        }));
        if (opts.json) {
          console.log(JSON.stringify({ active, profiles: rows }, null, 2));
          return;
        }
        console.log(chalk.bold('\nTNF Profiles\n'));
        for (const row of rows) {
          const mark = row.active ? chalk.green('*') : ' ';
          const auth = row.authenticated ? chalk.green('authenticated') : chalk.yellow('logged-out');
          console.log(`  ${mark} ${chalk.cyan(row.name)}  ${auth}`);
        }
        console.log('');
      } catch (err) {
        fail(err);
      }
    });

  profile
    .command('whoami')
    .description('Show identity vs authentication vs capability vs authority distinctions')
    .option('--json', 'Machine-readable JSON')
    .action((opts: { json?: boolean }) => {
      try {
        const info = sessions().whoami();
        if (opts.json) {
          console.log(JSON.stringify(info, null, 2));
          return;
        }
        console.log(chalk.bold('\nTNF Who Am I\n'));
        console.log(chalk.dim(info.disclaimer));
        console.log(`  Identity:        ${chalk.cyan(info.identity.profile)} (mode=${info.identity.identityMode || 'n/a'})`);
        console.log(
          `  Authentication:  ${
            info.authentication.authenticated ? chalk.green('session active') : chalk.yellow('logged out')
          }`
        );
        console.log(
          `  Capability:      providers=[${info.capability.providerAuthConfigured.join(', ') || 'none'}]`
        );
        console.log(
          `  Authority:       roles=${info.authority.rolesPresent ? 'present' : 'missing'} agents=${
            Object.keys(info.authority.agentRoles).length
          } pendingElevations=${info.authority.elevationPendingCount}`
        );
        console.log(chalk.dim(`  ${info.authority.note}`));
        console.log('');
      } catch (err) {
        fail(err);
      }
    });

  profile
    .command('login')
    .description('Authenticate a local (or optional cloud) TNF profile session')
    .option('--profile <name>', 'Profile name')
    .option('--passphrase <secret>', 'Optional local passphrase')
    .option('--cloud', 'Attempt cloud link to app.thenewfuse.com')
    .option('--cloud-endpoint <url>', 'Cloud endpoint override')
    .option('--identity-mode <mode>', 'local|cloud|sandbox|custom')
    .option('--json', 'Machine-readable JSON')
    .action(
      (opts: {
        profile?: string;
        passphrase?: string;
        cloud?: boolean;
        cloudEndpoint?: string;
        identityMode?: string;
        json?: boolean;
      }) => {
        try {
          const session = sessions().login({
            profile: opts.profile,
            passphrase: opts.passphrase,
            cloud: opts.cloud,
            cloudEndpoint: opts.cloudEndpoint,
            identityMode: opts.identityMode as any,
          });
          // Boot uses cheap orientation — not full universe hydrate.
          try {
            new EcosystemHydrationService({
              tnfHome: defaultTnfHome(),
              profile: session.profile,
              repoRoot,
              requireAuth: true,
            }).orient();
          } catch (hydrateErr) {
            console.error(
              chalk.yellow(
                `Warning: orientation deferred: ${
                  hydrateErr instanceof Error ? hydrateErr.message : String(hydrateErr)
                }`
              )
            );
          }
          if (opts.json) {
            console.log(JSON.stringify(session, null, 2));
            return;
          }
          console.log(chalk.green(`Authenticated profile '${session.profile}'`));
          console.log(chalk.dim('Note: authentication ≠ authority. Mutation still needs ~/.tnf/authority.'));
          console.log(`  session: ${chalk.dim(session.sessionId)}`);
          console.log(`  expires: ${session.expiresAt}`);
        } catch (err) {
          if (err instanceof ProfileSessionError) fail(err);
          fail(err);
        }
      }
    );

  profile
    .command('logout')
    .description('End the active profile session')
    .option('--profile <name>', 'Profile name')
    .action((opts: { profile?: string }) => {
      try {
        const ok = sessions().logout(opts.profile);
        console.log(ok ? chalk.green('Logged out') : chalk.yellow('No active session'));
      } catch (err) {
        fail(err);
      }
    });

  profile
    .command('switch')
    .description('Switch active TNF profile')
    .argument('<name>', 'Profile name')
    .option('--allow-logged-out', 'Allow switch without an active session')
    .option('--json', 'Machine-readable JSON')
    .action((name: string, opts: { allowLoggedOut?: boolean; json?: boolean }) => {
      try {
        const session = sessions().switchProfile(name, {
          requireLogin: !opts.allowLoggedOut,
        });
        if (opts.json) {
          console.log(JSON.stringify({ profile: name, session }, null, 2));
          return;
        }
        console.log(chalk.green(`Active profile: ${name}`));
        if (!session) console.log(chalk.yellow('No session yet — run tnf profile login'));
      } catch (err) {
        fail(err);
      }
    });
}

export function registerAgentStateQuotaCommands(program: Command, repoRoot: string): void {
  const agent = getOrCreateCommand(program, 'agent', 'Manage agents');
  const tnfHome = defaultTnfHome();

  agent
    .command('state')
    .description('Show onboarded agent-state observation snapshot (not authoritative)')
    .option('--json', 'Machine-readable JSON')
    .option('--refresh', 'Rebuild observation snapshot (requires mutation authority)')
    .action((opts: { json?: boolean; refresh?: boolean }) => {
      try {
        const tnfHome = defaultTnfHome();
        const sessions = new ProfileSessionService({ tnfHome });
        sessions.requireActiveSession();
        const ledger = new AgentStateLedgerService({ tnfHome });
        if (opts.refresh) {
          sessions.requireMutationAuthority({ action: 'agent-state.refresh' });
          const managers = new AgentManagerService();
          ledger.writeSnapshot({
            agents: toLedgerAgents(managers),
            writer: 'tnf agent state --refresh',
          });
        }
        const latest = ledger.readLatest() || ledger.recoverLatestFromHistory();
        if (!latest) {
          console.log(chalk.yellow('No agent-state observation yet. Run: tnf agent state --refresh'));
          return;
        }
        if (opts.json) {
          console.log(JSON.stringify(latest, null, 2));
          return;
        }
        console.log(chalk.bold('\nAgent State Observation\n'));
        console.log(chalk.dim(`  kind=${latest.kind} authority=${latest.authority}`));
        console.log(`  Profile: ${latest.profile}`);
        console.log(`  At:      ${latest.generatedAt}`);
        console.log(`  Agents:  ${latest.agents.length}`);
        for (const a of latest.agents) {
          const online = a.isOnline ? chalk.green('online') : chalk.yellow('offline');
          const rem =
            a.quota?.confidence === 'unknown' || a.quota?.remaining == null
              ? 'quota=UNKNOWN'
              : `quota=${a.quota.remaining}/${a.quota.limit}`;
          console.log(`  - ${chalk.cyan(a.name)} (${a.agentId}) ${online} ${chalk.dim(rem)}`);
        }
        console.log('');
      } catch (err) {
        fail(err);
      }
    });

  agent
    .command('state-history')
    .description('List recent agent-state history snapshots')
    .option('--limit <n>', 'Max snapshots', '10')
    .option('--json', 'Machine-readable JSON')
    .action((opts: { limit?: string; json?: boolean }) => {
      try {
        new ProfileSessionService({ tnfHome }).requireActiveSession();
        const ledger = new AgentStateLedgerService({ tnfHome });
        const limit = Math.max(1, Number(opts.limit || 10) || 10);
        const history = ledger.readHistory(limit);
        if (opts.json) {
          console.log(JSON.stringify(history, null, 2));
          return;
        }
        console.log(chalk.bold('\nAgent State History\n'));
        for (const snap of history) {
          console.log(`  ${snap.generatedAt}  agents=${snap.agents.length}`);
        }
        console.log('');
      } catch (err) {
        fail(err);
      }
    });

  agent
    .command('quotas')
    .description('Show refreshed per-agent usage quotas for delegation')
    .option('--json', 'Machine-readable JSON')
    .option('--rank', 'Include delegation ranking')
    .option('--capability <cap>', 'Required capability hint (repeatable)', (val, acc: string[]) => {
      acc.push(val);
      return acc;
    }, [] as string[])
    .action((opts: { json?: boolean; rank?: boolean; capability?: string[] }) => {
      try {
        const sessions = new ProfileSessionService({ tnfHome });
        sessions.requireActiveSession();
        const ledger = new AgentStateLedgerService({ tnfHome });
        let agents = ledger.readLatest()?.agents || ledger.recoverLatestFromHistory()?.agents;
        if (!agents?.length) {
          sessions.requireMutationAuthority({ action: 'agent-quotas.bootstrap-observation' });
          agents = toLedgerAgents(new AgentManagerService());
          ledger.writeSnapshot({ agents, writer: 'tnf agent quotas' });
          agents = ledger.readLatest()?.agents || agents;
        }
        const quotaSvc = new AgentQuotaService({ tnfHome, repoRoot });
        const quotas = quotaSvc
          .attachAuthorityRoles(agents)
          .map((a) => quotaSvc.markFreshness(quotaSvc.refreshForAgent(a)));
        const withQuota = agents.map((a) => ({
          ...a,
          quota: quotas.find((q) => q.agentId === a.agentId) || null,
        }));
        const ranked = opts.rank
          ? rankAgentsForDelegation(withQuota, {
              capabilities: opts.capability || [],
              repoRoot,
            })
          : undefined;
        if (opts.json) {
          console.log(JSON.stringify({ quotas, ranked }, null, 2));
          return;
        }
        console.log(chalk.bold('\nAgent Quotas\n'));
        for (const q of quotas) {
          const flag =
            q.confidence === 'unknown'
              ? chalk.yellow('UNKNOWN')
              : q.degraded
                ? chalk.yellow('degraded')
                : chalk.green(`fresh/${q.confidence}`);
          const rem =
            q.remaining == null || q.limit == null ? 'UNKNOWN' : `${q.remaining}/${q.limit}`;
          console.log(`  ${chalk.cyan(q.agentId)}  ${q.provider}  ${rem} ${q.unit}  ${flag}`);
        }
        if (ranked) {
          console.log(chalk.bold('\nDelegation Rank (authority hard-gated)\n'));
          ranked.slice(0, 10).forEach((row, idx) => {
            const gate = row.authorityEligible ? '' : chalk.red(' [ineligible]');
            console.log(
              `  ${idx + 1}. ${row.agent.name} score=${row.score}${gate} (${row.reasons.join(', ')})`
            );
          });
        }
        console.log('');
      } catch (err) {
        fail(err);
      }
    });
}

export function registerEcosystemCommands(program: Command, repoRoot: string): void {
  const ecosystem = getOrCreateCommand(
    program,
    'ecosystem',
    'Authenticated ecosystem orientation / task-scoped hydration for control surfaces'
  );

  ecosystem
    .command('orient')
    .description('Cheap boot orientation snapshot (providers, health, authority refs, quota summary)')
    .option('--json', 'Machine-readable JSON')
    .action((opts: { json?: boolean }) => {
      try {
        const tnfHome = defaultTnfHome();
        new ProfileSessionService({ tnfHome }).requireActiveSession();
        const snap = new EcosystemHydrationService({
          tnfHome,
          repoRoot,
          requireAuth: true,
        }).orient();
        if (opts.json) {
          console.log(JSON.stringify(snap, null, 2));
          return;
        }
        console.log(chalk.bold('\nTNF Ecosystem Orientation\n'));
        console.log(`  Profile: ${snap.profile}`);
        console.log(`  Auth:    ${snap.authenticated ? chalk.green('yes') : chalk.red('no')}`);
        console.log(
          `  Providers authenticated: ${
            snap.enlistedProviders.filter((p) => p.authenticated).length
          }/${snap.enlistedProviders.length}`
        );
        console.log(
          `  Quotas: fresh=${snap.quotaFreshnessSummary.fresh} unknown=${snap.quotaFreshnessSummary.unknown}`
        );
        console.log(`  Authority agent roles: ${snap.authorityRefs.agentRoleCount}`);
        console.log('');
      } catch (err) {
        fail(err);
      }
    });

  ecosystem
    .command('show')
    .description('Task-scoped ecosystem hydration (lazy; use orient for boot)')
    .option('--json', 'Machine-readable JSON')
    .option('--refresh', 'Force re-hydrate', true)
    .action((opts: { json?: boolean; refresh?: boolean }) => {
      try {
        const tnfHome = defaultTnfHome();
        new ProfileSessionService({ tnfHome }).requireActiveSession();
        const hydrator = new EcosystemHydrationService({
          tnfHome,
          repoRoot,
          requireAuth: true,
        });
        const snapshot =
          opts.refresh === false ? hydrator.readLatest() || hydrator.hydrate() : hydrator.hydrate();
        if (opts.json) {
          console.log(JSON.stringify(snapshot, null, 2));
          return;
        }
        console.log(chalk.bold('\nTNF Ecosystem (task-scoped)\n'));
        console.log(`  Profile: ${snapshot.profile}`);
        console.log(`  Auth:    ${snapshot.authenticated ? chalk.green('yes') : chalk.red('no')}`);
        console.log(`  Agents:  ${snapshot.slices.agents.length}`);
        console.log(`  Quotas:  ${snapshot.slices.quotas.length}`);
        console.log(`  Tasks:   ${snapshot.slices.tasks.length}`);
        console.log(`  Projects:${snapshot.slices.projects.length}`);
        console.log(`  Sources: ${snapshot.slices.sources.length}`);
        console.log(`  Platforms:${snapshot.slices.platforms.length}`);
        console.log(`  Websites:${snapshot.slices.websites.length}`);
        console.log('');
        for (const receipt of snapshot.receipts) {
          console.log(`  [${receipt.status}] ${receipt.slice}: ${receipt.detail}`);
        }
        console.log('');
      } catch (err) {
        fail(err);
      }
    });
}

export function registerAgentStateQuotaEcosystemCommands(program: Command, repoRoot: string): void {
  registerProfileCommands(program, repoRoot);
  registerAgentStateQuotaCommands(program, repoRoot);
  registerEcosystemCommands(program, repoRoot);
}
