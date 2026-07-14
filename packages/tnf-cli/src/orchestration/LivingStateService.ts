import chalk from 'chalk';
import fs from 'fs';
import path from 'path';

export type LivingStateUpdate = {
  stepNumber: number;
  description: string;
  status: 'completed' | 'in_progress' | 'blocked';
  timestamp: string;
};

const LIVING_STATE_PATH = 'docs/protocols/LIVING_STATE.md';
const STATUS_SYNC_MARKER = '[STATUS:SYNCHRONIZED]';

export class LivingStateService {
  private repoRoot: string;

  constructor(repoRoot: string) {
    this.repoRoot = repoRoot;
  }

  resolve(relativePath: string): string {
    return path.join(this.repoRoot, relativePath);
  }

  readCurrentState(): string | null {
    try {
      return fs.readFileSync(this.resolve(LIVING_STATE_PATH), 'utf8');
    } catch {
      return null;
    }
  }

  getCurrentDirective(): string | null {
    const content = this.readCurrentState();
    if (!content) return null;
    const directiveMatch = content.match(/\*\*Current Directive:\*\*\s*(.+)/);
    return directiveMatch ? directiveMatch[1].trim() : null;
  }

  getActiveSteps(): Array<{ number: number; description: string; status: string }> {
    const content = this.readCurrentState();
    if (!content) return [];
    const steps: Array<{ number: number; description: string; status: string }> = [];
    const stepRegex = /(\d+)\.\s+\[([ ✅⚠️✗]*)\]\s+(.+)/g;
    let match;
    while ((match = stepRegex.exec(content)) !== null) {
      const statusText = match[2].trim();
      let status: string;
      if (statusText.includes('✅')) status = 'completed';
      else if (statusText.includes('⚠️')) status = 'in_progress';
      else if (statusText.includes('✗')) status = 'blocked';
      else status = 'pending';
      steps.push({
        number: parseInt(match[1], 10),
        description: match[3].trim(),
        status,
      });
    }
    return steps;
  }

  async appendStep(update: LivingStateUpdate): Promise<void> {
    const statePath = this.resolve(LIVING_STATE_PATH);
    if (!fs.existsSync(statePath)) {
      console.log(chalk.yellow(`[LivingState] ${LIVING_STATE_PATH} not found, creating...`));
      fs.mkdirSync(path.dirname(statePath), { recursive: true });
      fs.writeFileSync(statePath, this.initialState(), 'utf8');
    }

    const statusIcon = update.status === 'completed' ? '✅' : update.status === 'in_progress' ? '⚠️' : '✗';
    const entry = `${update.stepNumber}. [${statusIcon}] ${update.description}`;

    let content = fs.readFileSync(statePath, 'utf8');
    const activeStepsSection = content.match(/## ⚡ Active Steps\n\n[\s\S]*?(?=\n---|\n## )/);
    if (activeStepsSection) {
      const newSection = `## ⚡ Active Steps\n\n${entry}\n`;
      content = content.replace(/## ⚡ Active Steps\n\n[\s\S]*?(?=\n---|\n## )/, newSection);
    } else {
      content += `\n## ⚡ Active Steps\n\n${entry}\n`;
    }

    // Update the last update timestamp
    const timestamp = new Date().toISOString().replace('T', ' ').replace('Z', ' UTC');
    content = content.replace(
      /## 🕒 Last Update\n\n[\s\S]*?(?=\n## )/,
      `## 🕒 Last Update\n\n${timestamp} - ${update.description}\n\n`
    );

    // Ensure SYNCHRONIZED flag
    if (!content.includes(STATUS_SYNC_MARKER)) {
      content = content.replace(
        /^`\[CLASS:PRIME\]/m,
        `[CLASS:PRIME] [${STATUS_SYNC_MARKER.slice(1, -1)}]`
      );
    }

    fs.writeFileSync(statePath, content, 'utf8');
    console.log(chalk.green(`[LivingState] Updated step ${update.stepNumber}: ${update.description}`));
  }

  async markSynced(): Promise<void> {
    const statePath = this.resolve(LIVING_STATE_PATH);
    if (!fs.existsSync(statePath)) return;

    let content = fs.readFileSync(statePath, 'utf8');
    if (!content.includes(STATUS_SYNC_MARKER)) {
      content = content.replace(
        /^`?\[CLASS:PRIME\]/m,
        `[CLASS:PRIME] ${STATUS_SYNC_MARKER}`
      );
      fs.writeFileSync(statePath, content, 'utf8');
    }
  }

  async updateDirective(directive: string): Promise<void> {
    const statePath = this.resolve(LIVING_STATE_PATH);
    if (!fs.existsSync(statePath)) return;

    let content = fs.readFileSync(statePath, 'utf8');
    content = content.replace(
      /\*\*Current Directive:\*\*.*/,
      `**Current Directive:** ${directive}`
    );
    fs.writeFileSync(statePath, content, 'utf8');
  }

  private initialState(): string {
    const timestamp = new Date().toISOString().replace('T', ' ').replace('Z', ' UTC');
    return [
      `# LIVING_STATE.md - Active Session Synchronization`,
      '',
      `[CLASS:PRIME] ${STATUS_SYNC_MARKER}`,
      '',
      `**Current Directive:** Initializing protocol-aware session`,
      `**Created:** ${timestamp}`,
      '',
      '---',
      '',
      '## ⚡ Active Steps',
      '',
      '1. [⚠️] Initialize protocol-aware CLI agent session',
      '',
      '---',
      '',
      '## 🕒 Last Update',
      '',
      `${timestamp} - Session initialized`,
      '',
    ].join('\n');
  }
}
