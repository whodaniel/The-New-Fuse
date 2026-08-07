import chalk from 'chalk';
import fs from 'fs';
import path from 'path';

export type BootRunOptions = {
  profile: string;
  nonInteractive?: boolean;
  attachAgent?: boolean;
  strictGates?: boolean;
  skipEnvValidation?: boolean;
  forceOnboard?: boolean;
  withClaude?: boolean;
  skipOnboard?: boolean;
  /** Elevate factory + health to critical so "operational" means core is up. */
  requireCore?: boolean;
  /** After stack steps, activate alive + harness continuity surfaces. */
  autonomous?: boolean;
};

export type BootPlanStep = {
  id: string;
  label: string;
  critical: boolean;
  launches: string[];
  notes?: string[];
};

export type BootExecutableStep = BootPlanStep & {
  action: () => Promise<void>;
};

export type BootCommandRunner = (
  cmd: string,
  args: string[],
  options?: { cwd?: string; env?: NodeJS.ProcessEnv; isBackground?: boolean }
) => Promise<void>;

export type BootPipelineDeps = {
  repoRoot: string;
  runCommand: BootCommandRunner;
  findExecutableOnPath: (commandName: string) => string | null;
};

export type BootStepResult = {
  id: string;
  label: string;
  status: 'ok' | 'failed' | 'skipped';
  critical: boolean;
  error?: string;
  durationMs: number;
};

export type BootReceipt = {
  source: 'cli.boot';
  profile: string;
  timestamp: string;
  strictGates: boolean;
  nonInteractive: boolean;
  attachAgent: boolean;
  withClaude: boolean;
  forceOnboard: boolean;
  skipOnboard: boolean;
  skipEnvValidation: boolean;
  requireCore: boolean;
  autonomous: boolean;
  steps: BootStepResult[];
  warnings: string[];
  ok: boolean;
};

const BOOT_RECEIPT_REL = '.agent/runtime-logs/cli-boot.latest.json';
const RUNTIME_DIRS = [
  '.agent/runtime-state',
  '.agent/runtime-logs',
  '.agent/test-reports',
  'data/agent-registry',
] as const;

function printManualUiAlternatives(): void {
  console.log(chalk.cyan('   Manually launch any of:'));
  console.log(chalk.cyan('     tnf forefront       (web UI + relay + browser auto-open)'));
  console.log(chalk.cyan('     tnf local-ui        (web UI only)'));
  console.log(chalk.cyan('     tnf tui             (TNF TUI agent CLI)'));
  console.log(chalk.cyan('     tnf local-ui --tauri  (native Tauri shell)'));
}

/**
 * Single source of truth for `tnf boot --plan` and live execution.
 * Preflight ProtocolInterceptor already runs Turn Zero; onboard is optional/redundant
 * unless --force-onboard is set.
 */
export function createBootPipeline(
  deps: BootPipelineDeps,
  options: BootRunOptions
): BootExecutableStep[] {
  const { repoRoot, runCommand, findExecutableOnPath } = deps;
  const nonInteractive = Boolean(options.nonInteractive);
  const strictGates = Boolean(options.strictGates);
  const requireCore = Boolean(options.requireCore) || strictGates;
  const autonomous = Boolean(options.autonomous);
  const withClaude = Boolean(options.withClaude);
  const skipOnboard = options.skipOnboard !== false && !options.forceOnboard;

  const agentNetworkArgs = ['scripts/start-agent-network.sh', '--all'];
  if (withClaude) agentNetworkArgs.push('--claude');

  // Per TNF_COLLISION_PROVISION.md C1 — verify workspace build artifacts exist
  // before boot tries to spawn processes that import from dist/.
  const REQUIRED_DIST_PACKAGES = [
    'infrastructure',
    'shared',
    'tnf-core',
    'tnf-note-taking',
    'tnf-cli',
  ];

  const steps: BootExecutableStep[] = [
    {
      id: 'build-artifact-check',
      label: 'Build artifact integrity check (dist/ existence)',
      critical: true,
      launches: ['fs.existsSync check on required dist/ dirs'],
      notes: [
        'Per TNF_COLLISION_PROVISION.md C1 — prevents ERR_MODULE_NOT_FOUND from a missing build.',
        'If this fails, run: pnpm --filter @the-new-fuse/infrastructure run build, then shared, tnf-core, tnf-note-taking, tnf-cli (in dependency order).',
        'Or run the root build: pnpm run build',
      ],
      action: async () => {
        const missing: { pkg: string; distPath: string }[] = [];
        for (const pkg of REQUIRED_DIST_PACKAGES) {
          const distPath = path.join(repoRoot, 'packages', pkg, 'dist');
          if (!fs.existsSync(distPath) || !fs.existsSync(path.join(distPath, 'index.js'))) {
            missing.push({ pkg, distPath });
          }
        }
        if (missing.length > 0) {
          const pkgList = missing
            .map((m) => `  - @the-new-fuse/${m.pkg}  (missing ${m.distPath}/index.js)`)
            .join('\n');
          console.error(
            chalk.red(
              `\n   [build-artifact-check] Build artifacts missing for ${missing.length} package(s):\n${pkgList}\n`
            )
          );
          console.error(
            chalk.yellow(
              '   Run `pnpm run build` from the repo root, or build individually in dependency order:'
            )
          );
          console.error(chalk.dim('     pnpm --filter @the-new-fuse/infrastructure run build'));
          console.error(chalk.dim('     pnpm --filter @the-new-fuse/shared run build'));
          console.error(chalk.dim('     pnpm --filter @the-new-fuse/tnf-core run build'));
          console.error(chalk.dim('     pnpm --filter @the-new-fuse/tnf-note-taking run build'));
          console.error(chalk.dim('     pnpm --filter @the-new-fuse/tnf-cli run build\n'));
          throw new Error(
            `Build artifacts missing for: ${missing.map((m) => m.pkg).join(', ')}. ` +
              'Run `pnpm run build` from the repo root before booting. ' +
              '(TNF_COLLISION_PROVISION.md C1 — do not boot against a half-built workspace.)'
          );
        }
        console.log(chalk.green('   All required dist/ artifacts present.'));
      },
    },
    {
      id: 'turn-zero-onboard',
      label: 'Turn Zero onboarding surface',
      critical: true,
      launches: skipOnboard
        ? ['skipped (ProtocolInterceptor preflight already ran Turn Zero)']
        : ['node scripts/tnf-onboard.cjs --runtime-timeout-ms 1000'],
      notes: [
        'Global CLI preflight already enforces Turn Zero via ProtocolInterceptor.',
        'Pass --force-onboard to re-run scripts/tnf-onboard.cjs (fleet probe + raw-agent prompt).',
      ],
      action: async () => {
        if (skipOnboard) {
          console.log(
            chalk.dim(
              '   Skipped redundant onboard (preflight Turn Zero already ran). Use --force-onboard to re-run.'
            )
          );
          return;
        }
        await runCommand('node', ['scripts/tnf-onboard.cjs', '--runtime-timeout-ms', '1000']);
      },
    },
    {
      id: 'harness-context',
      label: 'Adaptive harness context (models/hosts/profile)',
      critical: false,
      launches: [
        'node scripts/runtime/resolve-harness-context.cjs --force',
        '.agent/runtime-state/harness-context.env',
      ],
      notes: [
        'Resolves live models/providers/hosts per user profile + ~/.tnf/model-providers.json.',
        'Agent-network Terminals source this env via launch-agent-wrapper.sh (no stale hardcodes).',
        'Override via profile.harness.* or env; refresh with: tnf harness context --force',
      ],
      action: async () => {
        await runCommand('node', ['scripts/runtime/resolve-harness-context.cjs', '--force']);
      },
    },
    {
      id: 'port-preflight',
      label: 'Port preflight',
      critical: false,
      launches: [
        strictGates
          ? 'node scripts/tnf-ports.cjs preflight --strict'
          : 'node scripts/tnf-ports.cjs preflight',
      ],
      notes: [
        'Occupied TNF runtimes are allowed only when their health endpoints match the expected service.',
        'Use --strict-gates or FACTORY_BOOT_PORT_PREFLIGHT_STRICT=true to fail on other occupied required ports.',
      ],
      action: async () => {
        const args = ['scripts/tnf-ports.cjs', 'preflight'];
        if (strictGates) args.push('--strict');
        await runCommand('node', args);
      },
    },
    {
      id: 'env-validation',
      label: 'Verifying environment variables',
      critical: false,
      launches: options.skipEnvValidation
        ? ['skipped (--skip-env-validation)']
        : ['bash scripts/validate-env.sh'],
      action: async () => {
        if (options.skipEnvValidation) {
          console.log(chalk.dim('   Skipped (--skip-env-validation)'));
          return;
        }
        await runCommand('bash', ['scripts/validate-env.sh']);
      },
    },
    {
      id: 'mount-volumes',
      label: 'Mounting volumes',
      critical: true,
      launches: [`mkdir -p ${RUNTIME_DIRS.join(' ')}`],
      action: async () => {
        for (const dir of RUNTIME_DIRS) {
          const abs = path.join(repoRoot, dir);
          if (!fs.existsSync(abs)) {
            fs.mkdirSync(abs, { recursive: true });
            console.log(chalk.dim(`   Created ${dir}`));
          }
        }
        const profilePath = path.join(repoRoot, '.agent/runtime-state/cli-boot-profile.txt');
        fs.writeFileSync(profilePath, `${options.profile}\n`, 'utf8');
      },
    },
    {
      id: 'mcp-health',
      label: 'MCP health check',
      critical: false,
      launches: ['node scripts/mcp-health-check.cjs'],
      notes: ['Warning-only local service misses are non-fatal unless TNF_MCP_HEALTH_STRICT=1.'],
      action: async () => {
        await runCommand('node', ['scripts/mcp-health-check.cjs']);
      },
    },
    {
      id: 'supercycle',
      label: 'Directive rotation scheduler',
      critical: false,
      launches: ['pnpm run factory:supercycle (detached)'],
      action: async () => {
        await runCommand('pnpm', ['run', 'factory:supercycle'], { isBackground: true });
      },
    },
    {
      id: 'llm-provider-tester',
      label: 'LLM provider tester',
      critical: false,
      launches: ['node scripts/swarm/llm-provider-tester.cjs (detached)'],
      action: async () => {
        await runCommand('node', ['scripts/swarm/llm-provider-tester.cjs'], {
          isBackground: true,
        });
      },
    },
    {
      id: 'zeroclaw',
      label: 'Model fallback / ZeroClaw sandbox wake',
      critical: false,
      launches: ['node scripts/orchestrator/zeroclaw-boot.cjs'],
      notes: ['CloudRuntime wake-up is optional when cloud_runtime CLI is absent.'],
      action: async () => {
        await runCommand('node', ['scripts/orchestrator/zeroclaw-boot.cjs']);
      },
    },
    {
      id: 'handoff-matrix',
      label: 'Session handoff refresh + gate',
      critical: false,
      launches: [
        'node scripts/turn-end.cjs --no-stage',
        'node scripts/protocols/enforce-session-handoff.cjs --mode=ci',
      ],
      notes: [
        'Fresh boot often has critical commits without a re-staged handoff; gate failures stay non-fatal.',
        'Resolve with: pnpm run validate:session-handoff',
      ],
      action: async () => {
        try {
          await runCommand('node', ['scripts/turn-end.cjs', '--no-stage']);
        } catch (turnEndErr: unknown) {
          const msg =
            turnEndErr instanceof Error ? turnEndErr.message : String(turnEndErr ?? 'unknown');
          console.log(chalk.dim(`   [handoff] turn-end preflight skipped: ${msg}`));
        }
        try {
          await runCommand('node', ['scripts/protocols/enforce-session-handoff.cjs', '--mode=ci']);
        } catch (gateErr: unknown) {
          const msg = gateErr instanceof Error ? gateErr.message : String(gateErr ?? 'unknown');
          console.log(chalk.yellow(`   [handoff] gate warning (non-fatal): ${msg}`));
          console.log(
            chalk.dim('   Run `pnpm run validate:session-handoff` to resolve; boot continues.')
          );
        }
      },
    },
    {
      id: 'factory-boot',
      label: 'Platform gateways / relay factory',
      critical: requireCore,
      launches: [
        'bash scripts/orchestrator/factory-boot.sh',
        'packages/relay-core/dist/standalone-relay.js',
        'packages/relay-core/dist/master-clock.js',
        'packages/relay-core/dist/broker-agent.js',
        'packages/relay-core/dist/director-agent.js',
        'scripts/swarm/project-planner.cjs',
        'scripts/orchestrator/impetus-loop.cjs loop',
        '@the-new-fuse/workflow-engine src/orchestrator/start.ts',
        'scripts/orchestrator/factory-supervisor.sh',
      ],
      notes: [
        'Resolves Redis (cloud → local fallback), ledger API, then starts relay + orchestrator daemons.',
        'Redis is also started by the agent-network step; factory-boot may start it earlier if needed.',
      ],
      action: async () => {
        await runCommand('bash', ['scripts/orchestrator/factory-boot.sh'], {
          env: {
            FACTORY_BOOT_REDIS_FAIL_OPEN: strictGates ? 'false' : 'true',
            FACTORY_BOOT_PORT_PREFLIGHT_STRICT: strictGates ? 'true' : 'false',
          },
        });
      },
    },
    {
      id: 'agent-swarm',
      label: 'Agent swarm',
      critical: true,
      launches: [
        'Redis server',
        'scripts/redis-ws-bridge.cjs (:3005)',
        'scripts/antigravity-redis-wrapper.cjs',
        ...(withClaude ? ['scripts/claude-redis-wrapper.cjs'] : []),
        'scripts/gemini-redis-wrapper.cjs',
        'scripts/jules-redis-wrapper.cjs',
        'scripts/pi-redis-wrapper.cjs',
        'scripts/model-watchdog-failover-consumer.cjs',
      ],
      notes: [
        '`--all` starts Gemini/Jules/Pi/Watchdog; Claude is opt-in via --with-claude.',
        'macOS Terminal tab launches are verified by process check before success is printed.',
      ],
      action: async () => {
        await runCommand('bash', agentNetworkArgs);
      },
    },
    {
      id: 'openclaw',
      label: 'OpenClaw MCP/client surface',
      critical: false,
      launches: ['node scripts/tnf-start-ai.cjs openclaw'],
      notes: ['If openclaw CLI is absent, boot provisions MCP config with --no-launch.'],
      action: async () => {
        const args = ['scripts/tnf-start-ai.cjs', 'openclaw'];
        if (strictGates) args.push('--require-doctor');
        const openclawPath = findExecutableOnPath('openclaw');
        if (nonInteractive || !openclawPath) {
          args.push('--no-launch');
          if (!openclawPath) {
            console.log(
              chalk.dim(
                '   OpenClaw CLI not found; provisioning MCP config without launching client'
              )
            );
          }
        }
        await runCommand('node', args);
      },
    },
    {
      id: 'hermes',
      label: 'Hermes operator',
      critical: false,
      launches: ['hermes --daemon (detached)'],
      notes: ['Skipped cleanly when hermes is not on PATH.'],
      action: async () => {
        if (!findExecutableOnPath('hermes')) {
          console.log(chalk.dim('   hermes not on PATH; skipped'));
          return;
        }
        await runCommand('hermes', ['--daemon'], { isBackground: true });
      },
    },
    {
      id: 'voice-kws-always-on',
      label: 'Voice beam + KWS always-on',
      critical: false,
      launches: [
        'bash scripts/system/tnf-voice-kws-boot.sh',
        'audio-trigger-kws-mvp (:43110)',
        'voice-beam-watchdog (server/listen/stream_watch/reply-audio)',
      ],
      notes: [
        'KWS + mic listen stay up by default for every TNF boot (VOICE_KWS_ALWAYS_ON=1).',
        'Heal loop: scripts/system/voice-beam-watchdog.sh also restarts KWS when down.',
        'Disable with VOICE_KWS_ALWAYS_ON=0 if needed.',
      ],
      action: async () => {
        const bootScript = path.join(repoRoot, 'scripts/system/tnf-voice-kws-boot.sh');
        if (!fs.existsSync(bootScript)) {
          console.log(chalk.dim('   tnf-voice-kws-boot.sh missing; skipped'));
          return;
        }
        await runCommand('bash', [bootScript], {
          env: {
            VOICE_KWS_ALWAYS_ON: process.env.VOICE_KWS_ALWAYS_ON || '1',
            VOICE_RESPONSE_AUDIO_DEFAULT_ON: process.env.VOICE_RESPONSE_AUDIO_DEFAULT_ON || '1',
            MINI_OMNI_ENABLED: process.env.MINI_OMNI_ENABLED || 'false',
          },
        });
      },
    },
    {
      id: 'forefront',
      label: 'Browser control panel (forefront)',
      critical: false,
      launches: nonInteractive
        ? ['skipped by --non-interactive']
        : ['node scripts/local-ui/tnf-forefront-boot.cjs'],
      notes: [
        'Receipt: .agent/runtime-logs/forefront-boot.latest.json',
        'Equivalent to `tnf forefront` with TNF_BOOT_PARENT=cli.boot provenance.',
      ],
      action: async () => {
        if (nonInteractive) {
          console.log(chalk.dim('   Skipped (--non-interactive)'));
          return;
        }
        const bootScript = path.join(repoRoot, 'scripts/local-ui/tnf-forefront-boot.cjs');
        if (!fs.existsSync(bootScript)) {
          console.log(
            chalk.dim(
              '   Forefront bootstrap script not found at scripts/local-ui/tnf-forefront-boot.cjs'
            )
          );
          printManualUiAlternatives();
          return;
        }
        try {
          await runCommand('node', [bootScript], { env: { TNF_BOOT_PARENT: 'cli.boot' } });
          const receiptPath = path.join(repoRoot, '.agent/runtime-logs/forefront-boot.latest.json');
          if (fs.existsSync(receiptPath)) {
            try {
              const receipt = JSON.parse(fs.readFileSync(receiptPath, 'utf8'));
              receipt.launchedVia = receipt.launchedVia
                ? `${receipt.launchedVia},cli.boot`
                : 'cli.boot';
              receipt.lastCliBootAt = new Date().toISOString();
              receipt.cliBootProfile = options.profile;
              fs.writeFileSync(receiptPath, JSON.stringify(receipt, null, 2));
            } catch {
              // Receipt is owned by the script — don't fail boot over it.
            }
          }
        } catch (fe: unknown) {
          const msg = fe instanceof Error ? fe.message : String(fe ?? 'unknown');
          console.log(
            chalk.yellow(
              `   [forefront] boot failed: ${msg} — UI not started; manual alternatives below`
            )
          );
          printManualUiAlternatives();
          throw new Error(msg);
        }
      },
    },
    {
      id: 'health-verification',
      label: 'System health verification',
      critical: requireCore,
      launches: ['bash scripts/system-health-verification.sh'],
      notes: requireCore ? ['Elevated to critical by --require-core / --strict-gates.'] : undefined,
      action: async () => {
        await runCommand('bash', ['scripts/system-health-verification.sh']);
      },
    },
    {
      id: 'autonomous-continuity',
      label: 'Autonomous continuity (alive + harness)',
      critical: false,
      launches: autonomous
        ? ['tnf alive up --install-cron', 'tnf harness boot']
        : ['skipped (pass --autonomous)'],
      notes: [
        'Keeps daemon + heartbeat + director/relay monitor running so the stack does not stall.',
        'Full-auto daemon is started separately: tnf full-auto daemon start --interval-minutes 30 --broadcast',
      ],
      action: async () => {
        if (!autonomous) {
          console.log(chalk.dim('   Skipped (pass --autonomous to activate alive + harness)'));
          return;
        }
        // Invoke via node entry to avoid nested splash/preflight storms when possible.
        await runCommand('node', [
          '--import',
          'tsx',
          path.join(repoRoot, 'packages/tnf-cli/src/cli.ts'),
          '--no-splash',
          'alive',
          'up',
          '--install-cron',
        ]);
        await runCommand('bash', ['scripts/runtime/harness-boot.sh']);
      },
    },
    {
      id: 'attach-agent',
      label: 'Interactive TNF Agent attach',
      critical: false,
      launches:
        nonInteractive || options.attachAgent === false
          ? ['skipped']
          : ['start TNF Agent operator lane when stdin is a TTY'],
      notes: [
        'Use --no-attach-agent to leave the shell prompt after boot.',
        'Attach is executed by the CLI after the step loop (TTY-gated), not inside this action.',
      ],
      action: async () => {
        // Attach happens after the loop so the receipt can be written first.
      },
    },
  ];

  return steps;
}

export function toBootPlan(steps: BootExecutableStep[]): BootPlanStep[] {
  return steps.map(({ id, label, critical, launches, notes }) => ({
    id,
    label,
    critical,
    launches,
    notes,
  }));
}

export function printBootPlan(
  profile: string,
  steps: BootPlanStep[],
  options?: {
    nonInteractive?: boolean;
    withClaude?: boolean;
    forceOnboard?: boolean;
    requireCore?: boolean;
    autonomous?: boolean;
  }
): void {
  console.log(chalk.bold.cyan(`\nTNF Boot Plan: ${profile}\n`));
  if (options?.nonInteractive) console.log(chalk.dim('Mode: non-interactive'));
  if (options?.withClaude) console.log(chalk.dim('Agents: --with-claude enabled'));
  if (options?.forceOnboard) console.log(chalk.dim('Onboard: --force-onboard enabled'));
  if (options?.requireCore)
    console.log(chalk.dim('Gates: --require-core (factory+health critical)'));
  if (options?.autonomous) console.log(chalk.dim('Continuity: --autonomous (alive + harness)'));
  if (
    options?.nonInteractive ||
    options?.withClaude ||
    options?.forceOnboard ||
    options?.requireCore ||
    options?.autonomous
  ) {
    console.log('');
  }

  for (const [index, step] of steps.entries()) {
    const critical = step.critical ? chalk.red('critical') : chalk.yellow('warning-only');
    console.log(`${index + 1}. ${chalk.bold(step.label)} (${critical})`);
    for (const launch of step.launches) {
      console.log(`   - ${launch}`);
    }
    for (const note of step.notes || []) {
      console.log(chalk.dim(`   note: ${note}`));
    }
  }
  console.log('');
}

export function writeBootReceipt(repoRoot: string, receipt: BootReceipt): string {
  const abs = path.join(repoRoot, BOOT_RECEIPT_REL);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, JSON.stringify(receipt, null, 2));
  return abs;
}

export function getBootReceiptPath(repoRoot: string): string {
  return path.join(repoRoot, BOOT_RECEIPT_REL);
}
