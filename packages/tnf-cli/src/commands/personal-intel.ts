/**
 * tnf personal-intel — build / upload owner-scoped Personal Intelligence index.
 *
 * Local store: ~/.tnf/personal-intelligence/
 * Cloud: PUT /api/personal-intelligence (JWT required)
 */
import chalk from 'chalk';
import type { Command } from 'commander';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { findCommand, getOrCreateCommand } from './_registry.js';

type PersonalIntelSourceId = 'google_ai' | 'apple_notes' | 'cli_import' | 'other';

interface PersonalIntelItem {
  id: string;
  source: PersonalIntelSourceId;
  sourceLabel: string;
  title: string;
  subtitle?: string;
  activityAt?: string;
  metricLabel?: string;
  metricValue?: string | number;
  workspace?: string;
  project?: string;
  resumeHint?: string;
}

interface SourceModuleStatus {
  id: string;
  name: string;
  kind: string;
  description: string;
  status: 'mirrored' | 'available' | 'not_mirrored' | 'not_connected';
  itemCount?: number;
  mirrorPath?: string;
  cliHint?: string;
}

interface UnifiedPersonalIntelPayload {
  generatedAt: string;
  totalItems: number;
  sources: SourceModuleStatus[];
  items: PersonalIntelItem[];
}

function defaultApiBase(): string {
  return (
    process.env.TNF_API_BASE ||
    process.env.TNF_LOCAL_API ||
    'http://127.0.0.1:3002/api'
  ).replace(/\/$/, '');
}

function requireToken(explicit?: string): string {
  const token = (explicit || process.env.TNF_JWT || process.env.TNF_TOKEN || '').trim();
  if (!token) {
    throw new Error('JWT required. Pass --token <jwt> or set TNF_JWT.');
  }
  return token;
}

function intelDir(): string {
  return path.join(os.homedir(), '.tnf', 'personal-intelligence');
}

function indexPath(): string {
  return path.join(intelDir(), 'personal_intelligence_index.json');
}

function mapGoogleSessions(): PersonalIntelItem[] {
  const concordanceFile = path.join(intelDir(), 'google_ai_session_concordance.json');
  if (!fs.existsSync(concordanceFile)) return [];
  try {
    const data = JSON.parse(fs.readFileSync(concordanceFile, 'utf8'));
    const sessions: Array<Record<string, unknown>> = Array.isArray(data.sessions)
      ? data.sessions
      : [];
    return sessions.map((s) => {
      const sessionId = String(s.sessionId || s.id || '');
      const conversationId = String(s.conversationId || '');
      const workspace = String(s.workspace || '');
      return {
        id: sessionId || conversationId,
        source: 'google_ai' as const,
        sourceLabel: 'Google AI',
        title: String(s.title || 'Untitled session'),
        subtitle: conversationId || undefined,
        activityAt: String(s.lastActive || ''),
        metricLabel: 'steps',
        metricValue: Number(s.stepCount || 0),
        workspace,
        project: String(s.project || ''),
        resumeHint: conversationId
          ? `cd ${workspace.replace(/\["file:\/\//g, '').replace(/"\]/g, '') || '.'} && agy resume ${conversationId}`
          : undefined,
      };
    });
  } catch {
    return [];
  }
}

function mapFactoids(): PersonalIntelItem[] {
  const factoidsFile = path.join(intelDir(), 'library-factoids.json');
  if (!fs.existsSync(factoidsFile)) return [];
  try {
    const data = JSON.parse(fs.readFileSync(factoidsFile, 'utf8'));
    const rows: Array<Record<string, unknown>> = Array.isArray(data.factoids)
      ? data.factoids
      : Array.isArray(data.items)
        ? data.items
        : [];
    const mapped: PersonalIntelItem[] = [];
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const title = String(row.title || row.text || '').trim();
      if (!title) continue;
      mapped.push({
        id: String(row.id || `factoid-${i + 1}`),
        source: 'cli_import',
        sourceLabel: 'CLI / factoid',
        title,
        subtitle: row.description ? String(row.description) : undefined,
        activityAt: String(row.date || row.eventDate || ''),
        metricLabel: 'tags',
        metricValue: Array.isArray(row.tags) ? row.tags.length : undefined,
      });
    }
    return mapped;
  } catch {
    return [];
  }
}

function mapAppleNotes(): PersonalIntelItem[] {
  const notesFile = path.join(intelDir(), 'apple_notes_intelligence_distillation.md');
  if (!fs.existsSync(notesFile)) return [];
  const stat = fs.statSync(notesFile);
  const raw = fs.readFileSync(notesFile, 'utf8');
  const firstHeading = raw
    .split('\n')
    .map((l) => l.trim())
    .find((l) => l.startsWith('#'));
  return [
    {
      id: 'apple-notes-distillation',
      source: 'apple_notes',
      sourceLabel: 'Apple Notes',
      title: firstHeading
        ? firstHeading.replace(/^#+\s*/, '').slice(0, 200)
        : 'Apple Notes intelligence distillation',
      subtitle: notesFile,
      activityAt: stat.mtime.toISOString(),
      metricLabel: 'bytes',
      metricValue: stat.size,
    },
  ];
}

function baseSources(items: PersonalIntelItem[]): SourceModuleStatus[] {
  const counts = new Map<string, number>();
  for (const item of items) {
    counts.set(item.source, (counts.get(item.source) || 0) + 1);
  }
  const catalog: SourceModuleStatus[] = [
    {
      id: 'google_ai',
      name: 'Google Gemini / Antigravity',
      kind: 'session_bridge',
      description: 'Optional session bridge for Google AI / Antigravity conversations.',
      status: counts.has('google_ai') ? 'mirrored' : 'not_mirrored',
      itemCount: counts.get('google_ai'),
      cliHint: 'tnf google-ai sync && tnf personal-intel index',
      mirrorPath: '~/.tnf/personal-intelligence/google_ai_session_concordance.json',
    },
    {
      id: 'apple_notes',
      name: 'Apple Notes',
      kind: 'notes',
      description: 'Distilled notes intelligence from the operator-local Apple Notes corpus.',
      status: counts.has('apple_notes') ? 'mirrored' : 'not_connected',
      itemCount: counts.get('apple_notes'),
      cliHint: '~/.tnf/personal-intelligence/apple_notes_intelligence_distillation.md',
    },
    {
      id: 'google_drive',
      name: 'Google Drive',
      kind: 'storage_location',
      description: 'Consented Drive location pointers (metadata only — not connected).',
      status: 'not_connected',
    },
    {
      id: 'dropbox',
      name: 'Dropbox',
      kind: 'storage_location',
      description: 'Bring-your-own Dropbox location registry entry (planned connector).',
      status: 'not_connected',
    },
    {
      id: 'onedrive',
      name: 'OneDrive',
      kind: 'storage_location',
      description:
        'Bring-your-own OneDrive / Microsoft 365 location registry entry (planned connector).',
      status: 'not_connected',
    },
    {
      id: 'local_device',
      name: 'Local device',
      kind: 'local',
      description: 'Approved local path hints and device-local working sets (planned connector).',
      status: 'not_connected',
    },
    {
      id: 'private_github',
      name: 'Private GitHub',
      kind: 'cli',
      description: 'Private repo locations for personal or client artifacts (planned connector).',
      status: 'not_connected',
    },
    {
      id: 'cli_import',
      name: 'CLI / file import',
      kind: 'cli',
      description: 'Operator CLI and file drops into ~/.tnf/personal-intelligence/.',
      status: counts.has('cli_import') ? 'mirrored' : 'available',
      itemCount: counts.get('cli_import'),
      cliHint: 'tnf personal-intel index',
    },
  ];
  return catalog;
}

export function buildUnifiedIndex(): UnifiedPersonalIntelPayload {
  const items = [...mapGoogleSessions(), ...mapFactoids(), ...mapAppleNotes()];
  return {
    generatedAt: new Date().toISOString(),
    totalItems: items.length,
    sources: baseSources(items),
    items,
  };
}

export function writeUnifiedIndex(
  payload?: UnifiedPersonalIntelPayload
): UnifiedPersonalIntelPayload {
  const dir = intelDir();
  fs.mkdirSync(dir, { recursive: true });
  const index = payload || buildUnifiedIndex();
  const out = indexPath();
  const tmp = `${out}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(index, null, 2));
  fs.renameSync(tmp, out);
  return index;
}

async function uploadIndex(
  apiBase: string,
  token: string,
  payload: UnifiedPersonalIntelPayload
): Promise<UnifiedPersonalIntelPayload> {
  const url = `${apiBase.replace(/\/$/, '')}/personal-intelligence`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Upload failed HTTP_${res.status}: ${text.slice(0, 400)}`);
  }
  try {
    return JSON.parse(text) as UnifiedPersonalIntelPayload;
  } catch {
    return payload;
  }
}

export function registerPersonalIntelCommand(program: Command): void {
  const cmd = getOrCreateCommand(
    program,
    'personal-intel',
    'Build and upload owner-scoped Personal Intelligence unified index'
  );
  // No short alias: `pi` is already a top-level TNF command.

  if (!findCommand(cmd, 'index')) {
    cmd
      .command('index')
      .description(
        'Build ~/.tnf/personal-intelligence/personal_intelligence_index.json from local sources'
      )
      .option('--json', 'Print the index JSON')
      .option(
        '--mirror',
        'Also copy index (+ google concordance) into apps/frontend/public/local-intel/ when repo is detectable'
      )
      .action((options: { json?: boolean; mirror?: boolean }) => {
        const index = writeUnifiedIndex();
        if (options.mirror) {
          const repoCandidates = [
            process.env.TNF_REPO_ROOT,
            path.join(os.homedir(), 'Desktop/A1-Inter-LLM-Com/TNF/The-New-Fuse'),
          ].filter(Boolean) as string[];
          for (const root of repoCandidates) {
            const destDir = path.join(root, 'apps/frontend/public/local-intel');
            if (!fs.existsSync(path.dirname(destDir))) continue;
            fs.mkdirSync(destDir, { recursive: true });
            fs.copyFileSync(indexPath(), path.join(destDir, 'personal_intelligence_index.json'));
            const concordance = path.join(intelDir(), 'google_ai_session_concordance.json');
            if (fs.existsSync(concordance)) {
              fs.copyFileSync(
                concordance,
                path.join(destDir, 'google_ai_session_concordance.json')
              );
            }
            console.log(chalk.dim(`  Mirrored into ${destDir}`));
            break;
          }
        }
        if (options.json) {
          console.log(JSON.stringify(index, null, 2));
          return;
        }
        console.log(
          chalk.green(
            `\n✓ Personal Intelligence index written (${index.totalItems} items) → ${indexPath()}\n`
          )
        );
        console.log(chalk.dim('  Upload with: tnf personal-intel upload --token <jwt>\n'));
      });
  }

  if (!findCommand(cmd, 'upload')) {
    cmd
      .command('upload')
      .description('PUT unified index to auth’d /api/personal-intelligence')
      .option('--token <jwt>', 'Auth JWT (or TNF_JWT)')
      .option('--api <url>', 'API base including /api', defaultApiBase())
      .option('--use-existing', 'Upload existing index without rebuilding')
      .option('--json', 'Machine-readable output')
      .action(
        async (options: {
          token?: string;
          api?: string;
          useExisting?: boolean;
          json?: boolean;
        }) => {
          try {
            const token = requireToken(options.token);
            const payload =
              options.useExisting && fs.existsSync(indexPath())
                ? (JSON.parse(fs.readFileSync(indexPath(), 'utf8')) as UnifiedPersonalIntelPayload)
                : writeUnifiedIndex();
            const result = await uploadIndex(options.api || defaultApiBase(), token, payload);
            if (options.json) {
              console.log(JSON.stringify(result, null, 2));
              return;
            }
            console.log(
              chalk.green(
                `\n✓ Uploaded Personal Intelligence index (${result.totalItems ?? payload.totalItems} items)\n`
              )
            );
            console.log(
              chalk.dim(`  API: ${options.api || defaultApiBase()}/personal-intelligence\n`)
            );
          } catch (err: any) {
            console.error(chalk.red(`Error: ${err.message}`));
            process.exit(1);
          }
        }
      );
  }

  if (!findCommand(cmd, 'status')) {
    cmd
      .command('status')
      .description('Show local Personal Intelligence store + index summary')
      .option('--json', 'Machine-readable output')
      .action((options: { json?: boolean }) => {
        const dir = intelDir();
        const files = fs.existsSync(dir)
          ? fs.readdirSync(dir).filter((f) => !f.startsWith('.'))
          : [];
        const hasIndex = fs.existsSync(indexPath());
        let totalItems = 0;
        let generatedAt = '';
        if (hasIndex) {
          try {
            const idx = JSON.parse(fs.readFileSync(indexPath(), 'utf8'));
            totalItems = Number(idx.totalItems || idx.items?.length || 0);
            generatedAt = String(idx.generatedAt || '');
          } catch {
            /* ignore */
          }
        }
        const summary = {
          intelDir: dir,
          files,
          hasIndex,
          indexPath: indexPath(),
          totalItems,
          generatedAt,
        };
        if (options.json) {
          console.log(JSON.stringify(summary, null, 2));
          return;
        }
        console.log(chalk.bold('\nPersonal Intelligence (local)\n'));
        console.log(`  Dir:     ${dir}`);
        console.log(`  Files:   ${files.join(', ') || '(none)'}`);
        console.log(
          `  Index:   ${hasIndex ? `${totalItems} items @ ${generatedAt || '?'}` : 'missing'}`
        );
        console.log('');
      });
  }
}
