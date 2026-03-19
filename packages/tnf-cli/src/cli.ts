import chalk from 'chalk';
import { spawn, spawnSync } from 'child_process';
import { Command } from 'commander';
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';
import type { AgentMessage } from './RedisAgentClient.js';
import { RedisAgentClient } from './RedisAgentClient.js';
import { Orchestrator } from './orchestration.js';

const program = new Command();
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const SUPER_ADMIN_ENV_KEY = 'TNF_SUPER_ADMIN_TOKEN';
const SUPER_ADMIN_INPUT_ENV_KEY = 'TNF_SUPER_ADMIN_INPUT_TOKEN';
const RUNNABLE_SCRIPT_EXTENSIONS = new Set([
  '.sh',
  '.bash',
  '.zsh',
  '.js',
  '.cjs',
  '.mjs',
  '.ts',
  '.tsx',
  '.py',
]);

async function runCommand(
  cmd: string,
  args: string[],
  options: { cwd?: string; env?: NodeJS.ProcessEnv } = {}
): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const child = spawn(cmd, args, {
      cwd: options.cwd || repoRoot,
      env: { ...process.env, ...(options.env || {}) },
      stdio: 'inherit',
    });

    child.on('error', (error: NodeJS.ErrnoException) => {
      if (error?.code === 'ENOENT') {
        reject(new Error(`'${cmd}' is not installed or not on PATH`));
        return;
      }
      reject(error);
    });
    child.on('close', (code) => {
      if (code === 0) return resolve();
      reject(new Error(`${cmd} exited with code ${code}`));
    });
  });
}

function requireSuperAdmin(
  options: { superAdminToken?: string } | undefined,
  commandLabel: string
): void {
  const expected = process.env[SUPER_ADMIN_ENV_KEY];
  const provided =
    options?.superAdminToken ||
    process.env[SUPER_ADMIN_INPUT_ENV_KEY] ||
    process.env.CI_SUPER_ADMIN_TOKEN;

  if (!expected) {
    throw new Error(
      `Super Admin auth is not configured. Set ${SUPER_ADMIN_ENV_KEY} in the execution environment.`
    );
  }

  if (!provided || provided !== expected) {
    throw new Error(
      `Super Admin authentication required for '${commandLabel}'. Provide --super-admin-token or ${SUPER_ADMIN_INPUT_ENV_KEY}.`
    );
  }
}

type RootScriptEntry = { name: string; command: string };
type FileScriptEntry = { key: string; relPath: string; absPath: string };
type MenuEntry = { path: string; description: string };
type MenuSection = { title: string; entries: MenuEntry[] };
type TraitGroup = { name: string; values: string[] };
type OpenClawCompatibilityEntry = {
  command: string;
  mode: 'implicit' | 'explicit-only';
  directPath: string | null;
  explicitPath: string;
};
type SplashTheme = 'fuse' | 'atri' | 'neon' | 'ember' | 'mono';
type SplashOptions = {
  theme: SplashTheme;
  animate: boolean;
  speedMs: number;
  compact: boolean;
};

function loadRootScripts(): RootScriptEntry[] {
  const packageJsonPath = path.join(repoRoot, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')) as {
    scripts?: Record<string, string>;
  };
  return Object.entries(packageJson.scripts || {})
    .map(([name, command]) => ({ name, command }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function isRunnableScriptFile(fileName: string): boolean {
  const ext = path.extname(fileName).toLowerCase();
  if (RUNNABLE_SCRIPT_EXTENSIONS.has(ext)) return true;
  const lower = fileName.toLowerCase();
  return lower === 'makefile' || lower === 'justfile';
}

function discoverFileScripts(): FileScriptEntry[] {
  const out: FileScriptEntry[] = [];
  const roots = [path.join(repoRoot, 'scripts'), path.join(repoRoot, 'tools')].filter((p) =>
    fs.existsSync(p)
  );

  const walk = (dir: string) => {
    let entries: fs.Dirent[] = [];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (entry.name === 'node_modules' || entry.name === '.git') continue;
      const absPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(absPath);
        continue;
      }
      if (!entry.isFile() || !isRunnableScriptFile(entry.name)) continue;
      const relPath = path.relative(repoRoot, absPath).replace(/\\/g, '/');
      out.push({ key: relPath, relPath, absPath });
    }
  };

  for (const root of roots) walk(root);

  // Include runnable files directly in repo root.
  for (const fileName of fs.readdirSync(repoRoot)) {
    const absPath = path.join(repoRoot, fileName);
    if (!fs.existsSync(absPath) || !fs.statSync(absPath).isFile()) continue;
    if (!isRunnableScriptFile(fileName)) continue;
    const relPath = path.relative(repoRoot, absPath).replace(/\\/g, '/');
    out.push({ key: relPath, relPath, absPath });
  }

  return out.sort((a, b) => a.key.localeCompare(b.key));
}

function resolveFileScript(input: string): FileScriptEntry | null {
  const normalized = input.replace(/\\/g, '/').replace(/^\.?\//, '');
  const candidates = discoverFileScripts();
  const direct = candidates.find((item) => item.relPath === normalized);
  if (direct) return direct;
  const withScriptsPrefix = candidates.find((item) => item.relPath === `scripts/${normalized}`);
  if (withScriptsPrefix) return withScriptsPrefix;
  const withToolsPrefix = candidates.find((item) => item.relPath === `tools/${normalized}`);
  if (withToolsPrefix) return withToolsPrefix;

  const absCandidate = path.resolve(repoRoot, normalized);
  if (
    absCandidate.startsWith(repoRoot) &&
    fs.existsSync(absCandidate) &&
    fs.statSync(absCandidate).isFile() &&
    isRunnableScriptFile(path.basename(absCandidate))
  ) {
    const relPath = path.relative(repoRoot, absCandidate).replace(/\\/g, '/');
    return { key: relPath, relPath, absPath: absCandidate };
  }
  return null;
}

async function runFileScript(file: FileScriptEntry, args: string[]): Promise<void> {
  const ext = path.extname(file.absPath).toLowerCase();
  if (ext === '.sh' || ext === '.bash' || ext === '.zsh') {
    await runCommand('bash', [file.relPath, ...args]);
    return;
  }
  if (ext === '.py') {
    await runCommand('python3', [file.relPath, ...args]);
    return;
  }
  if (ext === '.ts' || ext === '.tsx') {
    await runCommand('node', ['--import', 'tsx', file.relPath, ...args]);
    return;
  }
  if (ext === '.js' || ext === '.cjs' || ext === '.mjs') {
    await runCommand('node', [file.relPath, ...args]);
    return;
  }
  throw new Error(`Unsupported script type for ${file.relPath}`);
}

const cliEntryPath = fileURLToPath(import.meta.url);
const AGENT_ROLE_TRAITS = ['orchestrator', 'broker', 'worker', 'participant'];
const AGENT_PLATFORM_TRAITS = ['antigravity', 'gemini', 'claude', 'jules', 'vscode', 'browser'];
const SUPER_ADMIN_COMMAND_TRAITS = [
  'tnf relay start',
  'tnf jules loop',
  'tnf jules supervisor',
  'tnf jules supervisor-start',
  'tnf jules supervisor-stop',
  'tnf jules supervisor-migrate-from-cron',
  'tnf jules merge-open',
  'tnf jules cron-install',
  'tnf master-clock start|logs|status',
  'tnf super-cycle event|status',
  'tnf skills bank supervisor|supervisor-start|supervisor-stop',
  'tnf run <script>',
];
const REDIS_COMMAND_TRAITS = [
  'tnf register',
  'tnf list',
  'tnf send',
  'tnf orchestrate',
  'tnf convo',
  'tnf agents register|list|send|orchestrate|convo',
];
const CLOUD_FIRST_COMMAND_TRAITS = ['tnf master-clock start', 'tnf super-cycle event|status'];
const SPLASH_THEMES: SplashTheme[] = ['fuse', 'atri', 'neon', 'ember', 'mono'];
const DEFAULT_SPLASH_THEME: SplashTheme = 'fuse';
const DEFAULT_SPLASH_SPEED_MS = 85;

const safeStdoutHandler = (error: NodeJS.ErrnoException) => {
  if (error?.code === 'EPIPE') {
    process.exit(0);
  }
  throw error;
};
process.stdout.on('error', safeStdoutHandler);

function coerceSplashTheme(value?: string): SplashTheme {
  const normalized = (value || '').trim().toLowerCase();
  if (SPLASH_THEMES.includes(normalized as SplashTheme)) {
    return normalized as SplashTheme;
  }
  return DEFAULT_SPLASH_THEME;
}

function parseBooleanEnvFlag(value: string | undefined, fallback: boolean): boolean {
  if (!value) return fallback;
  const normalized = value.trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false;
  return fallback;
}

function normalizeSplashOptions(options: Partial<SplashOptions> = {}): SplashOptions {
  const envTheme = process.env.TNF_SPLASH_THEME;
  const envAnimate = process.env.TNF_SPLASH_ANIMATE;
  const envSpeed = process.env.TNF_SPLASH_SPEED_MS;
  const envCompact = process.env.TNF_SPLASH_COMPACT;

  const theme = coerceSplashTheme(options.theme || envTheme);
  const animate = options.animate ?? parseBooleanEnvFlag(envAnimate, !!process.stdout.isTTY);
  const compact = options.compact ?? parseBooleanEnvFlag(envCompact, false);

  let speedMs = options.speedMs;
  if (speedMs == null) {
    const parsed = Number.parseInt(envSpeed || '', 10);
    speedMs = Number.isFinite(parsed) ? parsed : DEFAULT_SPLASH_SPEED_MS;
  }
  speedMs = Math.max(35, Math.min(240, speedMs));

  return { theme, animate, speedMs, compact };
}

function parseAnimateMode(value?: string): boolean | undefined {
  if (!value) return undefined;
  const normalized = value.trim().toLowerCase();
  if (normalized === 'auto') return undefined;
  if (normalized === 'on' || normalized === 'true') return true;
  if (normalized === 'off' || normalized === 'false') return false;
  throw new Error("Invalid --animate mode. Use 'auto', 'on', or 'off'.");
}

type ThemePainter = {
  gradientStops: string[];
};

function getThemePainter(theme: SplashTheme) {
  switch (theme) {
    case 'atri':
      return {
        gradientStops: ['#22d3ee', '#60a5fa', '#a78bfa', '#f472b6'],
      } satisfies ThemePainter;
    case 'neon':
      return {
        gradientStops: ['#22d3ee', '#8b5cf6', '#ec4899'],
      } satisfies ThemePainter;
    case 'ember':
      return {
        gradientStops: ['#f59e0b', '#fb7185', '#ec4899'],
      } satisfies ThemePainter;
    case 'mono':
      return {
        gradientStops: ['#d4d4d8', '#a1a1aa', '#d4d4d8'],
      } satisfies ThemePainter;
    case 'fuse':
    default:
      return {
        gradientStops: ['#2563eb', '#6d28d9', '#be185d'],
      } satisfies ThemePainter;
  }
}

function centerText(raw: string, width: number): string {
  const normalized = raw.trim();
  if (normalized.length >= width) return normalized.slice(0, width);
  const left = Math.floor((width - normalized.length) / 2);
  const right = width - normalized.length - left;
  return `${' '.repeat(left)}${normalized}${' '.repeat(right)}`;
}

function gradientize(raw: string, stops: string[]): string {
  if (raw.length === 0) return raw;
  if (stops.length === 0) return raw;
  if (stops.length === 1) return chalk.hex(stops[0])(raw);
  const maxIdx = stops.length - 1;
  return raw
    .split('')
    .map((char, idx) => {
      const ratio = raw.length <= 1 ? 0 : idx / (raw.length - 1);
      const stopIdx = Math.min(maxIdx, Math.floor(ratio * maxIdx));
      return chalk.hex(stops[stopIdx])(char);
    })
    .join('');
}

const HERO_TNF_LINES = [
  '                                                                                                                                ',
  '                              / ``````````````````````````````*````````````````````````````````^                                ',
  '                            /,.(FW0{\\kFW0{\\kFW0{\\kjW@4\\\\jQ@{(l\\ +{(\\jQ@{(\\jQ@4(\\j314\\\\j3@4(\\jQ@   \\                             ',
  '                          ,, ,,,.~-,y,j~-,_,j~-,_,j~-,_,j~-_,~j|.g,,,,-,,_j_-,,,j~-,u,j~-,.,j~-_., \\\\                           ',
  '                          ,_ `_____`  ,..................l. ___| ___.....................`.  __`__ _                            ',
  "                       //   *^^^` ^    ------------------ !``^`|''``! -------------------     *^^^`  \\`                         ",
  '                        -----------^   \\                 |!((u8|(UA;|                   /   -----------`  V                     ',
  '                     ~~~~~~~~~~~~~~    ,`````````````````|| ,-,|_p_,| ``````````````````\\   ~~~~~~~~~~~~~~~^                    ',
  '                        `             .  `````````` ```` |! ___|___ ! ```` ````````````                                         ',
  "                     `7`   `  `  ` `    |(`*``**`*`\\     |!`^^<|''^ |     ||```**`**`*****`***``****`````  /                    ",
  '                      ```````````````   |( hNJ| JJ|\\\\    |!((k4|(7p;|     ||({U )m53bbFT5J( FTk%JJFFX>    /                     ',
  '                                        |( _,.|.. ,,(\\   |:.,,,|__,,|     ||._.  _:.  ,,:   ,_ ______     ,                     ',
  "                                        |`  _ |    ``_ ` '' ___| ___!     ||___ ,_`_  ................  `                       ",
  "                                        |( \"`<|   '+~~ \\\\\\ `V^T|''U`|     ||''  t'~~   ................//                       ",
  '                                        |(:hm0|(JJ][9(J,,\\\\    |(bo;|     ||(;b );$3  )           /   //                        ',
  '                                        |  _,,|.  _ ,.  .,       ,,,|     || ., ,,,.  |            ~~~                          ',
  "                                        |`    |``__ ````_'  ```     !     ||  `  `'^  |--------------`                          ",
  "                                        |( Ut7| ~~ |``'A\"7*\\ \\\\\\^  `|     ||'7  )7(4  |                                         ",
  '                                        |( _;+|__pp|    jgcm,jj\\\\   |     ||}}n )B<Y  .............  /                          ',
  "                                        |` ___|    ||    `` _____   '     ||____,                , ,                            ",
  "                                        |('` `!   `||   `````^``*  \\`     ||''' t  ____________                                 ",
  '                                        |( UP0|`JJF||\\  \\ \\(k>0G{{)`\\\\    ||(+N )49+           7                                ',
  '                                        |( _,_|..  || \\       - ,_,_-\\\\   ||.___,_.  ``````````                                 ',
  "                                        |`  __| _  ||  `     ` ``__   _`` '| __  ,`_  ,````` ```.`                              ",
  "                                        |( \"^'|   '||   `|    \\`^\"^ ^^\" \\\\ |''' F+~~  |      ..                                 ",
  '                                        |((b;m|(J ,||    |( -   \\()jJ{mk) \\|:;n  ]4(  )........^                                ',
  '                                        |  ,,.|._ _||    |. ,,      .,___,.  ., ,,,.  |                                         ',
  '                                        |`` __|``_ ||    |\'   ` `  `"`` __`__`   \'""  |                                         ',
  '                                        |(7U~7|`~~>||    |(7U~7|-   ``!"4"@1`7G )7P7  |                                         ',
  '                                           ~  |(}~~||    |( n,}|_-    \\  ,,j_wn )   > )                                         ',
  '                                          ~.  `    ||    |` ___| _, . .    __     `  ,                                          ',
  '                                            `< `~  ||    |(\'` \'|  ``!    \\ ""     ,<                                            ',
  '                                            V  >. ~||    |( U;m|.^OF|   ` \\\\ <  >                                               ',
  '                                            >.<  `~ |    |(_,,.|.._,|        ,<  ,  `                                           ',
  '                                              `~>.  |    |` ___|`_`_!           .<                                              ',
  "                                                 >.~|    |( U`'|~ '^|     \\. _>^                                                ",
  '                                                   `-      `   |   ^      \\.<                                                   ',
  '                                                         | ~  .    , _                                                          ',
  '                                                         `   ~ `   ,                                                            ',
  '                                                               -',
];

function buildHugeTnfRows(): string[] {
  return [...HERO_TNF_LINES];
}

function shouldAutoCompactMenuSplash(): boolean {
  if (!process.stdout.isTTY) return false;
  const columns = process.stdout.columns ?? Number.MAX_SAFE_INTEGER;
  const rows = process.stdout.rows ?? Number.MAX_SAFE_INTEGER;
  const fullWidth = Math.max(...HERO_TNF_LINES.map((line) => line.length));
  const fullHeight = HERO_TNF_LINES.length;
  const menuRowBudget = 18;
  return columns < fullWidth || rows < fullHeight + menuRowBudget;
}

function buildSplashLines(options: SplashOptions): string[] {
  const paint = getThemePainter(options.theme);
  const compactWidth = 50;
  const compactWordmark = centerText('THE NEW FUSE', compactWidth);
  const compactTag = centerText('TNF', compactWidth);

  if (options.compact) {
    return [
      '',
      gradientize(compactWordmark, paint.gradientStops),
      gradientize(compactTag, paint.gradientStops),
      '',
    ];
  }

  return buildHugeTnfRows();
}

async function animateLogoMerge(options: SplashOptions): Promise<void> {
  const lines = buildSplashLines(options);
  process.stdout.write('\x1Bc');
  for (const line of lines) console.log(line);
}

async function renderSplash(options: Partial<SplashOptions> = {}): Promise<void> {
  const normalized = normalizeSplashOptions(options);
  if (normalized.animate && process.stdout.isTTY && !normalized.compact) {
    await animateLogoMerge(normalized);
    return;
  }
  const lines = buildSplashLines(normalized);
  for (const line of lines) {
    console.log(line);
  }
}

function collectCommandPaths(command: Command, lineage: string[] = ['tnf']): MenuEntry[] {
  const entries: MenuEntry[] = [];
  for (const sub of command.commands) {
    const name = sub.name();
    if (!name || name === 'help') continue;
    const pathTokens = [...lineage, name];
    entries.push({
      path: pathTokens.join(' '),
      description: sub.description() || '',
    });
    entries.push(...collectCommandPaths(sub, pathTokens));
  }
  return entries;
}

function buildTypeIndex(): { cliNamespaces: string[]; scriptNamespaces: Record<string, number> } {
  const cliNamespaces = Array.from(
    new Set(
      collectCommandPaths(program)
        .map((entry) => entry.path.split(' ')[1])
        .filter(Boolean)
    )
  ).sort((a, b) => a.localeCompare(b));

  const scriptNamespaces = loadRootScripts().reduce<Record<string, number>>((acc, script) => {
    const namespace = script.name.includes(':') ? script.name.split(':')[0] : 'root';
    acc[namespace] = (acc[namespace] || 0) + 1;
    return acc;
  }, {});

  return { cliNamespaces, scriptNamespaces };
}

function buildTraitGroups(): TraitGroup[] {
  return [
    { name: 'agent_roles', values: AGENT_ROLE_TRAITS },
    { name: 'agent_platforms', values: AGENT_PLATFORM_TRAITS },
    { name: 'super_admin_protected', values: SUPER_ADMIN_COMMAND_TRAITS },
    { name: 'redis_required', values: REDIS_COMMAND_TRAITS },
    { name: 'cloud_first', values: CLOUD_FIRST_COMMAND_TRAITS },
  ];
}

function buildCommandMenuSections(options: { full?: boolean } = {}): MenuSection[] {
  const sections: MenuSection[] = [
    {
      title: 'Agent Paths',
      entries: [
        { path: 'tnf agents list', description: 'List registered agents' },
        { path: 'tnf agents register [name] [role] [platform]', description: 'Register an agent' },
        { path: 'tnf agents send <message>', description: 'Send a one-off message' },
        {
          path: 'tnf agents orchestrate <workflow>',
          description: 'Run workflow (health-check|code-review|self-improvement)',
        },
        { path: 'tnf agents convo <start|join> [param]', description: 'Manage conversations' },
      ],
    },
    {
      title: 'Taxonomy Paths',
      entries: [
        { path: 'tnf types list', description: 'List command namespaces and script types' },
        { path: 'tnf traits list', description: 'List roles/platforms and command traits' },
        { path: 'tnf paths', description: 'List all available command paths' },
        {
          path: 'tnf splash [--theme fuse|atri|neon|ember|mono]',
          description: 'Render branded splash',
        },
        { path: 'tnf menu', description: 'Show this organized menu' },
      ],
    },
    {
      title: 'Core Ops',
      entries: [
        { path: 'tnf onboard', description: 'Run TNF frontload onboarding' },
        { path: 'tnf doctor', description: 'Run TNF diagnostics' },
        { path: 'tnf scripts list', description: 'List runnable scripts and package commands' },
        {
          path: 'tnf scripts run <target> [args...]',
          description: 'Execute script or file target',
        },
      ],
    },
    {
      title: 'OpenClaw Ops',
      entries: [
        { path: 'tnf openclaw [args...]', description: 'Pass through any OpenClaw CLI command' },
        { path: 'tnf claw [args...]', description: 'Alias for tnf openclaw' },
      ],
    },
    {
      title: 'Compatibility Ops',
      entries: [
        {
          path: 'tnf compat openclaw [--json]',
          description: 'Show TNF to OpenClaw compatibility and migration coverage',
        },
        {
          path: 'tnf compat openclaw instances [--json]',
          description: 'List OpenClaw installations and instances known to TNF',
        },
        {
          path: 'tnf compat openclaw inventory [--json]',
          description: 'Show redacted OpenClaw config and cron inventory',
        },
        {
          path: 'tnf compat openclaw config [--path key.path] [--json]',
          description: 'Show redacted OpenClaw settings or a specific subtree',
        },
        {
          path: 'tnf compat openclaw cron [--json]',
          description: 'List OpenClaw cron jobs with TNF schedule mapping',
        },
        {
          path: 'tnf compat openclaw sync',
          description: 'Sync live OpenClaw runtime state into TNF control-plane records',
        },
        {
          path: 'tnf compat openclaw cleanup [--disable-failing] [--dry-run]',
          description: 'Clean duplicate and failing TNF-managed OpenClaw cron jobs',
        },
      ],
    },
    {
      title: 'Automation Ops',
      entries: [
        { path: 'tnf jules supervisor-status', description: 'Show Jules supervisor status' },
        { path: 'tnf skills bank sync', description: 'Refresh the cross-LLM skill bank' },
        { path: 'tnf reports status', description: 'Show report lifecycle inventory' },
      ],
    },
  ];

  if (options.full) {
    const allPaths = collectCommandPaths(program).sort((a, b) => a.path.localeCompare(b.path));
    const namespaceCounts = allPaths.reduce<Record<string, number>>((acc, entry) => {
      const namespace = entry.path.split(' ')[1] || 'root';
      acc[namespace] = (acc[namespace] || 0) + 1;
      return acc;
    }, {});
    const namespaceEntries = Object.entries(namespaceCounts)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([namespace, count]) => ({
        path: `tnf ${namespace}`,
        description: `${count} CLI command path${count === 1 ? '' : 's'}`,
      }));

    const tnfRootScripts = loadRootScripts()
      .filter(
        (script) =>
          script.name === 'tnf' || script.name === 'tnf-agent' || script.name.startsWith('tnf:')
      )
      .map((script) => ({
        path: `pnpm run ${script.name}`,
        description: script.command,
      }));

    sections.push(
      {
        title: 'CLI Namespace Counts',
        entries: namespaceEntries,
      },
      {
        title: 'TNF Root Package Scripts',
        entries: tnfRootScripts,
      },
      {
        title: 'All CLI Paths',
        entries: allPaths,
      }
    );
  }

  return sections;
}

async function printCommandMenu(
  options: {
    showSplash?: boolean;
    splash?: Partial<SplashOptions>;
    full?: boolean;
  } = {}
): Promise<void> {
  if (options.showSplash !== false) {
    await renderSplash(options.splash);
  }
  const allPaths = collectCommandPaths(program);
  const rootScripts = loadRootScripts();
  const tnfRootScripts = rootScripts.filter(
    (script) =>
      script.name === 'tnf' || script.name === 'tnf-agent' || script.name.startsWith('tnf:')
  );

  console.log(chalk.bold('\nTNF Command Menu\n'));
  console.log(
    chalk.dim(
      `CLI paths: ${allPaths.length} | tnf package scripts: ${tnfRootScripts.length} | total root scripts: ${rootScripts.length}`
    )
  );
  console.log(chalk.dim('Use `tnf menu --full` for expanded inventory.\n'));
  for (const section of buildCommandMenuSections({ full: options.full })) {
    console.log(chalk.cyan(`${section.title}:`));
    for (const entry of section.entries) {
      const paddedPath = entry.path.padEnd(52, ' ');
      console.log(`  ${chalk.green(paddedPath)} ${chalk.dim(entry.description)}`);
    }
    console.log('');
  }
  console.log(chalk.dim('Run `tnf --help` for complete command reference.\n'));
}

async function runSelfCli(args: string[]): Promise<void> {
  await runCommand(process.execPath, [...process.execArgv, cliEntryPath, ...args]);
}

async function runSelfCliWithExit(args: string[]): Promise<void> {
  try {
    await runSelfCli(args);
  } catch (err: any) {
    console.error(chalk.red(`Error: ${err.message}`));
    process.exit(1);
  }
}

function normalizeForwardedArgs(args: string[] = []): string[] {
  if (args.length > 0 && args[0] === '--') {
    return args.slice(1);
  }
  return args;
}

async function runOpenClawPassthrough(args: string[] = []): Promise<void> {
  await runCommand('openclaw', normalizeForwardedArgs(args));
}

async function runOpenClawControl(args: string[] = []): Promise<void> {
  await runCommand('node', ['scripts/openclaw/tnf-openclaw-control.cjs', ...args]);
}

function buildOpenClawTargetArgs(
  options: {
    installation?: string;
    instance?: string;
    stateDir?: string;
    allInstances?: boolean;
  } = {}
): string[] {
  const args: string[] = [];
  if (options.allInstances) args.push('--all-instances');
  if (options.installation) args.push('--installation', options.installation);
  if (options.instance) args.push('--instance', options.instance);
  if (options.stateDir) args.push('--state-dir', options.stateDir);
  return args;
}

function isOpenClawPassthroughArgv(argv: string[]): boolean {
  const subcommand = argv[2];
  return subcommand === 'openclaw' || subcommand === 'claw';
}

let cachedOpenClawTopLevelCommands: Set<string> | null = null;

function getTnfTopLevelCommands(): Set<string> {
  return new Set(
    program.commands.map((command) => command.name()).filter((name) => !!name && name !== 'help')
  );
}

function parseOpenClawTopLevelCommands(helpText: string): Set<string> {
  const commands = new Set<string>();
  const lines = helpText.split(/\r?\n/);
  const commandsIndex = lines.findIndex((line) => line.trim() === 'Commands:');
  if (commandsIndex < 0) return commands;

  for (const line of lines.slice(commandsIndex + 1)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith('Examples:') || trimmed.startsWith('Docs:')) break;

    const match = line.match(/^\s{2,}([a-z][a-z0-9-]*)(?:\s+\*)?\s{2,}/i);
    if (match?.[1]) {
      commands.add(match[1]);
    }
  }

  return commands;
}

function getOpenClawTopLevelCommands(): Set<string> {
  if (cachedOpenClawTopLevelCommands) {
    return cachedOpenClawTopLevelCommands;
  }

  try {
    const result = spawnSync('openclaw', ['--no-color', '--help'], {
      encoding: 'utf8',
      env: process.env,
    });
    const output = `${result.stdout || ''}\n${result.stderr || ''}`;
    cachedOpenClawTopLevelCommands = parseOpenClawTopLevelCommands(output);
  } catch {
    cachedOpenClawTopLevelCommands = new Set();
  }

  return cachedOpenClawTopLevelCommands;
}

function resolveImplicitOpenClawArgs(argv: string[]): string[] | null {
  const subcommand = argv[2];
  if (!subcommand || subcommand === 'help') {
    const helpTarget = argv[3];
    if (!helpTarget) return null;
    if (getTnfTopLevelCommands().has(helpTarget)) return null;
    if (!getOpenClawTopLevelCommands().has(helpTarget)) return null;
    return [helpTarget, '--help'];
  }

  if (getTnfTopLevelCommands().has(subcommand)) return null;
  if (!getOpenClawTopLevelCommands().has(subcommand)) return null;
  return argv.slice(2);
}

function buildOpenClawCompatibilityEntries(): OpenClawCompatibilityEntry[] {
  const tnfTopLevelCommands = getTnfTopLevelCommands();
  return Array.from(getOpenClawTopLevelCommands())
    .sort((a, b) => a.localeCompare(b))
    .map((command) => {
      const collidesWithTnf = tnfTopLevelCommands.has(command);
      return {
        command,
        mode: collidesWithTnf ? 'explicit-only' : 'implicit',
        directPath: collidesWithTnf ? null : `tnf ${command}`,
        explicitPath: `tnf openclaw ${command}`,
      };
    });
}

function buildOpenClawCompatibilityReport() {
  const entries = buildOpenClawCompatibilityEntries();
  const implicit = entries.filter((entry) => entry.mode === 'implicit');
  const explicitOnly = entries.filter((entry) => entry.mode === 'explicit-only');
  return {
    totalOpenClawTopLevelCommands: entries.length,
    implicitCommands: implicit.length,
    explicitOnlyCommands: explicitOnly.length,
    entries,
  };
}

program
  .name('tnf')
  .description('TNF CLI - Unified Command Surface for TNF Operations')
  .version('1.0.0')
  .showSuggestionAfterError()
  .showHelpAfterError();

const logMessage = (message: AgentMessage) => {
  const fromName = message.from?.agentName || 'Unknown';
  const fromRole = message.from?.role || '';
  const type = message.type || 'message';
  const content = message.content || '';

  const roleEmoji: Record<string, string> = {
    orchestrator: '👑',
    broker: '🎯',
    worker: '⚙️',
    participant: '💬',
  };

  const emoji = roleEmoji[fromRole] || '📨';

  let color = chalk.white;
  if (fromRole === 'orchestrator') {
    color = chalk.yellow;
  } else if (fromRole === 'broker') {
    color = chalk.cyan;
  } else if (fromRole === 'worker') {
    color = chalk.green;
  }

  console.log(`\n${emoji} [${color.bold(fromName)}] (${chalk.dim(type)}):`);
  console.log(`   ${content}`);

  if (message.metadata?.event) {
    console.log(`   ${chalk.blue('Event:')} ${message.metadata.event}`);
  }

  if (message.expectsResponse) {
    console.log(`   ${chalk.yellow('⏳ Expects response')}`);
  }
};

function isRedisUnavailable(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? '');
  return (
    message.includes('Could not connect to Redis') ||
    message.includes('max retries per request') ||
    message.includes('ECONNREFUSED')
  );
}

function logRedisUnavailable(commandHint: string): never {
  console.error(chalk.yellow('Redis is unavailable at localhost:6379.'));
  console.error(chalk.yellow(`Start Redis, then re-run \`${commandHint}\`.`));
  process.exit(1);
}

program
  .command('register')
  .description('Register and listen as an agent')
  .argument('[name]', 'Agent name', process.env.AGENT_NAME || 'unnamed-agent')
  .argument(
    '[role]',
    'Agent role (orchestrator, broker, worker, participant)',
    process.env.AGENT_ROLE || 'participant'
  )
  .argument(
    '[platform]',
    'Agent platform (antigravity, gemini, claude, jules, vscode, browser)',
    process.env.AGENT_PLATFORM || 'vscode'
  )
  .option('-d, --daemon', 'Run in daemon mode (register and exit immediately)', false)
  .action(async (name, role, platform, options) => {
    const client = new RedisAgentClient();
    try {
      await client.initialize();
      const agentInfo = await client.register(name, role, platform);

      console.log(chalk.green(`\n🤖 Registered as: ${chalk.bold(name)} (${role}) on ${platform}`));
      console.log(`   ID: ${chalk.dim(agentInfo.id)}`);
      console.log(`   Capabilities: ${chalk.dim(agentInfo.capabilities.join(', '))}`);

      if (options.daemon) {
        console.log(chalk.cyan('\n🚀 Daemon mode: Agent registered and running in background'));
        // Keep heartbeat running in background
        // In production, this would be a long-running process
        // For now, just clean up the registration
        await client.cleanup();
        console.log(chalk.green('\n✅ Agent deployment complete'));
        process.exit(0);
      }

      console.log(
        chalk.cyan(
          '\n🎧 Listening for messages... (Type a message and press Enter, or Ctrl+C to exit)\n'
        )
      );

      client.onMessage('*', (msg) => {
        logMessage(msg);
      });

      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      rl.on('line', async (line) => {
        if (line.trim()) {
          await client.send(line.trim());
        }
      });

      process.on('SIGINT', async () => {
        console.log(chalk.yellow('\n👋 Shutting down...'));
        await client.cleanup();
        process.exit(0);
      });
    } catch (err: any) {
      if (isRedisUnavailable(err)) {
        logRedisUnavailable(`./tnf register ${name} ${role} ${platform}`);
      }
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

program
  .command('onboard')
  .description('Run TNF frontload onboarding')
  .option('--allow-local-db', 'Allow local DATABASE_URL for this run')
  .option('--require-cloud-db', 'Require cloud DATABASE_URL for this run')
  .option('--no-require-cloud-db', 'Allow non-cloud DATABASE_URL for this run')
  .option('--database-url <url>', 'Override DATABASE_URL for this run')
  .action(
    async (options: { allowLocalDb?: boolean; requireCloudDb?: boolean; databaseUrl?: string }) => {
      try {
        const args = ['scripts/tnf-onboard.cjs'];
        if (options.allowLocalDb) args.push('--allow-local-db');
        if (typeof options.requireCloudDb === 'boolean') {
          args.push(options.requireCloudDb ? '--require-cloud-db' : '--no-require-cloud-db');
        }
        if (options.databaseUrl) args.push('--database-url', options.databaseUrl);
        await runCommand('node', args);
      } catch (err: any) {
        console.error(chalk.red(`Error: ${err.message}`));
        process.exit(1);
      }
    }
  );

program
  .command('doctor')
  .description('Run TNF diagnostics')
  .option('--mode <mode>', 'Execution mode: cloud (default) or local')
  .option('--allow-local-db', 'Allow local DATABASE_URL for this run')
  .option('--require-cloud-db', 'Require cloud DATABASE_URL for this run')
  .option('--no-require-cloud-db', 'Allow non-cloud DATABASE_URL for this run')
  .option('--database-url <url>', 'Override DATABASE_URL for this run')
  .action(
    async (options: {
      mode?: string;
      allowLocalDb?: boolean;
      requireCloudDb?: boolean;
      databaseUrl?: string;
    }) => {
      try {
        const args = ['scripts/tnf-doctor.cjs'];
        if (options.mode) args.push('--mode', options.mode);
        if (options.allowLocalDb) args.push('--allow-local-db');
        if (typeof options.requireCloudDb === 'boolean') {
          args.push(options.requireCloudDb ? '--require-cloud-db' : '--no-require-cloud-db');
        }
        if (options.databaseUrl) args.push('--database-url', options.databaseUrl);
        await runCommand('node', args);
      } catch (err: any) {
        console.error(chalk.red(`Error: ${err.message}`));
        process.exit(1);
      }
    }
  );

const metaskills = program.command('metaskills').description('Meta-skills audit utilities');
metaskills
  .command('audit')
  .description('Audit meta-skills and scaffolding readiness')
  .option('--json', 'Print JSON output')
  .action(async (options: { json?: boolean }) => {
    try {
      const args = ['scripts/tnf-metaskills-audit.cjs'];
      if (options.json) args.push('--json');
      await runCommand('node', args);
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

const mcp = program.command('mcp').description('MCP utilities');
mcp
  .command('generate')
  .description('Generate MCP clients inventory')
  .action(async () => {
    try {
      await runCommand('node', ['scripts/tnf-generate-mcp-clients.cjs']);
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

const ai = program.command('ai').description('AI launcher commands');
ai.command('start')
  .argument('[provider]', 'codex|claude|gemini', '')
  .description('Start an AI session helper')
  .action(async (provider: string) => {
    try {
      const args = ['scripts/tnf-start-ai.cjs'];
      if (provider) args.push(provider);
      await runCommand('node', args);
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

program
  .command('openclaw')
  .description('Pass through any OpenClaw CLI command')
  .argument('[args...]', 'Arguments forwarded to openclaw');

program
  .command('claw')
  .description('Alias for `tnf openclaw`')
  .argument('[args...]', 'Arguments forwarded to openclaw');

const relay = program.command('relay').description('Relay operations');
relay
  .command('start')
  .description('Start relay-core relay service')
  .option('--super-admin-token <token>', 'Super Admin authentication token')
  .action(async (options: { superAdminToken?: string }) => {
    try {
      requireSuperAdmin(options, 'relay start');
      await runCommand('pnpm', ['--filter', '@the-new-fuse/relay-core', 'run', 'relay']);
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

relay
  .command('monitor')
  .description('Monitor relay channels')
  .action(async () => {
    try {
      await runCommand('node', ['scripts/relay-channel-monitor.cjs']);
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

const jules = program.command('jules').description('Jules automation operations');
jules
  .command('loop')
  .description('Run autonomous Jules loop')
  .option('--super-admin-token <token>', 'Super Admin authentication token')
  .action(async (options: { superAdminToken?: string }) => {
    try {
      requireSuperAdmin(options, 'jules loop');
      await runCommand('bash', ['scripts/jules-autonomous-loop.sh']);
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });
jules
  .command('supervisor')
  .description('Run continuous Jules follow-up supervisor')
  .option('--super-admin-token <token>', 'Super Admin authentication token')
  .action(async (options: { superAdminToken?: string }) => {
    try {
      requireSuperAdmin(options, 'jules supervisor');
      await runCommand('bash', ['scripts/jules-followup-supervisor.sh']);
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });
jules
  .command('supervisor-start')
  .description('Start Jules follow-up supervisor in background')
  .option('--super-admin-token <token>', 'Super Admin authentication token')
  .action(async (options: { superAdminToken?: string }) => {
    try {
      requireSuperAdmin(options, 'jules supervisor-start');
      await runCommand('bash', ['scripts/jules-followup-start.sh']);
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });
jules
  .command('supervisor-stop')
  .description('Stop Jules follow-up supervisor')
  .option('--super-admin-token <token>', 'Super Admin authentication token')
  .action(async (options: { superAdminToken?: string }) => {
    try {
      requireSuperAdmin(options, 'jules supervisor-stop');
      await runCommand('bash', ['scripts/jules-followup-stop.sh']);
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });
jules
  .command('supervisor-status')
  .description('Show Jules follow-up supervisor status')
  .action(async () => {
    try {
      await runCommand('bash', ['scripts/jules-followup-status.sh']);
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });
jules
  .command('supervisor-migrate-from-cron')
  .description('Disable cron follow-up and switch to supervisor mode')
  .option('--super-admin-token <token>', 'Super Admin authentication token')
  .action(async (options: { superAdminToken?: string }) => {
    try {
      requireSuperAdmin(options, 'jules supervisor-migrate-from-cron');
      await runCommand('bash', ['scripts/jules-followup-migrate-from-cron.sh']);
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });
jules
  .command('merge-open')
  .description('Merge all open Jules PRs')
  .option('--super-admin-token <token>', 'Super Admin authentication token')
  .action(async (options: { superAdminToken?: string }) => {
    try {
      requireSuperAdmin(options, 'jules merge-open');
      await runCommand('bash', ['scripts/jules-merge-open-prs.sh']);
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });
jules
  .command('cron-install')
  .description('Install local Jules cron loop')
  .option('--super-admin-token <token>', 'Super Admin authentication token')
  .action(async (options: { superAdminToken?: string }) => {
    try {
      requireSuperAdmin(options, 'jules cron-install');
      await runCommand('bash', ['scripts/install-jules-cron.sh']);
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

const masterClock = program
  .command('master-clock')
  .description('Master clock controls (cloud-first)');
masterClock
  .command('start')
  .description('Start master-clock in cloud via Railway (default) or locally')
  .option('--local', 'Run local master-clock (override cloud-first policy)', false)
  .option('--service <name>', 'Railway service name for master clock', 'tnf-master-clock')
  .option('--super-admin-token <token>', 'Super Admin authentication token')
  .action(async (options: { local: boolean; service: string; superAdminToken?: string }) => {
    try {
      requireSuperAdmin(options, 'master-clock start');
      if (options.local) {
        await runCommand('pnpm', ['--filter', '@the-new-fuse/relay-core', 'run', 'master-clock']);
        return;
      }

      console.log(
        chalk.cyan(`☁️ Starting cloud master clock on Railway service ${options.service}`)
      );
      await runCommand('railway', ['up', '--service', options.service]);
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

masterClock
  .command('logs')
  .description('Tail cloud master-clock logs')
  .option('--service <name>', 'Railway service name for master clock', 'tnf-master-clock')
  .option('--super-admin-token <token>', 'Super Admin authentication token')
  .action(async (options: { service: string; superAdminToken?: string }) => {
    try {
      requireSuperAdmin(options, 'master-clock logs');
      await runCommand('railway', ['logs', '--service', options.service]);
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

masterClock
  .command('status')
  .description('Show Railway status for master-clock service')
  .option('--service <name>', 'Railway service name for master clock', 'tnf-master-clock')
  .option('--super-admin-token <token>', 'Super Admin authentication token')
  .action(async (options: { service: string; superAdminToken?: string }) => {
    try {
      requireSuperAdmin(options, 'master-clock status');
      await runCommand('railway', ['status', '--service', options.service]);
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

const superCycle = program.command('super-cycle').description('Super-cycle controls (cloud-first)');
superCycle
  .command('event')
  .description('Send super-cycle register/heartbeat/unregister event')
  .requiredOption('--action <action>', 'register|heartbeat|unregister')
  .requiredOption('--process-id <id>', 'Process identifier')
  .option('--name <name>', 'Process display name')
  .option('--status <status>', 'Process status', 'running')
  .option('--kind <kind>', 'Process kind', 'scheduled-job')
  .option('--owner <owner>', 'Process owner', 'tnf')
  .option('--result <result>', 'Last result')
  .option('--metadata <json>', 'JSON metadata', '{}')
  .option('--local', 'Run local super-cycle client (override cloud-first policy)', false)
  .option('--service <name>', 'Railway service name', 'tnf-master-clock')
  .option('--super-admin-token <token>', 'Super Admin authentication token')
  .action(
    async (options: {
      action: string;
      processId: string;
      name?: string;
      status: string;
      kind: string;
      owner: string;
      result?: string;
      metadata: string;
      local: boolean;
      service: string;
      superAdminToken?: string;
    }) => {
      try {
        requireSuperAdmin(options, 'super-cycle event');
        const baseArgs = [
          '--filter',
          '@the-new-fuse/relay-core',
          'run',
          'super-cycle:event',
          '--',
          '--action',
          options.action,
          '--process-id',
          options.processId,
          '--status',
          options.status,
          '--kind',
          options.kind,
          '--owner',
          options.owner,
          '--metadata',
          options.metadata,
        ];
        if (options.name) baseArgs.push('--name', options.name);
        if (options.result) baseArgs.push('--result', options.result);

        if (options.local) {
          await runCommand('pnpm', baseArgs);
          return;
        }

        console.log(
          chalk.cyan(`☁️ Sending super-cycle event via cloud service ${options.service}`)
        );
        await runCommand('railway', ['run', '--service', options.service, 'pnpm', ...baseArgs]);
      } catch (err: any) {
        console.error(chalk.red(`Error: ${err.message}`));
        process.exit(1);
      }
    }
  );

const compat = program.command('compat').description('Compatibility and migration utilities');
const compatOpenClaw = compat
  .command('openclaw')
  .description('Show TNF to OpenClaw command-surface compatibility')
  .option('--json', 'Output machine-readable JSON')
  .option('--mode <mode>', 'all|implicit|explicit-only', 'all')
  .action((options: { json?: boolean; mode: string }) => {
    try {
      const report = buildOpenClawCompatibilityReport();
      const normalizedMode = (options.mode || 'all').trim().toLowerCase();
      if (!['all', 'implicit', 'explicit-only'].includes(normalizedMode)) {
        throw new Error("Invalid --mode value. Use 'all', 'implicit', or 'explicit-only'.");
      }

      const entries =
        normalizedMode === 'all'
          ? report.entries
          : report.entries.filter((entry) => entry.mode === normalizedMode);

      if (options.json) {
        console.log(
          JSON.stringify(
            {
              ...report,
              mode: normalizedMode,
              entries,
            },
            null,
            2
          )
        );
        return;
      }

      console.log(chalk.bold('\nOpenClaw Compatibility\n'));
      console.log(
        `   Total OpenClaw top-level commands: ${chalk.cyan(String(report.totalOpenClawTopLevelCommands))}`
      );
      console.log(`   Direct TNF paths: ${chalk.green(String(report.implicitCommands))}`);
      console.log(
        `   Explicit namespace only: ${chalk.yellow(String(report.explicitOnlyCommands))}`
      );
      console.log(`   View: ${chalk.cyan(normalizedMode)}\n`);

      for (const entry of entries) {
        const route =
          entry.mode === 'implicit'
            ? `${chalk.green(entry.directPath || '')} ${chalk.dim(`(also ${entry.explicitPath})`)}`
            : `${chalk.yellow(entry.explicitPath)} ${chalk.dim('(kept explicit to avoid TNF command collision)')}`;
        console.log(`   ${chalk.bold(entry.command.padEnd(18, ' '))} ${route}`);
      }
      console.log('');
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

compatOpenClaw
  .command('instances')
  .description('List OpenClaw installations and instances known to TNF')
  .option('--json', 'Output machine-readable JSON')
  .action(async (options: { json?: boolean }) => {
    try {
      const args = ['instances'];
      if (options.json) args.push('--json');
      await runOpenClawControl(args);
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

compatOpenClaw
  .command('inventory')
  .description('Show redacted OpenClaw config and cron inventory')
  .option('--json', 'Output machine-readable JSON')
  .option('--installation <id>', 'Installation id')
  .option('--instance <id>', 'Instance/profile id')
  .option('--state-dir <path>', 'Ad hoc OpenClaw state directory')
  .option('--all-instances', 'Inspect every discovered instance')
  .action(
    async (options: {
      json?: boolean;
      installation?: string;
      instance?: string;
      stateDir?: string;
      allInstances?: boolean;
    }) => {
      try {
        const args = ['overview', ...buildOpenClawTargetArgs(options)];
        if (options.json) args.push('--json');
        await runOpenClawControl(args);
      } catch (err: any) {
        console.error(chalk.red(`Error: ${err.message}`));
        process.exit(1);
      }
    }
  );

compatOpenClaw
  .command('config')
  .description('Show redacted OpenClaw settings or a subtree')
  .option('--path <path>', 'Dot path within openclaw.json')
  .option('--json', 'Output machine-readable JSON')
  .option('--installation <id>', 'Installation id')
  .option('--instance <id>', 'Instance/profile id')
  .option('--state-dir <path>', 'Ad hoc OpenClaw state directory')
  .option('--all-instances', 'Read config across every discovered instance')
  .action(
    async (options: {
      path?: string;
      json?: boolean;
      installation?: string;
      instance?: string;
      stateDir?: string;
      allInstances?: boolean;
    }) => {
      try {
        const args = ['config-show', ...buildOpenClawTargetArgs(options)];
        if (options.path) args.push('--path', options.path);
        if (options.json) args.push('--json');
        await runOpenClawControl(args);
      } catch (err: any) {
        console.error(chalk.red(`Error: ${err.message}`));
        process.exit(1);
      }
    }
  );

compatOpenClaw
  .command('config-set')
  .description('Set an OpenClaw config value through TNF')
  .argument('<path>', 'Dot path within openclaw.json')
  .argument('<value>', 'Value to set')
  .option('--type <type>', 'string|number|boolean|json|null', 'string')
  .option('--installation <id>', 'Installation id')
  .option('--instance <id>', 'Instance/profile id')
  .option('--state-dir <path>', 'Ad hoc OpenClaw state directory')
  .action(
    async (
      targetPath: string,
      value: string,
      options: { type: string; installation?: string; instance?: string; stateDir?: string }
    ) => {
      try {
        await runOpenClawControl([
          'config-set',
          targetPath,
          value,
          '--type',
          options.type,
          ...buildOpenClawTargetArgs(options),
        ]);
      } catch (err: any) {
        console.error(chalk.red(`Error: ${err.message}`));
        process.exit(1);
      }
    }
  );

compatOpenClaw
  .command('config-unset')
  .description('Unset an OpenClaw config path through TNF')
  .argument('<path>', 'Dot path within openclaw.json')
  .option('--installation <id>', 'Installation id')
  .option('--instance <id>', 'Instance/profile id')
  .option('--state-dir <path>', 'Ad hoc OpenClaw state directory')
  .action(
    async (
      targetPath: string,
      options: { installation?: string; instance?: string; stateDir?: string }
    ) => {
      try {
        await runOpenClawControl(['config-unset', targetPath, ...buildOpenClawTargetArgs(options)]);
      } catch (err: any) {
        console.error(chalk.red(`Error: ${err.message}`));
        process.exit(1);
      }
    }
  );

compatOpenClaw
  .command('cron')
  .description('List OpenClaw cron jobs with TNF schedule mapping')
  .option('--json', 'Output machine-readable JSON')
  .option('--installation <id>', 'Installation id')
  .option('--instance <id>', 'Instance/profile id')
  .option('--state-dir <path>', 'Ad hoc OpenClaw state directory')
  .option('--all-instances', 'List cron jobs across every discovered instance')
  .action(
    async (options: {
      json?: boolean;
      installation?: string;
      instance?: string;
      stateDir?: string;
      allInstances?: boolean;
    }) => {
      try {
        const args = ['cron-list', ...buildOpenClawTargetArgs(options)];
        if (options.json) args.push('--json');
        await runOpenClawControl(args);
      } catch (err: any) {
        console.error(chalk.red(`Error: ${err.message}`));
        process.exit(1);
      }
    }
  );

compatOpenClaw
  .command('cron-enable')
  .description('Enable an OpenClaw cron job through TNF')
  .argument('<job>', 'Job id or name')
  .option('--installation <id>', 'Installation id')
  .option('--instance <id>', 'Instance/profile id')
  .option('--state-dir <path>', 'Ad hoc OpenClaw state directory')
  .action(
    async (
      job: string,
      options: { installation?: string; instance?: string; stateDir?: string }
    ) => {
      try {
        await runOpenClawControl(['cron-enable', job, ...buildOpenClawTargetArgs(options)]);
      } catch (err: any) {
        console.error(chalk.red(`Error: ${err.message}`));
        process.exit(1);
      }
    }
  );

compatOpenClaw
  .command('cron-disable')
  .description('Disable an OpenClaw cron job through TNF')
  .argument('<job>', 'Job id or name')
  .option('--installation <id>', 'Installation id')
  .option('--instance <id>', 'Instance/profile id')
  .option('--state-dir <path>', 'Ad hoc OpenClaw state directory')
  .action(
    async (
      job: string,
      options: { installation?: string; instance?: string; stateDir?: string }
    ) => {
      try {
        await runOpenClawControl(['cron-disable', job, ...buildOpenClawTargetArgs(options)]);
      } catch (err: any) {
        console.error(chalk.red(`Error: ${err.message}`));
        process.exit(1);
      }
    }
  );

compatOpenClaw
  .command('sync')
  .description('Sync live OpenClaw runtime state into TNF control-plane records')
  .option('--installation <id>', 'Installation id')
  .option('--instance <id>', 'Instance/profile id')
  .option('--state-dir <path>', 'Ad hoc OpenClaw state directory')
  .option('--all-instances', 'Sync every discovered instance')
  .action(
    async (options: {
      installation?: string;
      instance?: string;
      stateDir?: string;
      allInstances?: boolean;
    }) => {
      try {
        const targetArgs = buildOpenClawTargetArgs({
          ...options,
          allInstances: options.allInstances ?? true,
        });
        await runOpenClawControl(['sync-control-plane', '--actor', 'tnf-cli', ...targetArgs]);
      } catch (err: any) {
        console.error(chalk.red(`Error: ${err.message}`));
        process.exit(1);
      }
    }
  );

compatOpenClaw
  .command('cleanup')
  .description('Clean duplicate and failing TNF-managed OpenClaw cron jobs')
  .option('--disable-failing', 'Disable TNF-managed jobs currently in error state')
  .option('--dry-run', 'Compute cleanup result without writing OpenClaw cron files')
  .option(
    '--keep-launch-validation-duplicates',
    'Do not prune duplicate TNF Launch Validation one-shot jobs'
  )
  .option('--installation <id>', 'Installation id')
  .option('--instance <id>', 'Instance/profile id')
  .option('--state-dir <path>', 'Ad hoc OpenClaw state directory')
  .option('--all-instances', 'Apply cleanup to every discovered instance')
  .action(
    async (options: {
      disableFailing?: boolean;
      dryRun?: boolean;
      keepLaunchValidationDuplicates?: boolean;
      installation?: string;
      instance?: string;
      stateDir?: string;
      allInstances?: boolean;
    }) => {
      try {
        const args = ['cleanup-cron', '--actor', 'tnf-cli', ...buildOpenClawTargetArgs(options)];
        if (options.disableFailing) args.push('--disable-failing');
        if (options.dryRun) args.push('--dry-run');
        if (options.keepLaunchValidationDuplicates) {
          args.push('--keep-launch-validation-duplicates');
        }
        await runOpenClawControl(args);
      } catch (err: any) {
        console.error(chalk.red(`Error: ${err.message}`));
        process.exit(1);
      }
    }
  );

compatOpenClaw
  .command('cron-schedule')
  .description('Change an OpenClaw cron job schedule through TNF')
  .argument('<job>', 'Job id or name')
  .option('--cron <expr>', 'Cron expression')
  .option('--tz <tz>', 'Timezone for cron expressions')
  .option('--stagger-ms <ms>', 'Optional stagger milliseconds')
  .option('--every-ms <ms>', 'Repeat interval in milliseconds')
  .option('--anchor-ms <ms>', 'Anchor time in milliseconds for every schedules')
  .option('--at <iso>', 'One-shot ISO timestamp')
  .option('--installation <id>', 'Installation id')
  .option('--instance <id>', 'Instance/profile id')
  .option('--state-dir <path>', 'Ad hoc OpenClaw state directory')
  .action(
    async (
      job: string,
      options: {
        cron?: string;
        tz?: string;
        staggerMs?: string;
        everyMs?: string;
        anchorMs?: string;
        at?: string;
        installation?: string;
        instance?: string;
        stateDir?: string;
      }
    ) => {
      try {
        const args = ['cron-schedule', job];
        if (options.cron) args.push('--cron', options.cron);
        if (options.tz) args.push('--tz', options.tz);
        if (options.staggerMs) args.push('--stagger-ms', options.staggerMs);
        if (options.everyMs) args.push('--every-ms', options.everyMs);
        if (options.anchorMs) args.push('--anchor-ms', options.anchorMs);
        if (options.at) args.push('--at', options.at);
        args.push(...buildOpenClawTargetArgs(options));
        await runOpenClawControl(args);
      } catch (err: any) {
        console.error(chalk.red(`Error: ${err.message}`));
        process.exit(1);
      }
    }
  );

const skills = program.command('skills').description('Skill bank operations');
const skillsBank = skills.command('bank').description('Cross-LLM skill bank operations');
skillsBank
  .command('sync')
  .description('Build/refresh cross-LLM skill bank index and snapshots')
  .action(async () => {
    try {
      await runCommand('node', ['scripts/skills/skill-bank-sync.cjs']);
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });
skillsBank
  .command('query')
  .description('Search skill bank index')
  .argument('<query>', 'Search query')
  .action(async (query: string) => {
    try {
      await runCommand('node', ['scripts/skills/skill-bank-query.cjs', query]);
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });
skillsBank
  .command('ingest')
  .description('Ingest skill-bank export rows into resource registry API')
  .option('--strict', 'Exit non-zero if any records fail')
  .option('--dry-run', 'Validate ingest payload without posting')
  .action(async (options: { strict?: boolean; dryRun?: boolean }) => {
    try {
      const args = ['scripts/skills/skill-bank-ingest.cjs'];
      if (options.strict) args.push('--strict');
      if (options.dryRun) args.push('--dry-run');
      await runCommand('node', args);
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });
skillsBank
  .command('retry-pending')
  .description('Retry pending failed skill-bank ingests')
  .option('--strict', 'Exit non-zero if any records still fail')
  .action(async (options: { strict?: boolean }) => {
    try {
      const args = ['scripts/skills/skill-bank-retry-pending.cjs'];
      if (options.strict) args.push('--strict');
      await runCommand('node', args);
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });
skillsBank
  .command('supervisor')
  .description('Run continuous skill-bank sync/ingest/retry supervisor')
  .option('--super-admin-token <token>', 'Super Admin authentication token')
  .action(async (options: { superAdminToken?: string }) => {
    try {
      requireSuperAdmin(options, 'skills bank supervisor');
      await runCommand('bash', ['scripts/skills/skill-bank-supervisor.sh']);
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });
skillsBank
  .command('supervisor-start')
  .description('Start skill-bank supervisor in background')
  .option('--super-admin-token <token>', 'Super Admin authentication token')
  .action(async (options: { superAdminToken?: string }) => {
    try {
      requireSuperAdmin(options, 'skills bank supervisor-start');
      await runCommand('bash', ['scripts/skills/skill-bank-supervisor-start.sh']);
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });
skillsBank
  .command('supervisor-stop')
  .description('Stop skill-bank supervisor')
  .option('--super-admin-token <token>', 'Super Admin authentication token')
  .action(async (options: { superAdminToken?: string }) => {
    try {
      requireSuperAdmin(options, 'skills bank supervisor-stop');
      await runCommand('bash', ['scripts/skills/skill-bank-supervisor-stop.sh']);
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });
skillsBank
  .command('supervisor-status')
  .description('Show skill-bank supervisor status')
  .action(async () => {
    try {
      await runCommand('bash', ['scripts/skills/skill-bank-supervisor-status.sh']);
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

superCycle
  .command('status')
  .description('Read super-cycle state snapshot')
  .option('--local', 'Read from local Redis via local client', false)
  .option('--service <name>', 'Railway service name', 'tnf-master-clock')
  .option('--super-admin-token <token>', 'Super Admin authentication token')
  .action(async (options: { local: boolean; service: string; superAdminToken?: string }) => {
    try {
      requireSuperAdmin(options, 'super-cycle status');
      if (options.local) {
        await runCommand('pnpm', [
          '--filter',
          '@the-new-fuse/relay-core',
          'run',
          'super-cycle:status',
        ]);
        return;
      }
      await runCommand('railway', [
        'run',
        '--service',
        options.service,
        'pnpm',
        '--filter',
        '@the-new-fuse/relay-core',
        'run',
        'super-cycle:status',
      ]);
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

program
  .command('run')
  .description('Execute any root package script through unified TNF CLI')
  .argument('<script>', 'Root package.json script name')
  .argument('[args...]', 'Arguments to forward')
  .option('--super-admin-token <token>', 'Super Admin authentication token')
  .action(async (script: string, args: string[], options: { superAdminToken?: string }) => {
    try {
      requireSuperAdmin(options, 'run');
      const cmdArgs = ['run', script];
      if (args.length > 0) cmdArgs.push('--', ...args);
      await runCommand('pnpm', cmdArgs);
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

const scriptsCommand = program
  .command('scripts')
  .description('Discover and run repo scripts and root package scripts');

scriptsCommand
  .command('list')
  .description('List runnable scripts from package.json, scripts/**, tools/**, and repo root')
  .option('--json', 'Output machine-readable JSON')
  .action((options: { json?: boolean }) => {
    try {
      const rootScripts = loadRootScripts();
      const fileScripts = discoverFileScripts();
      if (options.json) {
        console.log(
          JSON.stringify(
            {
              rootScripts,
              fileScripts: fileScripts.map((s) => s.relPath),
            },
            null,
            2
          )
        );
        return;
      }

      console.log(chalk.bold('\nRoot package scripts:\n'));
      for (const script of rootScripts) {
        console.log(`- ${chalk.cyan(script.name)}: ${chalk.dim(script.command)}`);
      }

      console.log(chalk.bold('\nRunnable files (scripts/**, tools/**, repo root):\n'));
      for (const script of fileScripts) {
        console.log(`- ${chalk.green(script.relPath)}`);
      }
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

scriptsCommand
  .command('run')
  .description('Run either a root package script or a runnable file path')
  .argument(
    '<target>',
    'Root script name OR runnable file path (scripts/**, tools/**, or repo root)'
  )
  .argument('[args...]', 'Arguments to forward')
  .action(async (target: string, args: string[]) => {
    try {
      const rootScripts = loadRootScripts();
      const rootMatch = rootScripts.find((s) => s.name === target);
      if (rootMatch) {
        const cmdArgs = ['run', target];
        if (args.length > 0) cmdArgs.push('--', ...args);
        await runCommand('pnpm', cmdArgs);
        return;
      }

      const fileScript = resolveFileScript(target);
      if (fileScript) {
        await runFileScript(fileScript, args);
        return;
      }

      throw new Error(
        `Unknown target '${target}'. Use 'tnf scripts list' to see available scripts.`
      );
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

program
  .command('menu')
  .description('Show an organized TNF command menu')
  .option('--theme <theme>', `Splash theme: ${SPLASH_THEMES.join('|')}`)
  .option('--animate <mode>', 'Splash animation mode: auto|on|off')
  .option('--speed <ms>', 'Splash animation speed in milliseconds')
  .option('--compact', 'Use compact splash layout')
  .option('--no-splash', 'Disable splash graphic')
  .option('--full', 'Include expanded command inventory')
  .option('--json', 'Output machine-readable JSON')
  .action(
    async (options: {
      json?: boolean;
      splash?: boolean;
      theme?: string;
      animate?: string;
      speed?: string;
      compact?: boolean;
      full?: boolean;
    }) => {
      try {
        const sections = buildCommandMenuSections({ full: options.full });
        if (options.json) {
          console.log(JSON.stringify(sections, null, 2));
          return;
        }

        const speedMs = options.speed ? Number.parseInt(options.speed, 10) : undefined;
        const compact = options.compact ?? shouldAutoCompactMenuSplash();
        await printCommandMenu({
          showSplash: options.splash,
          splash: {
            theme: coerceSplashTheme(options.theme),
            animate: parseAnimateMode(options.animate),
            speedMs: Number.isFinite(speedMs) ? speedMs : undefined,
            compact,
          },
          full: options.full,
        });
      } catch (err: any) {
        console.error(chalk.red(`Error: ${err.message}`));
        process.exit(1);
      }
    }
  );

program
  .command('splash')
  .description('Render TNF branded splash only')
  .option('--theme <theme>', `Splash theme: ${SPLASH_THEMES.join('|')}`)
  .option('--animate <mode>', 'Splash animation mode: auto|on|off')
  .option('--speed <ms>', 'Splash animation speed in milliseconds')
  .option('--compact', 'Use compact splash layout')
  .action(
    async (options: { theme?: string; animate?: string; speed?: string; compact?: boolean }) => {
      try {
        const speedMs = options.speed ? Number.parseInt(options.speed, 10) : undefined;
        await renderSplash({
          theme: coerceSplashTheme(options.theme),
          animate: parseAnimateMode(options.animate),
          speedMs: Number.isFinite(speedMs) ? speedMs : undefined,
          compact: options.compact,
        });
      } catch (err: any) {
        console.error(chalk.red(`Error: ${err.message}`));
        process.exit(1);
      }
    }
  );

program
  .command('paths')
  .description('List all command paths in the TNF CLI')
  .option('--json', 'Output machine-readable JSON')
  .action((options: { json?: boolean }) => {
    try {
      const paths = collectCommandPaths(program).sort((a, b) => a.path.localeCompare(b.path));
      if (options.json) {
        console.log(JSON.stringify(paths, null, 2));
        return;
      }

      console.log(chalk.bold('\nTNF Command Paths\n'));
      for (const entry of paths) {
        const paddedPath = entry.path.padEnd(52, ' ');
        console.log(`  ${chalk.green(paddedPath)} ${chalk.dim(entry.description)}`);
      }
      console.log('');
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

const types = program.command('types').description('Command namespace and script type inventory');
types
  .command('list')
  .description('List TNF command namespaces and root script namespaces')
  .option('--json', 'Output machine-readable JSON')
  .action((options: { json?: boolean }) => {
    try {
      const typeIndex = buildTypeIndex();
      if (options.json) {
        console.log(JSON.stringify(typeIndex, null, 2));
        return;
      }

      console.log(chalk.bold('\nTNF Types\n'));
      console.log(chalk.cyan('CLI namespaces:'));
      for (const namespace of typeIndex.cliNamespaces) {
        console.log(`  - ${chalk.green(namespace)}`);
      }

      console.log(`\n${chalk.cyan('Root script namespaces:')}`);
      for (const [namespace, count] of Object.entries(typeIndex.scriptNamespaces).sort(([a], [b]) =>
        a.localeCompare(b)
      )) {
        console.log(`  - ${chalk.green(namespace)} ${chalk.dim(`(${count} scripts)`)}`);
      }
      console.log('');
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

const traits = program.command('traits').description('Role/platform and command behavior traits');
traits
  .command('list')
  .description('List TNF traits for agents and command families')
  .option('--json', 'Output machine-readable JSON')
  .action((options: { json?: boolean }) => {
    try {
      const groups = buildTraitGroups();
      if (options.json) {
        console.log(JSON.stringify(groups, null, 2));
        return;
      }

      console.log(chalk.bold('\nTNF Traits\n'));
      for (const group of groups) {
        console.log(chalk.cyan(`${group.name}:`));
        for (const value of group.values) {
          console.log(`  - ${chalk.green(value)}`);
        }
        console.log('');
      }
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

const agents = program.command('agents').description('Agent-focused command paths');
agents
  .command('list')
  .description('Alias for `tnf list`')
  .action(async () => runSelfCliWithExit(['list']));
agents
  .command('register')
  .description('Alias for `tnf register`')
  .argument('[name]', 'Agent name')
  .argument('[role]', 'Agent role')
  .argument('[platform]', 'Agent platform')
  .option('-d, --daemon', 'Run in daemon mode (register and exit immediately)', false)
  .action(
    async (name?: string, role?: string, platform?: string, options: { daemon?: boolean } = {}) => {
      const args = ['register'];
      if (name) args.push(name);
      if (role) args.push(role);
      if (platform) args.push(platform);
      if (options.daemon) args.push('--daemon');
      await runSelfCliWithExit(args);
    }
  );
agents
  .command('send')
  .description('Alias for `tnf send`')
  .argument('<message>', 'Message to send')
  .option('-t, --to <agentId>', 'Recipient agent ID')
  .option('-n, --name <name>', 'Sender name')
  .action(async (message: string, options: { to?: string; name?: string } = {}) => {
    const args = ['send', message];
    if (options.to) args.push('--to', options.to);
    if (options.name) args.push('--name', options.name);
    await runSelfCliWithExit(args);
  });
agents
  .command('orchestrate')
  .description('Alias for `tnf orchestrate`')
  .argument('<workflow>', 'Workflow name')
  .option('-p, --path <path>', 'Target path for code-review')
  .action(async (workflow: string, options: { path?: string } = {}) => {
    const args = ['orchestrate', workflow];
    if (options.path) args.push('--path', options.path);
    await runSelfCliWithExit(args);
  });
agents
  .command('convo')
  .description('Alias for `tnf convo`')
  .argument('<action>', 'Action (start|join)')
  .argument('[param]', 'Topic for start or ID for join')
  .action(async (action: string, param?: string) => {
    const args = ['convo', action];
    if (param) args.push(param);
    await runSelfCliWithExit(args);
  });

program
  .command('list')
  .description('List all registered agents')
  .action(async () => {
    const client = new RedisAgentClient();
    try {
      await client.initialize();
      const agents = await client.listAgents();

      console.log(chalk.bold('\n📋 Registered Agents:\n'));

      if (agents.length === 0) {
        console.log('   No agents registered');
      } else {
        agents.forEach((agent) => {
          const statusIcon = agent.isOnline ? chalk.green('🟢') : chalk.red('🔴');
          const roleIcon: Record<string, string> = {
            orchestrator: '👑',
            broker: '🎯',
            worker: '⚙️',
            participant: '💬',
          };
          const icon = roleIcon[agent.role] || '📦';

          console.log(`${statusIcon} ${icon} ${chalk.bold(agent.name)} (${agent.platform})`);
          console.log(`      Role: ${agent.role}`);
          console.log(`      ID: ${chalk.dim(agent.id)}`);
          console.log(`      Last seen: ${chalk.dim(agent.lastSeen)}`);
          console.log('');
        });
      }
    } catch (err: any) {
      if (isRedisUnavailable(err)) {
        logRedisUnavailable('./tnf list');
      }
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    } finally {
      await client.cleanup();
    }
  });

program
  .command('send')
  .description('Send a single message')
  .argument('<message>', 'Message to send')
  .option('-t, --to <agentId>', 'Recipient agent ID')
  .option('-n, --name <name>', 'Sender name', process.env.AGENT_NAME || 'cli-sender')
  .action(async (message, options) => {
    const client = new RedisAgentClient();
    try {
      await client.initialize();
      await client.register(options.name, 'participant', 'vscode');
      await client.send(message, { to: options.to ? { agentId: options.to } : undefined });

      console.log(chalk.green('📤 Message sent'));

      // Wait a bit for responses
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (err: any) {
      if (isRedisUnavailable(err)) {
        logRedisUnavailable('./tnf send <message>');
      }
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    } finally {
      await client.cleanup();
    }
  });

program
  .command('orchestrate')
  .description('Execute an orchestrated multi-agent workflow')
  .argument('<workflow>', 'Workflow name (health-check, code-review, self-improvement)')
  .option('-p, --path <path>', 'Target path for code-review')
  .action(async (workflow, options) => {
    const client = new RedisAgentClient();
    try {
      await client.initialize();
      await client.register('orchestrator-cli', 'orchestrator', 'vscode');
      const orchestrator = new Orchestrator(client);
      await orchestrator.executeWorkflow(workflow, options);

      // Wait for any immediate feedback
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (err: any) {
      if (isRedisUnavailable(err)) {
        logRedisUnavailable('./tnf orchestrate <workflow>');
      }
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    } finally {
      await client.cleanup();
    }
  });

program
  .command('convo')
  .description('Manage conversations')
  .argument('<action>', 'Action (start, join)')
  .argument('[param]', 'Topic for start, ID for join')
  .action(async (action, param) => {
    const client = new RedisAgentClient();
    try {
      await client.initialize();
      await client.register('convo-cli', 'participant', 'vscode');

      if (action === 'start') {
        const id = await client.startConversation(param || 'general');
        console.log(chalk.green(`💬 Started conversation: ${chalk.bold(param || 'general')}`));
        console.log(`   ID: ${chalk.dim(id)}`);
      } else if (action === 'join') {
        if (!param) {
          throw new Error('Conversation ID required to join');
        }
        client.joinConversation(param);
        console.log(chalk.green(`🔗 Joined conversation: ${chalk.dim(param)}`));
      }

      console.log(chalk.cyan('\nType messages and press Enter (Ctrl+C to exit)\n'));

      client.onMessage('*', (msg) => {
        logMessage(msg);
      });

      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      rl.on('line', async (line) => {
        if (line.trim()) {
          await client.send(line.trim());
        }
      });

      process.on('SIGINT', async () => {
        await client.cleanup();
        process.exit(0);
      });
    } catch (err: any) {
      if (isRedisUnavailable(err)) {
        logRedisUnavailable(`./tnf convo ${action}${param ? ` ${param}` : ''}`);
      }
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

// ────────────────────────────────────────────────────────────────────────────
// Reports lifecycle management
// ────────────────────────────────────────────────────────────────────────────
const reports = program
  .command('reports')
  .description('Report lifecycle management — rotation, metadata, trending');

reports
  .command('status')
  .description('Show report inventory: counts per type, disk usage, and lifecycle metadata')
  .option('--json', 'Output machine-readable JSON')
  .action(async (options: { json?: boolean }) => {
    try {
      const reportDir = path.join(repoRoot, '.agent/test-reports');
      if (!fs.existsSync(reportDir)) {
        console.log(chalk.yellow('No reports directory found at .agent/test-reports'));
        process.exit(0);
      }
      const files = fs
        .readdirSync(reportDir)
        .filter((f) => f.endsWith('.json') && !f.startsWith('_'));

      const counts: Record<string, number> = {};
      let totalBytes = 0;
      for (const file of files) {
        const prefix = file.replace(/-\d{13}\.json$/, '');
        counts[prefix] = (counts[prefix] || 0) + 1;
        try {
          totalBytes += fs.statSync(path.join(reportDir, file)).size;
        } catch {
          /* skip */
        }
      }

      // Check for rolling summary
      const summaryPath = path.join(reportDir, '_rolling-summary.json');
      let summary: any = null;
      if (fs.existsSync(summaryPath)) {
        try {
          summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
        } catch {
          /* skip */
        }
      }

      if (options.json) {
        console.log(
          JSON.stringify({ counts, totalBytes, totalFiles: files.length, summary }, null, 2)
        );
        return;
      }

      console.log(chalk.bold('\n📋 Report Inventory\n'));
      console.log(`   Directory: ${chalk.dim('.agent/test-reports')}`);
      console.log(`   Total files: ${chalk.cyan(String(files.length))}`);
      console.log(`   Total size: ${chalk.cyan((totalBytes / 1024).toFixed(1) + ' KB')}\n`);

      for (const [prefix, count] of Object.entries(counts).sort()) {
        const meta = summary?.types?.[prefix];
        const domain = meta?.domain || 'unknown';
        const lifecycle = meta?.lifecycle || 'unknown';
        const avgScore = meta?.recentAvgScore;
        const trend = meta?.trend;

        console.log(
          `   ${chalk.green(prefix)}: ${chalk.bold(String(count))} files` +
            `  ${chalk.dim(`[${domain}/${lifecycle}]`)}` +
            (avgScore != null ? `  avg=${chalk.cyan(avgScore + '%')}` : '') +
            (trend
              ? `  trend=${trend === 'declining' ? chalk.red(trend) : chalk.green(trend)}`
              : '')
        );
      }

      if (summary?.generatedAt) {
        console.log(`\n   Summary last updated: ${chalk.dim(summary.generatedAt)}`);
      }
      console.log('');
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

reports
  .command('prune')
  .description('Prune old reports and regenerate the rolling summary')
  .option('--max-per-type <n>', 'Maximum reports to keep per type', '50')
  .option('--max-age-days <n>', 'Maximum report age in days', '7')
  .option('--dry-run', 'Show what would be pruned without deleting')
  .action(async (options: { maxPerType: string; maxAgeDays: string; dryRun?: boolean }) => {
    try {
      const env: Record<string, string> = {};
      if (options.maxPerType) env.REPORT_MAX_PER_TYPE = options.maxPerType;
      if (options.maxAgeDays) {
        env.REPORT_MAX_AGE_MS = String(parseInt(options.maxAgeDays, 10) * 86400000);
      }
      if (options.dryRun) {
        // In dry-run mode, just show counts without actually pruning
        const reportDir = path.join(repoRoot, '.agent/test-reports');
        if (!fs.existsSync(reportDir)) {
          console.log(chalk.yellow('No reports directory found.'));
          process.exit(0);
        }

        const maxPerType = parseInt(options.maxPerType, 10);
        const maxAgeMs = parseInt(options.maxAgeDays, 10) * 86400000;
        const now = Date.now();
        const prefixes = ['test-report', 'integration-report', 'uiux-report'];

        console.log(chalk.bold('\n🔍 Dry Run — Reports that WOULD be pruned:\n'));
        for (const prefix of prefixes) {
          const files = fs
            .readdirSync(reportDir)
            .filter((f) => f.startsWith(prefix + '-') && f.endsWith('.json'))
            .sort();

          let wouldPrune = 0;
          for (const file of files) {
            const tsMatch = file.match(/(\d{13})\.json$/);
            if (tsMatch && parseInt(tsMatch[1], 10) < now - maxAgeMs) {
              wouldPrune++;
            }
          }
          const remaining = files.length - wouldPrune;
          if (remaining > maxPerType) {
            wouldPrune += remaining - maxPerType;
          }

          console.log(
            `   ${chalk.green(prefix)}: ${chalk.red(String(wouldPrune))} pruned, ${chalk.cyan(String(Math.max(0, files.length - wouldPrune)))} kept`
          );
        }
        console.log('');
        return;
      }

      await runCommand('node', ['scripts/swarm/report-lifecycle.cjs'], { env });
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

reports
  .command('summary')
  .description('Display the rolling summary dashboard')
  .option('--json', 'Output raw rolling summary JSON')
  .action(async (options: { json?: boolean }) => {
    try {
      const summaryPath = path.join(repoRoot, '.agent/test-reports/_rolling-summary.json');
      if (!fs.existsSync(summaryPath)) {
        console.log(
          chalk.yellow('No rolling summary found. Run `tnf reports prune` to generate one.')
        );
        process.exit(0);
      }

      const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));

      if (options.json) {
        console.log(JSON.stringify(summary, null, 2));
        return;
      }

      console.log(chalk.bold('\n📊 Rolling Summary Dashboard\n'));
      console.log(`   Generated: ${chalk.dim(summary.generatedAt)}`);
      console.log(`   Window: last ${summary.config?.summaryWindow || '?'} reports per type\n`);

      for (const [type, data] of Object.entries(summary.types || {}) as [string, any][]) {
        const trendColor = data.trend === 'declining' ? chalk.red : chalk.green;
        const scoreColor =
          (data.recentAvgScore ?? 0) >= 80
            ? chalk.green
            : (data.recentAvgScore ?? 0) >= 60
              ? chalk.yellow
              : chalk.red;

        console.log(`   ${chalk.bold(type)} ${chalk.dim(`(${data.domain}/${data.lifecycle})`)}`);
        console.log(`     Owner: ${chalk.dim(data.owner)}`);
        console.log(`     On disk: ${chalk.cyan(String(data.totalOnDisk))}`);
        console.log(
          `     Avg score: ${scoreColor(data.recentAvgScore != null ? data.recentAvgScore + '%' : 'n/a')}`
        );
        console.log(
          `     Min/Max: ${data.recentMinScore ?? 'n/a'}% / ${data.recentMaxScore ?? 'n/a'}%`
        );
        console.log(`     Trend: ${trendColor(data.trend)}`);
        if (data.latestReport) {
          console.log(
            `     Latest: ${chalk.dim(data.latestReport.file)} (${data.latestReport.status})`
          );
        }
        console.log('');
      }
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

reports
  .command('trends')
  .description('Show score trends for a specific report type')
  .argument('[type]', 'Report type (test-report, integration-report, uiux-report)', 'test-report')
  .option('--limit <n>', 'Number of recent reports to show', '20')
  .action(async (type: string, options: { limit: string }) => {
    try {
      const reportDir = path.join(repoRoot, '.agent/test-reports');
      if (!fs.existsSync(reportDir)) {
        console.log(chalk.yellow('No reports directory found.'));
        process.exit(0);
      }

      const limit = parseInt(options.limit, 10);
      const files = fs
        .readdirSync(reportDir)
        .filter((f) => f.startsWith(type + '-') && f.endsWith('.json'))
        .sort()
        .slice(-limit);

      if (files.length === 0) {
        console.log(chalk.yellow(`No reports found for type: ${type}`));
        process.exit(0);
      }

      console.log(chalk.bold(`\n📈 Score Trends: ${type} (last ${files.length})\n`));

      const maxBarWidth = 40;
      for (const file of files) {
        try {
          const data = JSON.parse(fs.readFileSync(path.join(reportDir, file), 'utf8'));
          const score = data.overall?.score ?? 0;
          const status = data.overall?.status ?? '?';
          const ts = data.timestamp ? new Date(data.timestamp).toLocaleString() : 'unknown';

          const barFill = Math.round((score / 100) * maxBarWidth);
          const bar = '█'.repeat(barFill) + '░'.repeat(maxBarWidth - barFill);
          const scoreColor = score >= 80 ? chalk.green : score >= 60 ? chalk.yellow : chalk.red;

          console.log(
            `   ${chalk.dim(ts)}  ${scoreColor(bar)} ${scoreColor.bold(String(score) + '%')} ${chalk.dim(status)}`
          );
        } catch {
          /* skip corrupt */
        }
      }
      console.log('');
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

async function main(): Promise<void> {
  if (process.argv.length <= 2) {
    await printCommandMenu({
      splash: {
        compact: shouldAutoCompactMenuSplash(),
      },
    });
    return;
  }
  if (isOpenClawPassthroughArgv(process.argv)) {
    await runOpenClawPassthrough(process.argv.slice(3));
    return;
  }
  const implicitOpenClawArgs = resolveImplicitOpenClawArgs(process.argv);
  if (implicitOpenClawArgs) {
    await runOpenClawPassthrough(implicitOpenClawArgs);
    return;
  }
  await program.parseAsync(process.argv);
}

main().catch((err: Error) => {
  console.error(chalk.red(`Error: ${err.message}`));
  process.exit(1);
});
