import chalk from 'chalk';
import fs from 'fs';
import path from 'path';

export type AssimilationDirective = {
  id: string;
  source: string;
  capability: string;
  gapDescription: string;
  proposedIntegration: string;
  attribution: string;
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  status: 'draft' | 'dispatched' | 'integrated';
};

const ASSIMILATION_DIRECTIVES_PATH = 'data/protocols/assimilation-directives.jsonl';
const LEDGER_PATH = 'docs/protocols/AGENT_STATUS_LEDGER.md';

export class AssimilationEngine {
  private repoRoot: string;

  constructor(repoRoot: string) {
    this.repoRoot = repoRoot;
  }

  resolve(relativePath: string): string {
    return path.join(this.repoRoot, relativePath);
  }

  /**
   * Execute the ASSIMILATE_CHECK protocol:
   * 1. Assess - Does external capability have features TNF lacks?
   * 2. Extract - Distill the core methodology
   * 3. Attribute - Preserve human/scientific provenance
   * 4. Dispatch - Route to Forge or Continuous Improver
   */
  async runAssimilateCheck(context: {
    sourceType: 'news' | 'research' | 'capability' | 'framework' | 'tool';
    sourceName: string;
    discoveredCapabilities: string[];
    attribution?: string;
  }): Promise<AssimilationDirective[]> {
    console.log(chalk.cyan(`\n[ASSIMILATE_CHECK] Analyzing: ${context.sourceName}\n`));

    const directives: AssimilationDirective[] = [];

    for (const capability of context.discoveredCapabilities) {
      const directive = this.assessCapability(capability, context);
      if (directive) {
        directives.push(directive);
        await this.persistDirective(directive);
      }
    }

    if (directives.length > 0) {
      console.log(chalk.green(`\n[ASSIMILATE_CHECK] Generated ${directives.length} assimilation directive(s)`));
      for (const d of directives) {
        console.log(chalk.dim(`  - [${d.priority}] ${d.capability}: ${d.gapDescription}`));
      }
    } else {
      console.log(chalk.dim('\n[ASSIMILATE_CHECK] No assimilation opportunities identified'));
    }

    return directives;
  }

  private assessCapability(
    capability: string,
    context: { sourceType: string; sourceName: string; attribution?: string }
  ): AssimilationDirective | null {
    const lower = capability.toLowerCase();

    // Skip standard software patterns
    const standardPatterns = [
      'npm', 'pnpm', 'git', 'docker', 'kubernetes', 'rest api', 'graphql',
      'websocket', 'http', 'tcp', 'redis', 'postgresql', 'typescript', 'javascript',
      'python', 'react', 'node.js', 'nestjs',
    ];
    if (standardPatterns.some((p) => lower.includes(p))) {
      return null;
    }

    const id = `assim-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

    return {
      id,
      source: context.sourceName,
      capability,
      gapDescription: `TNF should evaluate native support for: ${capability}`,
      proposedIntegration: `Investigate and implement ${capability} within TNF framework`,
      attribution: context.attribution || 'AI-assisted discovery',
      priority: 'medium',
      createdAt: new Date().toISOString(),
      status: 'draft',
    };
  }

  private async persistDirective(directive: AssimilationDirective): Promise<void> {
    const dirPath = this.resolve(path.dirname(ASSIMILATION_DIRECTIVES_PATH));
    fs.mkdirSync(dirPath, { recursive: true });
    fs.appendFileSync(
      this.resolve(ASSIMILATION_DIRECTIVES_PATH),
      JSON.stringify(directive) + '\n',
      'utf8'
    );
  }

  async readPendingDirectives(): Promise<AssimilationDirective[]> {
    const filePath = this.resolve(ASSIMILATION_DIRECTIVES_PATH);
    if (!fs.existsSync(filePath)) return [];
    const directives: AssimilationDirective[] = [];
    const lines = fs.readFileSync(filePath, 'utf8').split('\n');
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        directives.push(JSON.parse(line));
      } catch {
        // Skip corrupt lines
      }
    }
    return directives.filter((d) => d.status === 'draft');
  }

  async writeAgentStatus(summary: string): Promise<void> {
    const ledgerPath = this.resolve(LEDGER_PATH);
    fs.mkdirSync(path.dirname(ledgerPath), { recursive: true });
    const timestamp = new Date().toISOString();
    const entry = [
      '',
      `### Status Update: ${timestamp}`,
      `- ${summary}`,
      '',
    ].join('\n');
    fs.appendFileSync(ledgerPath, entry, 'utf8');
  }

  /**
   * Verify an external provider CLI is installed (for assimilation routing).
   */
  verifyProviderInstalled(provider: string): boolean {
    try {
      const { spawnSync } = require('child_process');
      const result = spawnSync('which', [provider], { encoding: 'utf8' });
      return result.status === 0;
    } catch {
      return false;
    }
  }
}
