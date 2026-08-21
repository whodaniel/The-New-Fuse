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

export interface UserProfileConfig {
  profileName: string;
  identityMode: 'cloud' | 'local' | 'sandbox' | 'custom';
  cloudEndpoint?: string;
  agentTopology: 'full-swarm' | 'dual-core' | 'solo' | 'custom';
  customModel?: string;
  workspacePath: string;
  ingestionMode: 'clean-slate' | 'current-repo' | 'vault' | 'custom';
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
      chalk.cyan(`\nSelect [1-${allOptions.length}] (default: ${(prompt.defaultIndex ?? 0) + 1}): `),
      (answer) => {
        const trimmed = answer.trim();
        let selectedIdx = (prompt.defaultIndex ?? 0);
        if (trimmed.length > 0) {
          const parsed = parseInt(trimmed, 10);
          if (!isNaN(parsed) && parsed >= 1 && parsed <= allOptions.length) {
            selectedIdx = parsed - 1;
          }
        }

        const selected = allOptions[selectedIdx];
        if (selected.key === 'custom') {
          rl.question(chalk.yellow(`\n✏️  ${prompt.writeInPrompt || 'Enter custom value'}: `), (customInput) => {
            rl.close();
            resolve({
              value: customInput.trim(),
              isCustom: true,
              rawChoice: 'custom',
            });
          });
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
export async function runInteractiveOnboardingWizard(
  repoRoot: string,
  suggestedHandle?: string
): Promise<UserProfileConfig> {
  const osUser = suggestedHandle || process.env.USER || os.userInfo().username || 'operator';

  console.log(chalk.bold.magenta('\n╔═══════════════════════════════════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta('║                     THE NEW FUSE (TNF) HARNESS ONBOARDING                 ║'));
  console.log(chalk.bold.magenta('║             Self-Synthesizing Kernel & Multi-Agent Swarm Platform         ║'));
  console.log(chalk.bold.magenta('╚═══════════════════════════════════════════════════════════════════════════╝\n'));
  console.log(chalk.cyan('Welcome! Let\'s tailor your local environment, agent swarm, and memory harness.\n'));

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
        description: 'High-reasoning architecture, parallel code generation, and native bus routing.',
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
    writeInPrompt: 'Enter custom LLM tag or model endpoint (e.g. ollama/llama3.3:70b, openrouter/...)',
  });

  // Step 3: Workspace & Personal Data Ingestion
  const currentDir = process.cwd();
  const defaultWorkspace = path.join(os.homedir(), 'tnf-workspace');

  const ingestion = await promptChoiceWithWriteIn<'current-repo' | 'clean-slate' | 'vault'>({
    title: 'Step 3: Workspace Scaffolding & Personal Data Ingestion',
    subtitle: 'Choose what data sources and file context should be indexed into the knowledge base.',
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
        description: 'Indexes markdown notes, research documents, and design specs with secret redaction.',
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

  // Step 4: First Goal & Mission
  const goal = await promptChoiceWithWriteIn<string>({
    title: 'Step 4: Choose Your Turn Zero Mission / First Goal',
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

  // Also write active boot profile pointer
  const bootProfilePointer = path.join(repoRoot, '.agent/runtime-state/cli-boot-profile.txt');
  try {
    fs.mkdirSync(path.dirname(bootProfilePointer), { recursive: true });
    fs.writeFileSync(bootProfilePointer, profileName);
  } catch {
    // Non-fatal if running outside git root
  }

  console.log(chalk.bold.green('\n🎉 Onboarding Complete! Your Personalized TNF Environment Is Configured.'));
  console.log(chalk.bold.cyan('─────────────────────────────────────────────────────────────────────────'));
  console.log(`  👤  ${chalk.bold('Profile:')}               ${chalk.yellow(profileName)}`);
  console.log(`  🚀  ${chalk.bold('Personalized Command:')}   ${chalk.green(`tnf boot ${profileName}`)}`);
  console.log(`  📂  ${chalk.bold('Active Workspace:')}       ${chalk.dim(selectedWorkspace)}`);
  console.log(`  🤖  ${chalk.bold('Swarm Layout:')}           ${chalk.dim(profileConfig.agentTopology)}`);
  console.log(`  🎯  ${chalk.bold('Starting Objective:')}      ${chalk.italic(profileConfig.initialGoal)}`);
  console.log(chalk.bold.cyan('─────────────────────────────────────────────────────────────────────────\n'));

  return profileConfig;
}
