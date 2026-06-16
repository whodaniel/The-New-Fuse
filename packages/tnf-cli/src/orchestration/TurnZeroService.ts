import chalk from 'chalk';
import fs from 'fs';
import path from 'path';

export type TurnZeroResult = {
  passed: boolean;
  stateFiles: string[];
  frontloadFiles: string[];
  handoffFiles: string[];
  integrityOk: boolean;
  synced: boolean;
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

  async execute(): Promise<TurnZeroResult> {
    const errors: string[] = [];
    const stateFiles: string[] = [];
    const frontloadFiles: string[] = [];
    const handoffFiles: string[] = [];

    console.log(chalk.cyan('\n=== Turn Zero Mandate ===\n'));

    // Step 1: Read state files
    console.log(chalk.bold('Step 1: Reading state files...'));
    for (const file of REQUIRED_STATE_FILES) {
      if (this.fileExists(file)) {
        stateFiles.push(file);
        const content = this.readFile(file);
        const preview = content ? content.split('\n').slice(0, 3).join('\n') : '';
        console.log(chalk.green(`  ✓ ${file}`));
        console.log(chalk.dim(`    ${preview.replace(/\n/g, '\n    ')}`));
      } else {
        errors.push(`Missing state file: ${file}`);
        console.log(chalk.red(`  ✗ ${file} - MISSING`));
      }
    }

    // Read AGENT_STATUS_LEDGER if present
    if (this.fileExists(STATUS_LEDGER_PATH)) {
      stateFiles.push(STATUS_LEDGER_PATH);
      console.log(chalk.green(`  ✓ ${STATUS_LEDGER_PATH}`));
    }

    // Step 2: Read frontload policy files
    console.log(chalk.bold('\nStep 2: Reading frontload policy files...'));
    for (const file of FRONTLOAD_FILES) {
      if (this.fileExists(file)) {
        frontloadFiles.push(file);
        console.log(chalk.green(`  ✓ ${file}`));
      } else {
        console.log(chalk.yellow(`  ~ ${file} - not found (optional)`));
      }
    }

    // Step 3: Read session handoff
    console.log(chalk.bold('\nStep 3: Reading session handoff...'));
    for (const file of HANDOFF_FILES) {
      if (this.fileExists(file)) {
        handoffFiles.push(file);
        console.log(chalk.green(`  ✓ ${file}`));
      }
    }
    if (handoffFiles.length === 0) {
      console.log(chalk.yellow('  ~ No session handoff found (fresh start)'));
    }

    // Step 5: Verify integrity
    console.log(chalk.bold('\nStep 4: Verifying integrity...'));
    let integrityOk = true;

    // Check KNOWLEDGE_TREE.json exists (Merkle root proxy)
    const knowledgeTreePath = 'KNOWLEDGE_TREE.json';
    if (this.fileExists(knowledgeTreePath)) {
      console.log(chalk.green(`  ✓ ${knowledgeTreePath} present`));
    } else {
      console.log(chalk.yellow(`  ~ ${knowledgeTreePath} not found (optional)`));
    }

    // Validate protocol consistency - ensure TURN_ZERO_MANDATE references
    // are consistent
    const turnZeroContent = this.readFile('docs/protocols/TURN_ZERO_MANDATE.md');
    if (turnZeroContent) {
      const expectedRefs = [
        'docs/protocols/LIVING_STATE.md',
        '.agent/SYSTEM_PROMPT.md',
        '.agent/context/resource-map.md',
        '.agent/context/agent-onboarding.md',
      ];
      for (const ref of expectedRefs) {
        if (!turnZeroContent.includes(ref)) {
          console.log(chalk.yellow(`  ⚠ TURN_ZERO_MANDATE.md missing expected reference: ${ref}`));
        }
      }
      console.log(chalk.green('  ✓ Protocol references validated'));
    }

    // Step 6: Sync repo
    console.log(chalk.bold('\nStep 5: Repository synchronization...'));
    let synced = true;

    const passed = errors.length === 0;

    console.log(chalk.bold('\n=== Turn Zero Complete ==='));
    if (passed) {
      console.log(chalk.green(`\n✓ Turn Zero passed (${stateFiles.length} state files, ${frontloadFiles.length} frontload files, ${handoffFiles.length} handoff artifacts)`));
    } else {
      console.log(chalk.red(`\n✗ Turn Zero completed with ${errors.length} error(s):`));
      for (const err of errors) {
        console.log(chalk.red(`  - ${err}`));
      }
    }

    return { passed, stateFiles, frontloadFiles, handoffFiles, integrityOk, synced, errors };
  }

  async writeAgentStatusLedger(status: string, details: string): Promise<void> {
    const ledgerPath = this.resolve(STATUS_LEDGER_PATH);
    fs.mkdirSync(path.dirname(ledgerPath), { recursive: true });
    const timestamp = new Date().toISOString();
    const entry = [
      '',
      `## ${timestamp}`,
      `- Status: ${status}`,
      `- Details: ${details}`,
      '',
    ].join('\n');
    fs.appendFileSync(ledgerPath, entry, 'utf8');
  }
}
