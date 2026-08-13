import chalk from 'chalk';
import { createHash } from 'crypto';
import fs from 'fs';
import path from 'path';
import { writeFileAtomic } from '../utils/safe-fs.js';

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
    priority: 'low' | 'medium' | 'high' | 'critical';
    resumeChecklist: string[];
  };
  nextActions: string[];
};

const HANDOFF_JSON_PATH = 'docs/protocols/reports/SESSION_HANDOFF_LATEST.json';
const HANDOFF_MD_PATH = 'docs/protocols/reports/SESSION_HANDOFF_LATEST.md';

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((entry) => String(entry)).filter(Boolean);
}

function normalizeHandoff(raw: Record<string, unknown> | null): HandoffRecord | null {
  if (!raw || typeof raw !== 'object') return null;

  const handoffId = String(raw.handoff_id ?? raw.handoffId ?? '').trim();
  if (!handoffId) return null;

  const continuationRaw =
    raw.continuation && typeof raw.continuation === 'object'
      ? (raw.continuation as Record<string, unknown>)
      : {};
  const verificationRaw =
    raw.verification && typeof raw.verification === 'object'
      ? (raw.verification as Record<string, string>)
      : {};

  const sensitivity = String(raw.sensitive_scope ?? raw.sensitivity ?? 'internal');
  const normalizedSensitivity: HandoffRecord['scope']['sensitivity'] =
    sensitivity === 'external' ? 'external' : 'internal';

  const priority = String(continuationRaw.priority ?? 'medium');
  const normalizedPriority: HandoffRecord['continuation']['priority'] =
    priority === 'low' || priority === 'medium' || priority === 'high' || priority === 'critical'
      ? priority
      : 'medium';

  return {
    handoffId,
    sessionId: String(raw.session_id ?? raw.sessionId ?? handoffId),
    createdAt: String(raw.created_at ?? raw.createdAt ?? ''),
    scope: {
      repository: String(raw.repository ?? 'The-New-Fuse'),
      branch: String(raw.branch ?? 'unknown'),
      headSha: String(raw.head_sha ?? raw.headSha ?? ''),
      sensitivity: normalizedSensitivity,
    },
    workSummary: asStringArray(raw.work_summary ?? raw.workSummary),
    changedPaths: asStringArray(raw.changed_paths ?? raw.changedPaths),
    verification: verificationRaw,
    continuation: {
      owner: String(continuationRaw.owner ?? 'tnf-orchestrator'),
      targets: asStringArray(continuationRaw.targets),
      priority: normalizedPriority,
      resumeChecklist: asStringArray(
        continuationRaw.resume_checklist ?? continuationRaw.resumeChecklist
      ),
    },
    nextActions: asStringArray(raw.next_actions ?? raw.nextActions),
  };
}

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
      const parsed = JSON.parse(content) as Record<string, unknown>;
      return normalizeHandoff(parsed);
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

    // Atomic: a torn write here would crash the next boot (ProtocolInterceptor
    // treats null handoff as a hard fail). writeFileAtomic stages to tmp and
    // rename(2)s into place so readers always see a complete record.
    writeFileAtomic(jsonPath, JSON.stringify(record, null, 2));
    console.log(chalk.green(`[Handoff] Wrote ${HANDOFF_JSON_PATH}`));

    const md = this.toMarkdown(record);
    writeFileAtomic(mdPath, md);
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

export { normalizeHandoff };
