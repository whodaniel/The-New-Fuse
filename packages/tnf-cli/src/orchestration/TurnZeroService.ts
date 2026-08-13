import chalk from 'chalk';
import { execFileSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

/**
 * Outcome of a single Turn Zero step.
 *
 * `skipped` exists so a step that did not run can never be mistaken for one
 * that ran and succeeded. The previous implementation printed
 * "Step 4: Verifying integrity" / "Step 5: Repository synchronization" and
 * returned `integrityOk: true` / `synced: true` as hardcoded literals — no
 * Merkle check, no git operation. Callers had no way to tell an asserted green
 * from a measured one, and `synced: true` was returned by a session that had
 * never contacted the remote.
 *
 * Every state here must be justified by `detail`.
 */
export type CheckState = 'ok' | 'failed' | 'skipped';

export type TurnZeroCheck = {
  state: CheckState;
  detail: string;
};

export type TurnZeroResult = {
  passed: boolean;
  stateFiles: string[];
  frontloadFiles: string[];
  handoffFiles: string[];
  checks: {
    integrity: TurnZeroCheck;
    repoSync: TurnZeroCheck;
    codebaseMap: TurnZeroCheck;
    handoffFreshness: TurnZeroCheck;
    activeDirective: TurnZeroCheck;
    assimilate: TurnZeroCheck;
  };
  warnings: string[];
  errors: string[];
};

const REQUIRED_STATE_FILES = [
  'docs/protocols/LIVING_STATE.md',
  'docs/protocols/TURN_ZERO_MANDATE.md',
];

const FRONTLOAD_FILES = [
  '.agent/SYSTEM_PROMPT.md',
  '.agent/context/resource-map.md',
  '.agent/context/agent-onboarding.md',
];

const HANDOFF_FILES = [
  'docs/protocols/reports/SESSION_HANDOFF_LATEST.json',
  'docs/protocols/reports/SESSION_HANDOFF_LATEST.md',
];

const STATUS_LEDGER_PATH = 'docs/protocols/AGENT_STATUS_LEDGER.md';
const CODEBASE_MAP_PATH = 'apps/frontend/src/data/codebase_map.json';
const KNOWLEDGE_TREE_PATH = 'KNOWLEDGE_TREE.json';

/** Mandate step 3b: a handoff older than this is stale (advisory, non-blocking). */
const HANDOFF_STALE_AFTER_MS = 24 * 60 * 60 * 1000;

const ok = (detail: string): TurnZeroCheck => ({ state: 'ok', detail });
const failed = (detail: string): TurnZeroCheck => ({ state: 'failed', detail });
const skipped = (detail: string): TurnZeroCheck => ({ state: 'skipped', detail });

export class TurnZeroService {
  private repoRoot: string;

  constructor(repoRoot: string) {
    this.repoRoot = repoRoot;
  }

  resolve(relativePath: string): string {
    return path.join(this.repoRoot, relativePath);
  }

  fileExists(relativePath: string): boolean {
    return fs.existsSync(this.resolve(relativePath));
  }

  readFile(relativePath: string): string | null {
    try {
      return fs.readFileSync(this.resolve(relativePath), 'utf8');
    } catch {
      return null;
    }
  }

  private git(args: string[]): string {
    return execFileSync('git', args, {
      cwd: this.repoRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
  }

  /** Mandate step 5: integrity. Parses the artifact rather than stat-ing it. */
  private checkIntegrity(): TurnZeroCheck {
    if (!this.fileExists(KNOWLEDGE_TREE_PATH)) {
      return skipped(`${KNOWLEDGE_TREE_PATH} not present — no integrity artifact to verify`);
    }
    const raw = this.readFile(KNOWLEDGE_TREE_PATH);
    if (raw === null) return failed(`${KNOWLEDGE_TREE_PATH} present but unreadable`);
    try {
      const parsed = JSON.parse(raw);
      const rootHash =
        parsed?.merkleRoot ?? parsed?.root ?? parsed?.rootHash ?? parsed?.hash ?? null;
      if (!rootHash) {
        return skipped(
          `${KNOWLEDGE_TREE_PATH} parses but carries no merkle/root hash field — nothing to verify against`
        );
      }
      return ok(`${KNOWLEDGE_TREE_PATH} parsed, root=${String(rootHash).slice(0, 16)}`);
    } catch (err: any) {
      return failed(`${KNOWLEDGE_TREE_PATH} is not valid JSON: ${err.message}`);
    }
  }

  /**
   * Mandate step 6: repository synchronization.
   *
   * Measures rather than mutates by default. An unconditional `git pull` at
   * session start is unsafe — this repo sat mid-merge with two unmerged paths
   * for three days, and an automatic pull/rebase into that state would have
   * compounded it. Set TNF_TURN_ZERO_AUTOPULL=1 to opt into pulling.
   */
  private checkRepoSync(warnings: string[]): TurnZeroCheck {
    let branch: string;
    try {
      branch = this.git(['rev-parse', '--abbrev-ref', 'HEAD']);
    } catch (err: any) {
      return failed(`not a git worktree or git unavailable: ${err.message}`);
    }

    // An in-progress merge/rebase is the single most important thing a session
    // can know at Turn Zero, and nothing surfaced it before.
    const gitDir = (() => {
      try {
        return this.git(['rev-parse', '--git-dir']);
      } catch {
        return null;
      }
    })();
    if (gitDir) {
      const inProgress = ['MERGE_HEAD', 'CHERRY_PICK_HEAD', 'REVERT_HEAD', 'rebase-merge'].find(
        (m) => fs.existsSync(path.resolve(this.repoRoot, gitDir, m))
      );
      if (inProgress) {
        let unmerged = 0;
        try {
          const out = this.git(['diff', '--name-only', '--diff-filter=U']);
          unmerged = out ? out.split('\n').filter(Boolean).length : 0;
        } catch {
          /* best effort */
        }
        warnings.push(
          `${inProgress} in progress on ${branch} with ${unmerged} unmerged path(s) — resolve before committing`
        );
      }
    }

    let upstream: string;
    try {
      upstream = this.git(['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}']);
    } catch {
      return skipped(`branch ${branch} has no upstream — nothing to sync against`);
    }

    if (process.env.TNF_TURN_ZERO_AUTOPULL === '1') {
      try {
        this.git(['pull', '--rebase', '--autostash']);
        return ok(`pulled --rebase --autostash from ${upstream}`);
      } catch (err: any) {
        return failed(`git pull from ${upstream} failed: ${err.message}`);
      }
    }

    try {
      const counts = this.git(['rev-list', '--left-right', '--count', `${upstream}...HEAD`]);
      const [behind, ahead] = counts.split(/\s+/).map((n) => Number(n) || 0);
      if (behind > 0) {
        warnings.push(
          `${branch} is ${behind} commit(s) behind ${upstream} (set TNF_TURN_ZERO_AUTOPULL=1 to pull)`
        );
      }
      return ok(
        `${branch} vs ${upstream}: ${ahead} ahead, ${behind} behind (measured, not pulled)`
      );
    } catch (err: any) {
      return failed(`could not compare against ${upstream}: ${err.message}`);
    }
  }

  /** Mandate step 4: ingest codebase structure. */
  private checkCodebaseMap(): TurnZeroCheck {
    if (!this.fileExists(CODEBASE_MAP_PATH)) {
      return skipped(`${CODEBASE_MAP_PATH} not present`);
    }
    const raw = this.readFile(CODEBASE_MAP_PATH);
    if (raw === null) return failed(`${CODEBASE_MAP_PATH} unreadable`);
    try {
      const parsed = JSON.parse(raw);
      const entries = Array.isArray(parsed) ? parsed.length : Object.keys(parsed ?? {}).length;
      return ok(`${entries} top-level entries, ${(raw.length / 1024).toFixed(0)}KB`);
    } catch (err: any) {
      return failed(`${CODEBASE_MAP_PATH} is not valid JSON: ${err.message}`);
    }
  }

  /** Mandate step 3b: session freshness. Advisory — never blocks execution. */
  private checkHandoffFreshness(warnings: string[]): TurnZeroCheck {
    const jsonPath = HANDOFF_FILES[0];
    if (!this.fileExists(jsonPath)) return skipped(`${jsonPath} not present — fresh start`);
    const raw = this.readFile(jsonPath);
    if (raw === null) return failed(`${jsonPath} unreadable`);
    try {
      const parsed = JSON.parse(raw);
      const createdAt = parsed?.created_at ?? parsed?.createdAt;
      if (!createdAt) return skipped(`${jsonPath} carries no created_at field`);
      const ageMs = Date.now() - new Date(createdAt).getTime();
      if (Number.isNaN(ageMs)) return failed(`created_at is not a valid date: ${createdAt}`);
      const ageHours = (ageMs / 3_600_000).toFixed(1);
      if (ageMs > HANDOFF_STALE_AFTER_MS) {
        warnings.push(
          `session-stale: handoff is ${ageHours}h old (>24h) — acknowledge in briefing`
        );
        return ok(`stale: ${ageHours}h old`);
      }
      return ok(`fresh: ${ageHours}h old`);
    } catch (err: any) {
      return failed(`${jsonPath} is not valid JSON: ${err.message}`);
    }
  }

  /** Mandate step 8: confirm an active directive exists before implementation. */
  private checkActiveDirective(): TurnZeroCheck {
    const content = this.readFile('docs/protocols/LIVING_STATE.md');
    if (content === null) return skipped('LIVING_STATE.md unreadable');
    const synchronized = content.includes('[STATUS:SYNCHRONIZED]');
    if (!synchronized) {
      return failed('LIVING_STATE.md is not marked [STATUS:SYNCHRONIZED]');
    }
    return ok('LIVING_STATE.md marked [STATUS:SYNCHRONIZED]');
  }

  /**
   * Mandate step 7 (ASSIMILATE_CHECK), part 1: scan the cron failure log for
   * recurring errors. The mandate calls this mandatory and says it must produce
   * output; previously nothing ran at all.
   */
  private checkAssimilate(warnings: string[]): TurnZeroCheck {
    const outputDir = path.join(os.homedir(), '.hermes', 'cron', 'output');
    if (!fs.existsSync(outputDir)) {
      return skipped(`${outputDir} not present — no failure log to scan`);
    }
    let files: string[];
    try {
      files = fs.readdirSync(outputDir).filter((f) => f.endsWith('.jsonl'));
    } catch (err: any) {
      return failed(`could not read ${outputDir}: ${err.message}`);
    }
    if (files.length === 0) {
      return skipped(`no .jsonl files in ${outputDir} — nothing to scan`);
    }

    const errorCounts = new Map<string, number>();
    for (const file of files) {
      let lines: string[];
      try {
        lines = fs.readFileSync(path.join(outputDir, file), 'utf8').split('\n').slice(-200);
      } catch {
        continue;
      }
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const rec = JSON.parse(line);
          const status = String(rec?.status ?? '');
          if (status !== 'error' && !rec?.error) continue;
          const key = String(rec?.error ?? rec?.message ?? 'unknown').slice(0, 120);
          errorCounts.set(key, (errorCounts.get(key) ?? 0) + 1);
        } catch {
          /* non-JSON line */
        }
      }
    }

    // Mandate: >=3 occurrences of the same error is recurring and warrants a directive.
    const recurring = [...errorCounts.entries()].filter(([, n]) => n >= 3);
    for (const [err, n] of recurring) {
      warnings.push(`recurring failure (${n}x), directive candidate: ${err}`);
    }
    return ok(
      `scanned ${files.length} log file(s), ${errorCounts.size} distinct error(s), ${recurring.length} recurring`
    );
  }

  private renderSystemSurface(log: (line: string) => void): void {
    const user = os.userInfo().username;
    const hostname = os.hostname();
    const platform = os.platform();
    const nodeVer = process.version;
    const freeMem = (os.freemem() / (1024 * 1024 * 1024)).toFixed(1);
    const totalMem = (os.totalmem() / (1024 * 1024 * 1024)).toFixed(1);

    let branch = 'unknown';
    let commit = 'unknown';
    try {
      branch = this.git(['rev-parse', '--abbrev-ref', 'HEAD']);
      commit = this.git(['rev-parse', '--short', 'HEAD']);
    } catch {
      /* ignore */
    }

    log(chalk.cyan('=== TNF System & Environment Surface ==='));
    log(
      `  ${chalk.bold('User & Host:')}   ${chalk.green(user)} @ ${hostname} (${platform}, Node ${nodeVer})`
    );
    log(`  ${chalk.bold('Workspace:')}     ${this.repoRoot}`);
    log(`  ${chalk.bold('Git Lineage:')}   ${chalk.yellow(branch)} (${commit})`);
    log(`  ${chalk.bold('Host Memory:')}   ${freeMem}GB free / ${totalMem}GB total`);
    log(chalk.cyan('=========================================\n'));
  }

  async execute(options: { silent?: boolean } = {}): Promise<TurnZeroResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const stateFiles: string[] = [];
    const frontloadFiles: string[] = [];
    const handoffFiles: string[] = [];
    // Route all cosmetic output through `log` so callers (e.g. the
    // ProtocolInterceptor on --no-splash / --help / non-TTY pipes) can
    // suppress the chatter without losing the underlying check result.
    const log = options.silent
      ? (_line: string) => {
          /* silenced */
        }
      : (line: string) => console.log(line);

    this.renderSystemSurface(log);

    const render = (label: string, check: TurnZeroCheck) => {
      const mark =
        check.state === 'ok'
          ? chalk.green('  ✓')
          : check.state === 'failed'
            ? chalk.red('  ✗')
            : chalk.yellow('  ~');
      const state =
        check.state === 'skipped'
          ? chalk.yellow(' [SKIPPED]')
          : check.state === 'failed'
            ? chalk.red(' [FAILED]')
            : '';
      log(`${mark} ${label}${state}`);
      log(chalk.dim(`      ${check.detail}`));
    };

    log(chalk.cyan('\n=== Turn Zero Mandate ===\n'));

    // Step 1: Read state files
    log(chalk.bold('Step 1: Reading state files...'));
    for (const file of REQUIRED_STATE_FILES) {
      if (this.fileExists(file)) {
        stateFiles.push(file);
        const content = this.readFile(file);
        const preview = content ? content.split('\n').slice(0, 3).join('\n') : '';
        log(chalk.green(`  ✓ ${file}`));
        log(chalk.dim(`    ${preview.replace(/\n/g, '\n    ')}`));
      } else {
        errors.push(`Missing state file: ${file}`);
        log(chalk.red(`  ✗ ${file} - MISSING`));
      }
    }

    if (this.fileExists(STATUS_LEDGER_PATH)) {
      stateFiles.push(STATUS_LEDGER_PATH);
      log(chalk.green(`  ✓ ${STATUS_LEDGER_PATH}`));
    }

    // Step 2: Read frontload policy files
    log(chalk.bold('\nStep 2: Reading frontload policy files...'));
    for (const file of FRONTLOAD_FILES) {
      if (this.fileExists(file)) {
        frontloadFiles.push(file);
        log(chalk.green(`  ✓ ${file}`));
      } else {
        warnings.push(`frontload file not found: ${file}`);
        log(chalk.yellow(`  ~ ${file} - not found (optional)`));
      }
    }

    // Step 3: Read session handoff
    log(chalk.bold('\nStep 3: Reading session handoff...'));
    for (const file of HANDOFF_FILES) {
      if (this.fileExists(file)) {
        handoffFiles.push(file);
        log(chalk.green(`  ✓ ${file}`));
      }
    }
    if (handoffFiles.length === 0) {
      log(chalk.yellow('  ~ No session handoff found (fresh start)'));
    }

    // Step 3b / 4 / 5 / 6 / 7 / 8 — each of these MEASURES and reports honestly.
    const checks = {
      handoffFreshness: this.checkHandoffFreshness(warnings),
      codebaseMap: this.checkCodebaseMap(),
      integrity: this.checkIntegrity(),
      repoSync: this.checkRepoSync(warnings),
      activeDirective: this.checkActiveDirective(),
      assimilate: this.checkAssimilate(warnings),
    };

    log(chalk.bold('\nStep 3b: Session freshness...'));
    render('handoff freshness', checks.handoffFreshness);

    log(chalk.bold('\nStep 4: Codebase structure...'));
    render('codebase_map.json', checks.codebaseMap);

    log(chalk.bold('\nStep 5: Integrity...'));
    render('knowledge tree', checks.integrity);

    // Protocol self-consistency: the mandate must reference what it claims to.
    const turnZeroContent = this.readFile('docs/protocols/TURN_ZERO_MANDATE.md');
    if (turnZeroContent) {
      const expectedRefs = [
        'docs/protocols/LIVING_STATE.md',
        '.agent/SYSTEM_PROMPT.md',
        '.agent/context/resource-map.md',
        '.agent/context/agent-onboarding.md',
      ];
      const missingRefs = expectedRefs.filter((ref) => !turnZeroContent.includes(ref));
      for (const ref of missingRefs) {
        warnings.push(`TURN_ZERO_MANDATE.md missing expected reference: ${ref}`);
        log(chalk.yellow(`  ⚠ TURN_ZERO_MANDATE.md missing expected reference: ${ref}`));
      }
      if (missingRefs.length === 0) log(chalk.green('  ✓ Protocol references validated'));
    }

    log(chalk.bold('\nStep 6: Repository synchronization...'));
    render('repo sync', checks.repoSync);

    log(chalk.bold('\nStep 7: ASSIMILATE_CHECK...'));
    render('failure-log scan', checks.assimilate);

    log(chalk.bold('\nStep 8: Active directive...'));
    render('active directive', checks.activeDirective);

    // A step that FAILED is an error. A step that was SKIPPED is surfaced as a
    // warning and never silently counted as success.
    for (const [name, check] of Object.entries(checks)) {
      if (check.state === 'failed') errors.push(`${name}: ${check.detail}`);
      else if (check.state === 'skipped') warnings.push(`${name} skipped: ${check.detail}`);
    }

    const passed = errors.length === 0;

    log(chalk.bold('\n=== Turn Zero Complete ==='));
    const skippedCount = Object.values(checks).filter((c) => c.state === 'skipped').length;
    if (passed) {
      log(
        chalk.green(
          `\n✓ Turn Zero passed (${stateFiles.length} state files, ${frontloadFiles.length} frontload files, ${handoffFiles.length} handoff artifacts, ${skippedCount} step(s) skipped)`
        )
      );
    } else {
      log(chalk.red(`\n✗ Turn Zero completed with ${errors.length} error(s):`));
      for (const err of errors) log(chalk.red(`  - ${err}`));
    }
    if (warnings.length > 0) {
      log(chalk.yellow(`\n${warnings.length} warning(s):`));
      for (const w of warnings) log(chalk.yellow(`  - ${w}`));
    }

    return { passed, stateFiles, frontloadFiles, handoffFiles, checks, warnings, errors };
  }

  async writeAgentStatusLedger(status: string, details: string): Promise<void> {
    const ledgerPath = this.resolve(STATUS_LEDGER_PATH);
    fs.mkdirSync(path.dirname(ledgerPath), { recursive: true });
    const timestamp = new Date().toISOString();
    const entry = ['', `## ${timestamp}`, `- Status: ${status}`, `- Details: ${details}`, ''].join(
      '\n'
    );
    fs.appendFileSync(ledgerPath, entry, 'utf8');
  }
}
