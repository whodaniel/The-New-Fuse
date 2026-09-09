import chalk from 'chalk';
import fs from 'fs';
import os from 'os';
import path from 'path';
import readline from 'readline';

import { PROTOCOL_NETWORK_AGENTS } from './agent-roster.js';

export interface WizardOption<T = string> {
  key: string;
  label: string;
  description?: string;
  value: T;
}

export interface PromptOptions<T = string> {
  title: string;
  subtitle?: string;
  options: WizardOption<T>[];
  allowWriteIn?: boolean;
  writeInPrompt?: string;
  defaultIndex?: number;
}

export type ContextStorageStrategy =
  | 'local-primary'
  | 'google-drive-primary'
  | 'mirrored'
  | 'local-only';

export interface UserContextStorageConfig {
  strategy: ContextStorageStrategy;
  /**
   * Sovereign write-in capture (audit-loop Gate 2): when the operator writes in
   * a custom storage strategy outside the protocol enum, their value is
   * preserved here while `strategy` keeps its safe enum default.
   */
  customStrategy?: string;
  local: {
    root: string;
  };
  googleDrive: {
    enabled: boolean;
    folderId: string | null;
    folderUrl: string | null;
    folderName: string;
  };
  inheritance: {
    coreFleet: 'inherit-user-profile';
    swarm: 'inherit-parent';
    agent: 'inherit-parent';
  };
}

export interface UserProfileConfig {
  profileName: string;
  identityMode: 'cloud' | 'local' | 'sandbox' | 'custom';
  cloudEndpoint?: string;
  agentTopology: 'full-swarm' | 'dual-core' | 'solo' | 'custom';
  customModel?: string;
  workspacePath: string;
  ingestionMode: 'clean-slate' | 'current-repo' | 'vault' | 'custom';
  contextStorage: UserContextStorageConfig;
  initialGoal: string;
  createdAt: string;
  updatedAt: string;
}

/** One user-facing onboarding step from the shared catalog (contract `userFacing.steps`). */
export interface CatalogStep {
  id: string;
  label: string;
  surfaces?: string[];
  when?: string;
  options: Array<{ key: string; label: string; description?: string }>;
  writeIn: boolean;
  writeInPrompt?: string;
}

/** Embedded fallback catalog — used when the repo contract file is unreadable (Gate 3). */
export const EMBEDDED_STEP_CATALOG: CatalogStep[] = [
  {
    id: 'subdirector-authority',
    label: 'Local Subdirector Authority',
    options: [
      { key: 'defaults', label: 'Keep defaults — full autonomy (recommended)' },
      { key: 'restricted', label: 'Enabled, read-only capabilities' },
      { key: 'disabled', label: 'Disabled — approve every action' },
    ],
    writeIn: true,
    writeInPrompt:
      "Enter a comma-separated capability allowlist (e.g. read_file, web_search) or 'disabled'",
  },
  {
    id: 'identity',
    label: 'Identity & Sync Mode',
    options: [
      { key: 'local', label: 'Autonomous Local-First' },
      { key: 'cloud', label: 'Connect to thenewfuse.com (Cloud Sync & Webhook Relay)' },
      { key: 'sandbox', label: 'Air-Gapped Sandbox (Ephemeral Session)' },
    ],
    writeIn: true,
    writeInPrompt: 'Custom handle or self-hosted relay endpoint URL',
  },
  {
    id: 'swarm-topology',
    label: 'Agent Swarm Topology',
    options: [
      { key: 'full-swarm', label: 'Full Autonomous Swarm' },
      { key: 'dual-core', label: 'Dual-Core Specialist (Architect + Implementer)' },
      { key: 'solo', label: 'Solo Fast Assistant' },
    ],
    writeIn: true,
    writeInPrompt: 'Custom LLM tag or model endpoint (e.g. ollama/llama3.3:70b, openrouter/...)',
  },
  {
    id: 'workspace-ingestion',
    label: 'Workspace Scaffolding & Data Ingestion',
    options: [
      { key: 'current-repo', label: 'Current Directory' },
      { key: 'clean-slate', label: 'Scaffold New Workspace' },
      { key: 'vault', label: 'Personal Knowledge Vault / Notes Folder' },
    ],
    writeIn: true,
    writeInPrompt: 'Custom directory path, database URI, or document folder to ingest',
  },
  {
    id: 'context-storage',
    label: 'User Context Storage Strategy',
    options: [
      { key: 'local-primary', label: 'Local Primary + Optional Google Drive Mirror (Recommended)' },
      { key: 'google-drive-primary', label: 'Google Drive Primary + Local Cache' },
      { key: 'mirrored', label: 'Mirrored Local + Google Drive' },
      { key: 'local-only', label: 'Local Only' },
    ],
    writeIn: true,
    writeInPrompt:
      'Describe your custom storage strategy (captured in the profile; enum falls back to local-primary)',
  },
  {
    id: 'first-goal',
    label: 'Turn Zero Mission / First Goal',
    options: [
      { key: 'tour', label: 'Guided Interactive Harness Tour' },
      { key: 'health', label: 'System & Codebase Health Audit (tnf doctor)' },
      { key: 'dev', label: 'Start Active Development Sprint' },
    ],
    writeIn: true,
    writeInPrompt: 'Your own custom initial goal or prompt for the swarm',
  },
];

/**
 * Load the user-facing step catalog from the shared onboarding contract
 * (`data/harness/onboarding-contract.json` → `userFacing.steps`), falling back
 * to the embedded catalog when the file is missing or malformed (Gate 3).
 */
export function loadUserFacingCatalog(repoRoot: string): {
  steps: CatalogStep[];
  source: 'contract' | 'embedded';
} {
  try {
    const contractPath = path.join(repoRoot, 'data', 'harness', 'onboarding-contract.json');
    const contract = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
    const steps = contract?.userFacing?.steps;
    if (Array.isArray(steps) && steps.length > 0) {
      return { steps: steps as CatalogStep[], source: 'contract' };
    }
  } catch {
    // fall through to embedded catalog
  }
  return { steps: EMBEDDED_STEP_CATALOG, source: 'embedded' };
}

/** Handles are file names under ~/.tnf/profiles — enforce a strict safe pattern (Gate 4). */
export function sanitizeHandle(raw: string): string {
  const cleaned = raw
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
  return cleaned || 'operator';
}

/**
 * Interactive prompt that displays multiple choices from protocol capabilities
 * while always enabling a sovereign write-in choice.
 */
export async function promptChoiceWithWriteIn<T = string>(
  prompt: PromptOptions<T>
): Promise<{ value: T | string; isCustom: boolean; rawChoice: string }> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    console.log(chalk.bold.cyan(`\n? ${prompt.title}`));
    if (prompt.subtitle) {
      console.log(chalk.dim(`  ${prompt.subtitle}`));
    }

    const allOptions = [...prompt.options];
    if (prompt.allowWriteIn !== false) {
      allOptions.push({
        key: 'custom',
        label: '✏️  [Custom / Sovereign Write-In]',
        description: prompt.writeInPrompt || 'Enter your own custom value or override...',
        value: '__CUSTOM__' as any,
      });
    }

    allOptions.forEach((opt, idx) => {
      const isDefault = idx === (prompt.defaultIndex ?? 0);
      const marker = isDefault ? chalk.green('❯') : ' ';
      const indexStr = chalk.bold.yellow(`[${idx + 1}]`);
      console.log(` ${marker} ${indexStr} ${chalk.bold(opt.label)}`);
      if (opt.description) {
        console.log(`       ${chalk.dim(opt.description)}`);
      }
    });

    rl.question(
      chalk.cyan(
        `\nSelect [1-${allOptions.length}] (default: ${(prompt.defaultIndex ?? 0) + 1}): `
      ),
      (answer) => {
        const trimmed = answer.trim();
        let selectedIdx = prompt.defaultIndex ?? 0;
        if (trimmed.length > 0) {
          const parsed = parseInt(trimmed, 10);
          if (!isNaN(parsed) && parsed >= 1 && parsed <= allOptions.length) {
            selectedIdx = parsed - 1;
          }
        }

        const selected = allOptions[selectedIdx];
        if (selected.key === 'custom') {
          rl.question(
            chalk.yellow(`\n✏️  ${prompt.writeInPrompt || 'Enter custom value'}: `),
            (customInput) => {
              rl.close();
              resolve({
                value: customInput.trim(),
                isCustom: true,
                rawChoice: 'custom',
              });
            }
          );
        } else {
          rl.close();
          resolve({
            value: selected.value,
            isCustom: false,
            rawChoice: selected.key,
          });
        }
      }
    );
  });
}

export function resolveSubdirectorChoice(customInput: string): {
  autonomyEnabled: boolean;
  capabilities: string[];
} {
  const input = customInput.trim();
  if (/^disabled?$/i.test(input)) {
    return { autonomyEnabled: false, capabilities: [] };
  }
  const capabilities = input
    .split(',')
    .map((c) => c.trim())
    .filter(Boolean);
  if (capabilities.length === 0) {
    // Empty write-in fails closed — absence is not consent (see
    // LocalSubdirectorAuthorityService for the authority contract).
    return { autonomyEnabled: false, capabilities: [] };
  }
  return { autonomyEnabled: true, capabilities };
}

/**
 * First-run authority setup for the local subdirector.
 *
 * The authority contract ships FAIL-CLOSED (LocalSubdirectorAuthorityService):
 * with no config file, autonomy is disabled and every capability is denied,
 * because absence is not consent. That fail-closed default is what made
 * `tnf agents run` refuse every tool call on machines that had never written a
 * config — so this wizard is the documented consent surface that resolves it:
 * the operator is asked once, at first run, and their explicit answer is
 * written to `~/.tnf/local-subdirector.json`.
 *
 * If the config already exists this is a no-op — it never silently re-widens
 * authority someone has narrowed. Grant or revoke later with `tnf authority`.
 *
 * Non-interactive callers (cron, daemons, CI, piped shells) must never block
 * on a prompt, and must never manufacture a consent record: they leave
 * first-run intact so a later interactive run can capture a real answer. The
 * absent-config default is already fail-closed, so skipping the write changes
 * nothing about authorization (Gate 3).
 */
export async function ensureLocalSubdirectorAuthority(repoRoot: string): Promise<void> {
  const { LocalSubdirectorAuthorityService } =
    await import('../services/LocalSubdirectorAuthorityService.js');
  const auth = new LocalSubdirectorAuthorityService(repoRoot);
  if (!auth.isFirstRun()) return;

  if (!process.stdin.isTTY) {
    console.log(
      chalk.dim(
        '[tnf] Local Subdirector authority: no config yet; default is fail-closed ' +
          '(autonomy disabled). Grant explicitly with `tnf authority` or run ' +
          '`tnf onboard --interactive`.'
      )
    );
    return;
  }

  const choice = await promptChoiceWithWriteIn<'grant-full' | 'grant-readonly' | 'keep-disabled'>({
    title: 'Local Subdirector Authority',
    subtitle:
      'The harness ships fail-closed: with no authority config, `tnf-cli-agent` is denied ' +
      'every tool call. Choose what this machine grants (stored in ' +
      '~/.tnf/local-subdirector.json; changeable any time via `tnf authority`).',
    allowWriteIn: true,
    defaultIndex: 0,
    options: [
      {
        key: 'grant-full',
        label: 'Grant full autonomy (recommended for this workstation)',
        description:
          'Autonomy enabled with the "all" capability wildcard. Required for unattended ' +
          'full-auto cycles and scout missions to run at all.',
        value: 'grant-full',
      },
      {
        key: 'grant-readonly',
        label: 'Grant read-only capabilities',
        description:
          'Autonomy enabled but limited to read_file, search_files, web_search and web_fetch. ' +
          'The agent can investigate but not modify or execute.',
        value: 'grant-readonly',
      },
      {
        key: 'keep-disabled',
        label: 'Keep fail-closed disabled',
        description:
          'No autonomous tool use; every call is denied until you grant with `tnf authority`. ' +
          'Unattended loops will stop with an authority error instead of hanging.',
        value: 'keep-disabled',
      },
    ],
    writeInPrompt:
      "Comma-separated capability allowlist (e.g. read_file, web_search) or 'disabled'",
  });

  if (choice.isCustom && typeof choice.value === 'string') {
    const resolved = resolveSubdirectorChoice(choice.value);
    auth.updateConfig({ agentId: 'tnf-cli-agent', ...resolved });
    console.log(
      chalk.dim(
        `  ✏️  Sovereign write-in applied: autonomy ${
          resolved.autonomyEnabled ? 'enabled' : 'disabled'
        }, capabilities: ${resolved.capabilities.join(', ') || 'none (fail-closed)'}`
      )
    );
  } else if (choice.value === 'grant-full') {
    auth.updateConfig({ agentId: 'tnf-cli-agent', autonomyEnabled: true, capabilities: ['all'] });
  } else if (choice.value === 'grant-readonly') {
    auth.updateConfig({
      agentId: 'tnf-cli-agent',
      autonomyEnabled: true,
      capabilities: ['read_file', 'search_files', 'web_search', 'web_fetch'],
    });
  } else {
    auth.updateConfig({ agentId: 'tnf-cli-agent', autonomyEnabled: false, capabilities: [] });
  }

  const saved = auth.getConfig();
  console.log(
    chalk.green(
      `  ✅ Authority saved to ${auth.configLocation()} — ` +
        `autonomy ${saved.autonomyEnabled ? 'enabled' : 'disabled'}, ` +
        `capabilities: ${saved.capabilities.join(', ') || 'none'}`
    )
  );
}

function stepFromCatalog(catalog: CatalogStep[], id: string): CatalogStep {
  return catalog.find((s) => s.id === id) ?? EMBEDDED_STEP_CATALOG.find((s) => s.id === id)!;
}

function printCompletion(profileConfig: UserProfileConfig, selectedWorkspace: string): void {
  console.log(
    chalk.bold.green('\n🎉 Onboarding Complete! Your Personalized TNF Environment Is Configured.')
  );
  console.log(
    chalk.bold.cyan('─────────────────────────────────────────────────────────────────────────')
  );
  console.log(
    `  👤  ${chalk.bold('Profile:')}               ${chalk.yellow(profileConfig.profileName)}`
  );
  console.log(
    `  🚀  ${chalk.bold('Personalized Command:')}   ${chalk.green(`tnf boot ${profileConfig.profileName}`)}`
  );
  console.log(`  📂  ${chalk.bold('Active Workspace:')}       ${chalk.dim(selectedWorkspace)}`);
  console.log(
    `  🤖  ${chalk.bold('Swarm Layout:')}           ${chalk.dim(profileConfig.agentTopology)}`
  );
  console.log(
    `  💾  ${chalk.bold('Context Storage:')}         ${chalk.dim(profileConfig.contextStorage.strategy)}`
  );
  if (profileConfig.contextStorage.customStrategy) {
    console.log(
      `      ${chalk.dim(`custom strategy write-in preserved: ${profileConfig.contextStorage.customStrategy}`)}`
    );
  }
  if (profileConfig.contextStorage.googleDrive.enabled) {
    console.log(
      chalk.yellow(
        '      Google Drive is selected but not yet bound; configure/verify the authorized folder before use.'
      )
    );
  }
  console.log(
    `  🎯  ${chalk.bold('Starting Objective:')}      ${chalk.italic(profileConfig.initialGoal)}`
  );
  console.log(
    chalk.bold.cyan('─────────────────────────────────────────────────────────────────────────\n')
  );
}

/**
 * Multi-save application for the contract `context-storage` step.
 *
 * The user-context-storage subsystem was decommissioned (b289272d3, memory-bank
 * consolidation), so Drive-backed strategies cannot bind here. Rather than
 * silently pretending they work, this helper makes what CAN be honored real:
 *
 *  - local-primary / local-only: single canonical profile save.
 *  - mirrored: a second, independent local save under the historical
 *    user-context root (~/.tnf/user-context/data/<handle>/profile.json) so the
 *    profile survives loss of either location.
 *  - google-drive-primary: local save + an honest pending notice (no fake sync).
 *
 * Returns the saved paths and user-facing notices; never throws for optional
 * copy failures (the canonical save in persistProfile is the authority).
 */
export function applyStorageStrategy(
  profileConfig: UserProfileConfig,
  tnfHome: string = path.join(os.homedir(), '.tnf')
): { saved: string[]; notices: string[] } {
  const handle = sanitizeHandle(profileConfig.profileName);
  const strategy = profileConfig.contextStorage?.strategy ?? 'local-primary';
  const notices: string[] = [];
  const saved: string[] = [];

  if (strategy === 'google-drive-primary') {
    notices.push(
      'Google Drive binding is not available in this build — profile saved locally; re-run onboarding or a future storage bind to mirror it to Drive.'
    );
  }

  if (strategy === 'mirrored') {
    const mirrorRoot = path.join(tnfHome, 'user-context', 'data', handle);
    const mirrorPath = path.join(mirrorRoot, 'profile.json');
    try {
      fs.mkdirSync(mirrorRoot, { recursive: true });
      fs.writeFileSync(mirrorPath, JSON.stringify(profileConfig, null, 2));
      saved.push(mirrorPath);
      notices.push(`Mirrored profile copy saved to ${mirrorPath}`);
    } catch (err) {
      notices.push(
        `Mirror copy failed (check permissions): ${err instanceof Error ? err.message : String(err)} — canonical profile is unaffected.`
      );
    }
  }

  return { saved, notices };
}

async function persistProfile(repoRoot: string, profileConfig: UserProfileConfig): Promise<void> {
  const tnfHome = path.join(os.homedir(), '.tnf');
  const profilesDir = path.join(tnfHome, 'profiles');
  fs.mkdirSync(profilesDir, { recursive: true });
  const profileFilePath = path.join(profilesDir, `${profileConfig.profileName}.json`);
  fs.writeFileSync(profileFilePath, JSON.stringify(profileConfig, null, 2));

  // Multi-save options (user-context storage contract): the chosen strategy
  // determines where additional profile copies land. Drive-backed strategies
  // degrade honestly to local saves until a Drive binding exists.
  const saveReport = applyStorageStrategy(profileConfig, tnfHome);
  for (const line of saveReport.notices) console.log(chalk.dim(`  💾 ${line}`));

  try {
    const { ProfileSessionService } = await import('../services/ProfileSessionService.js');
    const sessions = new ProfileSessionService({ tnfHome });
    sessions.login({
      profile: profileConfig.profileName,
      identityMode: profileConfig.identityMode,
      cloud: profileConfig.identityMode === 'cloud',
      cloudEndpoint: profileConfig.cloudEndpoint,
    });
  } catch (sessionErr) {
    console.log(
      chalk.yellow(
        `  Note: profile session not established (${
          sessionErr instanceof Error ? sessionErr.message : String(sessionErr)
        }). Run: tnf profile login`
      )
    );
  }

  const bootProfilePointer = path.join(repoRoot, '.agent/runtime-state/cli-boot-profile.txt');
  try {
    fs.mkdirSync(path.dirname(bootProfilePointer), { recursive: true });
    fs.writeFileSync(bootProfilePointer, profileConfig.profileName);
  } catch {
    // Non-fatal if running outside git root
  }
}

/**
 * Non-interactive (non-TTY / CI) onboarding: apply documented defaults, write
 * the profile, print exactly what was applied, and exit cleanly (Gate 3).
 */
export async function runNonInteractiveOnboarding(
  repoRoot: string,
  suggestedHandle?: string
): Promise<UserProfileConfig> {
  const osUser = suggestedHandle || process.env.USER || os.userInfo().username || 'operator';
  const profileName = sanitizeHandle(osUser);

  const profileConfig: UserProfileConfig = {
    profileName,
    identityMode: 'local',
    agentTopology: 'full-swarm',
    workspacePath: process.cwd(),
    ingestionMode: 'current-repo',
    contextStorage: {
      strategy: 'local-primary',
      local: { root: `~/.tnf/user-context/data/${profileName}` },
      googleDrive: {
        enabled: false,
        folderId: null,
        folderUrl: null,
        folderName: 'TNF User Context',
      },
      inheritance: {
        coreFleet: 'inherit-user-profile',
        swarm: 'inherit-parent',
        agent: 'inherit-parent',
      },
    },
    initialGoal: 'Guided harness tour deferred — run `tnf onboard --interactive` to personalize.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  console.log(
    chalk.dim(
      '[tnf] Non-interactive onboarding: applied documented defaults ' +
        '(identity=local, topology=full-swarm, ingestion=current-repo, storage=local-primary). ' +
        'Personalize with: tnf onboard --interactive'
    )
  );

  await persistProfile(repoRoot, profileConfig);
  printCompletion(profileConfig, profileConfig.workspacePath);
  return profileConfig;
}

/**
 * Runs the VIP interactive onboarding wizard for first-time or explicit onboarding.
 *
 * Data-driven from the shared user-facing step catalog in
 * `data/harness/onboarding-contract.json` (embedded fallback when unreadable).
 * In non-TTY environments it applies defaults instead of prompting (Gate 3).
 */

export async function runInteractiveOnboardingWizard(
  repoRoot: string,
  suggestedHandle?: string
): Promise<UserProfileConfig> {
  // Gate 3: never block or crash without a TTY.
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    return runNonInteractiveOnboarding(repoRoot, suggestedHandle);
  }

  const { steps: catalog, source: catalogSource } = loadUserFacingCatalog(repoRoot);
  const osUser = suggestedHandle || process.env.USER || os.userInfo().username || 'operator';

  console.log(
    chalk.bold.magenta(
      '\n╔═══════════════════════════════════════════════════════════════════════════╗'
    )
  );
  console.log(
    chalk.bold.magenta(
      '║                     THE NEW FUSE (TNF) HARNESS ONBOARDING                 ║'
    )
  );
  console.log(
    chalk.bold.magenta(
      '║             Self-Synthesizing Kernel & Multi-Agent Swarm Platform         ║'
    )
  );
  console.log(
    chalk.bold.magenta(
      '╚═══════════════════════════════════════════════════════════════════════════╝\n'
    )
  );
  console.log(
    chalk.cyan("Welcome! Let's tailor your local environment, agent swarm, and memory harness.\n")
  );

  // Authority before anything else: every later step assumes the local agent
  // can actually act, and if it cannot, the whole harness degrades silently.
  await ensureLocalSubdirectorAuthority(repoRoot);

  // Step 1: Identity & Authentication Mode (catalog: identity)
  const identity = await promptChoiceWithWriteIn<'cloud' | 'local' | 'sandbox'>({
    title: 'Step 1: Choose Your Identity & Sync Mode',
    subtitle: 'Determine how your agent harness connects with other peers and platforms.',
    options: stepFromCatalog(catalog, 'identity').options.map((o) => ({
      key: o.key,
      label: o.key === 'local' ? `${o.label} (Suggested handle: '${osUser}')` : o.label,
      description:
        o.key === 'local'
          ? 'Runs completely locally with local Redis/bus and local profile state.'
          : o.key === 'cloud'
            ? 'Enables cross-device syncing, web visualizer, and remote swarm coordination.'
            : 'Zero network telemetry, strict read-only execution, memory vanishes on exit.',
      value: o.key as any,
    })),
    defaultIndex: 0,
    writeInPrompt: stepFromCatalog(catalog, 'identity').writeInPrompt,
  });

  let profileName = sanitizeHandle(osUser);
  let cloudEndpoint = 'https://thenewfuse.com';
  if (identity.isCustom) {
    if (typeof identity.value === 'string' && identity.value.startsWith('http')) {
      cloudEndpoint = identity.value;
      profileName = sanitizeHandle(osUser);
    } else {
      profileName = sanitizeHandle((identity.value as string) || osUser);
    }
  }

  // Step 2: Agent Swarm Architecture (catalog: swarm-topology)
  // Gate 1: merge the live protocol roster into the choice description so new
  // agent runtimes surface without editing the wizard.
  const rosterNames = PROTOCOL_NETWORK_AGENTS.map((a) => a.name).join(', ');
  const swarm = await promptChoiceWithWriteIn<'full-swarm' | 'dual-core' | 'solo'>({
    title: 'Step 2: Select Initial Agent Swarm Topology',
    subtitle: 'Configure the active models and orchestration layout for your harness.',
    options: [
      {
        key: 'full-swarm',
        label: 'Full Autonomous Swarm (Gemini + Claude + Codex + Hermes + OpenCode)',
        description:
          'High-reasoning architecture, parallel code generation, and native bus routing.',
        value: 'full-swarm',
      },
      {
        key: 'dual-core',
        label: 'Dual-Core Specialist (Architect + Implementer)',
        description: 'Lean two-agent coordination for rapid feature building and reviews.',
        value: 'dual-core',
      },
      {
        key: 'solo',
        label: 'Solo Fast Assistant (Gemini Flash / Thinking)',
        description: 'Ultra-low latency single-agent interactive REPL.',
        value: 'solo',
      },
    ],
    defaultIndex: 0,
    writeInPrompt:
      'Enter custom LLM tag or model endpoint (e.g. ollama/llama3.3:70b, openrouter/...)',
  });

  // Step 3: Workspace & Personal Data Ingestion (catalog: workspace-ingestion)
  const currentDir = process.cwd();
  const defaultWorkspace = path.join(os.homedir(), 'tnf-workspace');

  const ingestion = await promptChoiceWithWriteIn<'current-repo' | 'clean-slate' | 'vault'>({
    title: 'Step 3: Workspace Scaffolding & Personal Data Ingestion',
    subtitle:
      'Choose what data sources and file context should be indexed into the knowledge base.',
    options: [
      {
        key: 'current-repo',
        label: `Current Directory (${path.basename(currentDir)})`,
        description: 'Indexes active codebase map, git history, and local symbols.',
        value: 'current-repo',
      },
      {
        key: 'clean-slate',
        label: `Scaffold New Workspace (${defaultWorkspace})`,
        description: 'Creates a clean workspace folder with boilerplate agents and configuration.',
        value: 'clean-slate',
      },
      {
        key: 'vault',
        label: 'Personal Knowledge Vault / Notes Folder',
        description:
          'Indexes markdown notes, research documents, and design specs with secret redaction.',
        value: 'vault',
      },
    ],
    defaultIndex: 0,
    writeInPrompt: stepFromCatalog(catalog, 'workspace-ingestion').writeInPrompt,
  });

  let selectedWorkspace = currentDir;
  if (ingestion.rawChoice === 'clean-slate') {
    selectedWorkspace = defaultWorkspace;
    if (!fs.existsSync(selectedWorkspace)) {
      fs.mkdirSync(selectedWorkspace, { recursive: true });
    }
  } else if (ingestion.isCustom && typeof ingestion.value === 'string' && ingestion.value) {
    selectedWorkspace = path.resolve(ingestion.value);
  }

  // Step 4: User Context Storage (catalog: context-storage)
  // Gate 2: write-in enabled. Custom values outside the protocol enum are
  // preserved under customStrategy while `strategy` keeps a safe enum value.
  const VALID_STORAGE_STRATEGIES: ContextStorageStrategy[] = [
    'local-primary',
    'google-drive-primary',
    'mirrored',
    'local-only',
  ];
  const storage = await promptChoiceWithWriteIn<ContextStorageStrategy>({
    title: 'Step 4: Choose Where TNF Stores Your Personal Context',
    subtitle:
      'All agents inherit one TNF profile mapping. Google Drive binding can be authorized after onboarding.',
    options: [
      {
        key: 'local-primary',
        label: 'Local Primary + Optional Google Drive Mirror (Recommended)',
        description:
          'Keeps the authoritative copy local and allows an authorized Drive mirror for cross-agent/cross-device access.',
        value: 'local-primary',
      },
      {
        key: 'google-drive-primary',
        label: 'Google Drive Primary + Local Cache',
        description:
          'Uses a user-authorized Drive folder as durable authority once the Drive binding is verified.',
        value: 'google-drive-primary',
      },
      {
        key: 'mirrored',
        label: 'Mirrored Local + Google Drive',
        description:
          'Treats both as durable replicas and requires explicit conflict receipts when they diverge.',
        value: 'mirrored',
      },
      {
        key: 'local-only',
        label: 'Local Only',
        description: 'Keeps personal context entirely on this machine.',
        value: 'local-only',
      },
    ],
    defaultIndex: 0,
    allowWriteIn: true,
    writeInPrompt: stepFromCatalog(catalog, 'context-storage').writeInPrompt,
  });

  let storageStrategy = storage.value as ContextStorageStrategy;
  let customStrategy: string | undefined;
  if (storage.isCustom && typeof storage.value === 'string' && storage.value) {
    customStrategy = storage.value;
    storageStrategy = 'local-primary';
    console.log(
      chalk.dim(
        '  ✏️  Custom storage strategy captured; enum strategy set to local-primary until the user-context storage mandate lands.'
      )
    );
  } else if (!VALID_STORAGE_STRATEGIES.includes(storageStrategy)) {
    storageStrategy = 'local-primary';
  }

  const contextStorage: UserContextStorageConfig = {
    strategy: storageStrategy,
    ...(customStrategy ? { customStrategy } : {}),
    local: {
      root: `~/.tnf/user-context/data/${profileName}`,
    },
    googleDrive: {
      enabled:
        storageStrategy === 'google-drive-primary' ||
        storageStrategy === 'mirrored' ||
        customStrategy !== undefined,
      folderId: null,
      folderUrl: null,
      folderName: 'TNF User Context',
    },
    inheritance: {
      coreFleet: 'inherit-user-profile',
      swarm: 'inherit-parent',
      agent: 'inherit-parent',
    },
  };

  // Step 5: First Goal & Mission (catalog: first-goal)
  const goal = await promptChoiceWithWriteIn<string>({
    title: 'Step 5: Choose Your Turn Zero Mission / First Goal',
    subtitle: 'What objective should the swarm begin orienting on?',
    options: stepFromCatalog(catalog, 'first-goal').options.map((o) => ({
      key: o.key,
      label: o.label,
      description:
        o.key === 'tour'
          ? 'Explore slash commands, background tasks, and agent delegation step-by-step.'
          : o.key === 'health'
            ? 'Verify ports, Redis, compilers, MCP servers, and security invariants.'
            : 'Begin designing and implementing features in the active workspace.',
      value:
        o.key === 'tour'
          ? 'Take the guided TNF harness tour'
          : o.key === 'health'
            ? 'Run complete system health and security audit'
            : 'Scaffold and develop initial project features',
    })),
    defaultIndex: 0,
    writeInPrompt: stepFromCatalog(catalog, 'first-goal').writeInPrompt,
  });

  const finalGoal = goal.isCustom ? (goal.value as string) : (goal.value as string);

  const profileConfig: UserProfileConfig = {
    profileName,
    identityMode: (identity.rawChoice === 'custom' ? 'custom' : identity.rawChoice) as any,
    cloudEndpoint: identity.rawChoice === 'cloud' ? cloudEndpoint : undefined,
    agentTopology: (swarm.rawChoice === 'custom' ? 'custom' : swarm.rawChoice) as any,
    customModel: swarm.isCustom ? (swarm.value as string) : undefined,
    workspacePath: selectedWorkspace,
    ingestionMode: ingestion.rawChoice as any,
    contextStorage,
    initialGoal: finalGoal,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await persistProfile(repoRoot, profileConfig);

  // Establish authenticated profile session for control-surface boot hydration.
  try {
    const { EcosystemHydrationService } = await import('../services/EcosystemHydrationService.js');
    // Boot: cheap orientation only — never full-universe hydrate.
    new EcosystemHydrationService({
      tnfHome: path.join(os.homedir(), '.tnf'),
      profile: profileName,
      repoRoot,
      requireAuth: true,
    }).orient();
  } catch (orientErr) {
    console.log(
      chalk.yellow(
        `  Note: ecosystem orientation deferred (${
          orientErr instanceof Error ? orientErr.message : String(orientErr)
        })`
      )
    );
  }

  // Also write active boot profile pointer
  const bootProfilePointer = path.join(repoRoot, '.agent/runtime-state/cli-boot-profile.txt');
  try {
    fs.mkdirSync(path.dirname(bootProfilePointer), { recursive: true });
    fs.writeFileSync(bootProfilePointer, profileName);
  } catch {
    // Non-fatal if running outside git root
  }

  console.log(
    chalk.bold.green('\n🎉 Onboarding Complete! Your Personalized TNF Environment Is Configured.')
  );
  console.log(
    chalk.bold.cyan('─────────────────────────────────────────────────────────────────────────')
  );
  console.log(`  👤  ${chalk.bold('Profile:')}               ${chalk.yellow(profileName)}`);
  console.log(
    `  🚀  ${chalk.bold('Personalized Command:')}   ${chalk.green(`tnf boot ${profileName}`)}`
  );
  console.log(`  📂  ${chalk.bold('Active Workspace:')}       ${chalk.dim(selectedWorkspace)}`);
  console.log(
    `  🤖  ${chalk.bold('Swarm Layout:')}           ${chalk.dim(profileConfig.agentTopology)}`
  );
  console.log(
    `  💾  ${chalk.bold('Context Storage:')}         ${chalk.dim(profileConfig.contextStorage.strategy)}`
  );
  if (profileConfig.contextStorage.googleDrive.enabled) {
    console.log(
      chalk.yellow(
        '      Google Drive is selected but not yet bound; configure/verify the authorized folder before use.'
      )
    );
  }
  console.log(
    `  🎯  ${chalk.bold('Starting Objective:')}      ${chalk.italic(profileConfig.initialGoal)}`
  );
  console.log(
    chalk.bold.cyan('─────────────────────────────────────────────────────────────────────────\n')
  );

  return profileConfig;
}
