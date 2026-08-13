import chalk from 'chalk';
import fs from 'fs';
import path from 'path';

export type ClassStatusFlag = {
  classType: string | null;
  status: string | null;
  filePath: string;
};

export type ProceduralDisclosureResult = {
  flagsDetected: ClassStatusFlag[];
  contextLoaded: boolean;
  requirementsMatched: boolean;
  ready: boolean;
};

const DOCS_PATTERNS_DIR = 'docs/protocols';

export class ProceduralDisclosureService {
  private repoRoot: string;

  constructor(repoRoot: string) {
    this.repoRoot = repoRoot;
  }

  resolve(relativePath: string): string {
    return path.join(this.repoRoot, relativePath);
  }

  /**
   * Execute the Procedural Disclosure Rule:
   * 1. Context Load - Read LIVING_STATE.md
   * 2. Flag Detection - Identify [CLASS] and [STATUS] flags
   * 3. Requirement Match - Check current inbox/directive
   * 4. Action Sequence - Confirm readiness
   */
  async executeCheck(): Promise<ProceduralDisclosureResult> {
    console.log(chalk.cyan('\n[Procedural Disclosure] Checking protocol alignment...\n'));

    // Step 1: Context Load
    const flagsDetected = this.detectFlags();
    const contextLoaded = flagsDetected.length > 0;

    if (contextLoaded) {
      console.log(chalk.green('  ✓ Context loaded'));
    } else {
      console.log(chalk.yellow('  ~ No [CLASS]/[STATUS] flags detected'));
    }

    // Step 2: Flag Detection
    for (const flag of flagsDetected) {
      const relPath = path.relative(this.repoRoot, flag.filePath);
      console.log(chalk.dim(`    ${relPath}: [CLASS:${flag.classType}] [STATUS:${flag.status}]`));
    }

    // Step 3: Requirement Match - Check LIVING_STATE for directive
    let requirementsMatched = false;
    const livingStatePath = 'docs/protocols/LIVING_STATE.md';
    const livingStateContent = this.readFile(livingStatePath);
    if (livingStateContent) {
      const directiveMatch = livingStateContent.match(/\*\*Current Directive:\*\*\s*(.+)/);
      if (directiveMatch) {
        requirementsMatched = true;
        console.log(chalk.green(`  ✓ Current directive: ${chalk.bold(directiveMatch[1].trim())}`));
      }
    }

    const ready = contextLoaded;
    console.log(chalk.cyan('\n[Procedural Disclosure] Complete'));
    console.log(ready ? chalk.green('  ✓ Ready for action sequence') : chalk.yellow('  ~ Limited protocol context'));

    return { flagsDetected, contextLoaded, requirementsMatched, ready };
  }

  private detectFlags(): ClassStatusFlag[] {
    const flags: ClassStatusFlag[] = [];
    const docsDir = this.resolve(DOCS_PATTERNS_DIR);
    if (!fs.existsSync(docsDir)) return flags;

    const files = fs.readdirSync(docsDir).filter((f) => f.endsWith('.md'));
    for (const file of files) {
      const content = this.readFile(path.join(DOCS_PATTERNS_DIR, file));
      if (!content) continue;
      const classMatch = content.match(/\[CLASS:(\w+)\]/);
      const statusMatch = content.match(/\[STATUS:(\w+)\]/);
      if (classMatch || statusMatch) {
        flags.push({
          classType: classMatch ? classMatch[1] : null,
          status: statusMatch ? statusMatch[1] : null,
          filePath: this.resolve(path.join(DOCS_PATTERNS_DIR, file)),
        });
      }
    }

    return flags;
  }

  private readFile(relativePath: string): string | null {
    try {
      return fs.readFileSync(this.resolve(relativePath), 'utf8');
    } catch {
      return null;
    }
  }
}
