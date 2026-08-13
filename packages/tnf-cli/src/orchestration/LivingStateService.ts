import chalk from 'chalk';
import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { writeFileAtomic } from '../utils/safe-fs.js';

export type LivingStateUpdate = {
  stepNumber: number;
  description: string;
  status: 'completed' | 'in_progress' | 'blocked';
  timestamp: string;
};

const LIVING_STATE_PATH = 'docs/protocols/LIVING_STATE.md';
const STATUS_SYNC_MARKER = '[STATUS:SYNCHRONIZED]';
const STATUS_DRIFT_MARKER = '[STATUS:DRIFT]';
const DIRECTIVE_START = '<!-- CURRENT_DIRECTIVE:START -->';
const DIRECTIVE_END = '<!-- CURRENT_DIRECTIVE:END -->';

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
    const fence = content.match(
      /<!--\s*CURRENT_DIRECTIVE:START\s*-->\s*([\s\S]*?)\s*<!--\s*CURRENT_DIRECTIVE:END\s*-->/
    );
    if (fence)
      return fence[1]
        .trim()
        .replace(/^\*\*Current Directive:\*\*\s*/i, '')
        .trim();
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

  /** Tip-align honesty: SYNCHRONIZED only when handoff head_sha matches git HEAD. */
  computeTipStatus(): { aligned: boolean; head: string; handoffSha: string; marker: string } {
    let head = '';
    try {
      head = execFileSync('git', ['-C', this.repoRoot, 'rev-parse', 'HEAD'], {
        encoding: 'utf8',
      }).trim();
    } catch {
      head = '';
    }
    let handoffSha = '';
    try {
      const raw = fs.readFileSync(
        this.resolve('docs/protocols/reports/SESSION_HANDOFF_LATEST.json'),
        'utf8'
      );
      const parsed = JSON.parse(raw) as { head_sha?: string; headSha?: string };
      handoffSha = String(parsed.head_sha || parsed.headSha || '');
    } catch {
      handoffSha = '';
    }
    const aligned = Boolean(
      head &&
      handoffSha &&
      (head === handoffSha ||
        head.startsWith(handoffSha) ||
        handoffSha.startsWith(head.slice(0, 12)))
    );
    return {
      aligned,
      head,
      handoffSha,
      marker: aligned ? STATUS_SYNC_MARKER : STATUS_DRIFT_MARKER,
    };
  }

  applyStatusMarker(content: string, marker: string = this.computeTipStatus().marker): string {
    let next = content.replace(/\[STATUS:(?:SYNCHRONIZED|DRIFT)\]/g, marker);
    if (!next.includes(marker)) {
      next = next.replace(/^`?\[CLASS:PRIME\][^\n]*/m, `[CLASS:PRIME] ${marker}`);
    }
    // Keep class line backticked only if the file already used that style with one status.
    next = next.replace(
      /^`\[CLASS:PRIME\]\s*\[STATUS:(?:SYNCHRONIZED|DRIFT)\]`$/m,
      `\`[CLASS:PRIME] ${marker}\``
    );
    next = next.replace(
      /^\[CLASS:PRIME\]\s*\[STATUS:(?:SYNCHRONIZED|DRIFT)\]$/m,
      `[CLASS:PRIME] ${marker}`
    );
    return next;
  }

  async appendStep(update: LivingStateUpdate): Promise<void> {
    const statePath = this.resolve(LIVING_STATE_PATH);
    if (!fs.existsSync(statePath)) {
      console.log(chalk.yellow(`[LivingState] ${LIVING_STATE_PATH} not found, creating...`));
      fs.mkdirSync(path.dirname(statePath), { recursive: true });
      writeFileAtomic(statePath, this.initialState());
    }

    const statusIcon =
      update.status === 'completed' ? '✅' : update.status === 'in_progress' ? '⚠️' : '✗';
    const entry = `${update.stepNumber}. [${statusIcon}] ${update.description}`;

    let content = fs.readFileSync(statePath, 'utf8');
    const activeStepsSection = content.match(/## ⚡ Active Steps\n\n[\s\S]*?(?=\n---|\n## )/);
    if (activeStepsSection) {
      const newSection = `## ⚡ Active Steps\n\n${entry}\n`;
      content = content.replace(/## ⚡ Active Steps\n\n[\s\S]*?(?=\n---|\n## )/, newSection);
    } else {
      content += `\n## ⚡ Active Steps\n\n${entry}\n`;
    }

    const timestamp = new Date().toISOString().replace('T', ' ').replace('Z', ' UTC');
    content = content.replace(
      /## 🕒 Last Update\n\n[\s\S]*?(?=\n## )/,
      `## 🕒 Last Update\n\n${timestamp} - ${update.description}\n\n`
    );

    content = this.applyStatusMarker(content);
    writeFileAtomic(statePath, content);
    console.log(
      chalk.green(`[LivingState] Updated step ${update.stepNumber}: ${update.description}`)
    );
  }

  async markSynced(): Promise<void> {
    const statePath = this.resolve(LIVING_STATE_PATH);
    if (!fs.existsSync(statePath)) return;

    let content = fs.readFileSync(statePath, 'utf8');
    content = this.applyStatusMarker(content);
    writeFileAtomic(statePath, content);
  }

  async updateDirective(directive: string): Promise<void> {
    const statePath = this.resolve(LIVING_STATE_PATH);
    if (!fs.existsSync(statePath)) return;

    const clean = String(directive || '')
      .trim()
      .replace(/\s+/g, ' ')
      .slice(0, 400);
    const slot = [DIRECTIVE_START, `**Current Directive:** ${clean}`, DIRECTIVE_END].join('\n');

    let content = fs.readFileSync(statePath, 'utf8');
    const fenceRe =
      /<!--\s*CURRENT_DIRECTIVE:START\s*-->[\s\S]*?<!--\s*CURRENT_DIRECTIVE:END\s*-->/;
    if (fenceRe.test(content)) {
      content = content.replace(fenceRe, slot);
    } else if (/\*\*Current Directive:\*\*/.test(content)) {
      content = content.replace(
        /\*\*Current Directive:\*\*[\s\S]*?(?=\n\n\*\*|\n\n## |\n---)/,
        `${slot}\n`
      );
    } else {
      content = content.replace(/^(`?\[CLASS:PRIME\][^\n]*\n+)/m, `$1\n${slot}\n\n`);
    }
    content = this.applyStatusMarker(content);
    writeFileAtomic(statePath, content);
  }

  private initialState(): string {
    const timestamp = new Date().toISOString().replace('T', ' ').replace('Z', ' UTC');
    const tip = this.computeTipStatus();
    return [
      `# LIVING_STATE.md - Active Session Synchronization`,
      '',
      `[CLASS:PRIME] ${tip.marker}`,
      '',
      DIRECTIVE_START,
      `**Current Directive:** Initializing protocol-aware session`,
      DIRECTIVE_END,
      '',
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
      '## History',
      '',
      '_Prior Current Directive sludge archived here when fences replace-between-markers._',
      '',
    ].join('\n');
  }
}
