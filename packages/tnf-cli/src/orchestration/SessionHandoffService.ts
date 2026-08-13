import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import { createHash } from 'crypto';

export type HandoffRecord = {
  handoffId: string;
  sessionId: string;
  createdAt: string;
  scope: {
    repository: string;
    branch: string;
    headSha: string;
    sensitivity: 'internal' | 'external';
  };
  workSummary: string[];
  changedPaths: string[];
  verification: Record<string, string>;
  continuation: {
    owner: string;
    targets: string[];
    priority: 'low' | 'medium' | 'high';
    resumeChecklist: string[];
  };
  nextActions: string[];
};

const HANDOFF_JSON_PATH = 'docs/protocols/reports/SESSION_HANDOFF_LATEST.json';
const HANDOFF_MD_PATH = 'docs/protocols/reports/SESSION_HANDOFF_LATEST.md';

export class SessionHandoffService {
  private repoRoot: string;

  constructor(repoRoot: string) {
    this.repoRoot = repoRoot;
  }

  resolve(relativePath: string): string {
    return path.join(this.repoRoot, relativePath);
  }

  readLatestJson(): HandoffRecord | null {
    try {
      const content = fs.readFileSync(this.resolve(HANDOFF_JSON_PATH), 'utf8');
      return JSON.parse(content) as HandoffRecord;
    } catch {
      return null;
    }
  }

  readLatestMd(): string | null {
    try {
      return fs.readFileSync(this.resolve(HANDOFF_MD_PATH), 'utf8');
    } catch {
      return null;
    }
  }

  async writeHandoff(record: HandoffRecord): Promise<void> {
    const jsonPath = this.resolve(HANDOFF_JSON_PATH);
    const mdPath = this.resolve(HANDOFF_MD_PATH);
    fs.mkdirSync(path.dirname(jsonPath), { recursive: true });

    // Write JSON
    fs.writeFileSync(jsonPath, JSON.stringify(record, null, 2), 'utf8');
    console.log(chalk.green(`[Handoff] Wrote ${HANDOFF_JSON_PATH}`));

    // Write Markdown
    const md = this.toMarkdown(record);
    fs.writeFileSync(mdPath, md, 'utf8');
    console.log(chalk.green(`[Handoff] Wrote ${HANDOFF_MD_PATH}`));
  }

  generateHandoffId(): string {
    const seed = `${Date.now()}:${process.pid}:${Math.random()}`;
    return createHash('sha256').update(seed).digest('hex').slice(0, 26);
  }

  private toMarkdown(record: HandoffRecord): string {
    const lines = [
      '# SESSION_HANDOFF_CURRENT',
      '',
      `Protocol ACK: \`TNF_PROTOCOL_ACK\``,
      `Created At: \`${record.createdAt}\``,
      `Handoff ID: \`${record.handoffId}\``,
      `Session ID: \`${record.sessionId}\``,
      '',
      '## Scope',
      '',
      `- Repository: \`${record.scope.repository}\``,
      `- Branch: \`${record.scope.branch}\``,
      `- Head SHA: \`${record.scope.headSha}\``,
      `- Sensitivity: \`${record.scope.sensitivity}\``,
      '',
      '## Work Summary',
      '',
      ...record.workSummary.map((s) => `- ${s}`),
      '',
      '## Changed Paths',
      '',
      ...record.changedPaths.map((p) => `- ${p}`),
      '',
      '## Verification',
      '',
      ...Object.entries(record.verification).map(([key, value]) => `- ${key}: \`${value}\``),
      '',
      '## Continuation',
      '',
      `- Owner: \`${record.continuation.owner}\``,
      `- Targets: ${record.continuation.targets.map((t) => `\`${t}\``).join(', ')}`,
      `- Priority: \`${record.continuation.priority}\``,
      '',
      '### Resume Checklist',
      '',
      ...record.continuation.resumeChecklist.map((c, i) => `${i + 1}. ${c}`),
      '',
      '## Next Actions',
      '',
      ...record.nextActions.map((a) => `- ${a}`),
      '',
    ];
    return lines.join('\n');
  }
}
