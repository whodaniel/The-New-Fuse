import chalk from 'chalk';
import fs from 'fs';
import os from 'os';
import path from 'path';
import readline from 'readline';

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

/**
 * Runs the VIP interactive onboarding wizard for first-time or explicit onboarding.
 */
/**
 * First-run authority setup for the local subdirector.
 *
 * TNF ships with `tnf-cli-agent` autonomous — that is the operator's intended
 * posture, and it is also load-bearing: without it every tool call in
 * `tnf agents run` is refused, which is precisely the state this machine sat in
 * (no config file, so the disabled fallback applied, so the agent was denied on
 * every call and looped without output).
 *
 * The operator is asked once, at first run, and the answer is written to
 * `~/.tnf/local-subdirector.json`. If the config already exists this is a
 * no-op — it never silently re-widens authority someone has narrowed.
 *
 * Non-interactive callers (cron, daemons, CI, piped shells) must never block on
 * a prompt, so they take the shipped default and print exactly what was applied
 * rather than deciding silently.
 */
export async function ensureLocalSubdirectorAuthority(repoRoot: string): Promise<void> {
  const { LocalSubdirectorAuthorityService, DEFAULT_LOCAL_SUBDIRECTOR_CONFIG } =
    await import('../services/LocalSubdirectorAuthorityService.js');
  const auth = new LocalSubdirectorAuthorityService(repoRoot);
  if (!auth.isFirstRun()) return;

  const shipped = DEFAULT_LOCAL_SUBDIRECTOR_CONFIG;

  if (!process.stdin.isTTY) {
    auth.updateConfig(shipped);
    console.log(
      chalk.dim(
        `[tnf] Local Subdirector authority initialised non-interactively: ` +
          `agent=${shipped.agentId}, autonomy=enabled, capabilities=all. ` +
          `Change with: tnf subdirector autonomy --pause | --revoke <cap>`
      )
    );
    return;
  }

  const choice = await promptChoiceWithWriteIn<'defaults' | 'restricted' | 'disabled'>({
    title: 'Local Subdirector Authority',
    subtitle:
      `Which capabilities may '${shipped.agentId}' exercise on your behalf without asking? ` +
      `Stored in ~/.tnf/local-subdirector.json; changeable any time via ` +
      `'tnf subdirector autonomy'.`,
    allowWriteIn: false,
    defaultIndex: 0,
    options: [
      {
        key: 'defaults',
        label: 'Keep defaults — full autonomy (recommended)',
        description:
          'Autonomy enabled, all capabilities granted. Required for unattended full-auto ' +
          'cycles and scout missions to run at all.',
        value: 'defaults',
      },
      {
        key: 'restricted',
        label: 'Enabled, read-only capabilities',
        description:
          'Autonomy enabled but limited to read_file, search_files, web_search and web_fetch. ' +
          'The agent can investigate but not modify or execute.',
        value: 'restricted',
      },
      {
        key: 'disabled',
        label: 'Disabled — approve every action',
        description:
          'No autonomous tool use. Unattended loops will not be able to act; agent runs will ' +
          'stop with an authority error instead of hanging.',
        value: 'disabled',
      },
    ],
  });

  if (choice.value === 'defaults') {
    auth.updateConfig(shipped);
  } else if (choice.value === 'restricted') {
    auth.updateConfig({
      agentId: shipped.agentId,
      autonomyEnabled: true,
      capabilities: ['read_file', 'search_files', 'web_search', 'web_fetch'],
    });
  } else {
    auth.updateConfig({ agentId: shipped.agentId, autonomyEnabled: false, capabilities: [] });
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

export async function runInteractiveOnboardingWizard(
  repoRoot: string,
  suggestedHandle?: string
): Promise<UserProfileConfig> {
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

  // Step 1: Identity & Authentication Mode
  const identity = await promptChoiceWithWriteIn<'cloud' | 'local' | 'sandbox'>({
    title: 'Step 1: Choose Your Identity & Sync Mode',
    subtitle: 'Determine how your agent harness connects with other peers and platforms.',
    options: [
      {
        key: 'local',
        label: `Autonomous Local-First (Suggested handle: '${osUser}')`,
        description: 'Runs completely locally with local Redis/bus and local profile state.',
        value: 'local',
      },
      {
        key: 'cloud',
        label: 'Connect to thenewfuse.com (Cloud Sync & Webhook Relay)',
        description: 'Enables cross-device syncing, web visualizer, and remote swarm coordination.',
        value: 'cloud',
      },
      {
        key: 'sandbox',
        label: 'Air-Gapped Sandbox (Ephemeral Session)',
        description: 'Zero network telemetry, strict read-only execution, memory vanishes on exit.',
        value: 'sandbox',
      },
    ],
    defaultIndex: 0,
    writeInPrompt: 'Enter your custom handle or self-hosted relay endpoint URL',
  });

  let profileName = osUser;
  let cloudEndpoint = 'https://thenewfuse.com';
  if (identity.isCustom) {
    if (typeof identity.value === 'string' && identity.value.startsWith('http')) {
      cloudEndpoint = identity.value;
      profileName = osUser;
    } else {
      profileName = (identity.value as string) || osUser;
    }
  }

  // Step 2: Agent Swarm Architecture
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

  // Step 3: Workspace & Personal Data Ingestion
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
    writeInPrompt: 'Enter custom directory path, database URI, or document folder to ingest',
  });

  let selectedWorkspace = currentDir;
  if (ingestion.rawChoice === 'clean-slate') {
    selectedWorkspace = defaultWorkspace;
    if (!fs.existsSync(selectedWorkspace)) {
      fs.mkdirSync(selectedWorkspace, { recursive: true });
    }
  } else if (ingestion.isCustom && typeof ingestion.value === 'string') {
    selectedWorkspace = path.resolve(ingestion.value);
  }

  // Step 4: User Context Storage
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
    allowWriteIn: false,
  });

  const storageStrategy = storage.value as ContextStorageStrategy;
  const contextStorage: UserContextStorageConfig = {
    strategy: storageStrategy,
    local: {
      root: `~/.tnf/user-context/data/${profileName}`,
    },
    googleDrive: {
      enabled: storageStrategy === 'google-drive-primary' || storageStrategy === 'mirrored',
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

  // Step 5: First Goal & Mission
  const goal = await promptChoiceWithWriteIn<string>({
    title: 'Step 5: Choose Your Turn Zero Mission / First Goal',
    subtitle: 'What objective should the swarm begin orienting on?',
    options: [
      {
        key: 'tour',
        label: 'Guided Interactive Harness Tour (/goal, /plan, /teamwork)',
        description: 'Explore slash commands, background tasks, and agent delegation step-by-step.',
        value: 'Take the guided TNF harness tour',
      },
      {
        key: 'health',
        label: 'System & Codebase Health Audit (tnf doctor)',
        description: 'Verify ports, Redis, compilers, MCP servers, and security invariants.',
        value: 'Run complete system health and security audit',
      },
      {
        key: 'dev',
        label: 'Start Active Development Sprint',
        description: 'Begin designing and implementing features in the active workspace.',
        value: 'Scaffold and develop initial project features',
      },
    ],
    defaultIndex: 0,
    writeInPrompt: 'Write in your own custom initial goal or prompt for the swarm',
  });

  const finalGoal = goal.isCustom ? (goal.value as string) : (goal.value as string);

  const profileConfig: UserProfileConfig = {
    profileName,
    identityMode: identity.rawChoice as any,
    cloudEndpoint: identity.rawChoice === 'cloud' ? cloudEndpoint : undefined,
    agentTopology: swarm.rawChoice as any,
    customModel: swarm.isCustom ? (swarm.value as string) : undefined,
    workspacePath: selectedWorkspace,
    ingestionMode: ingestion.rawChoice as any,
    contextStorage,
    initialGoal: finalGoal,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Save profile to ~/.tnf/profiles/<profileName>.json
  const tnfHome = path.join(os.homedir(), '.tnf');
  const profilesDir = path.join(tnfHome, 'profiles');
  fs.mkdirSync(profilesDir, { recursive: true });
  const profileFilePath = path.join(profilesDir, `${profileName}.json`);
  fs.writeFileSync(profileFilePath, JSON.stringify(profileConfig, null, 2));

  // Establish authenticated profile session for control-surface boot hydration.
  try {
    const { ProfileSessionService } = await import('../services/ProfileSessionService.js');
    const { EcosystemHydrationService } = await import('../services/EcosystemHydrationService.js');
    const sessions = new ProfileSessionService({ tnfHome });
    sessions.login({
      profile: profileName,
      identityMode: profileConfig.identityMode,
      cloud: profileConfig.identityMode === 'cloud',
      cloudEndpoint: profileConfig.cloudEndpoint,
    });
    try {
      // Boot: cheap orientation only — never full-universe hydrate.
      new EcosystemHydrationService({
        tnfHome,
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
  } catch (sessionErr) {
    console.log(
      chalk.yellow(
        `  Note: profile session not established (${
          sessionErr instanceof Error ? sessionErr.message : String(sessionErr)
        }). Run: tnf profile login`
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
