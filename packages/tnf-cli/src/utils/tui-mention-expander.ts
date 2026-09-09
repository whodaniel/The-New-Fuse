import { execSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';

export interface MentionAttachment {
  name: string;
  type: 'file' | 'git';
  lines: number;
  snippet: string;
}

export interface ExpandMentionsResult {
  expandedPrompt: string;
  attachments: MentionAttachment[];
}

const MAX_ATTACH_BYTES = 64 * 1024; // 64 KB
const MAX_ATTACH_LINES = 500;

/**
 * Detects @mentions in user prompt (e.g. `@path/to/file.ts`, `@docs/foo.md`, `@git:status`, `@git:diff`)
 * and attaches referenced context to the turn prompt.
 */
export function expandPromptMentions(
  prompt: string,
  cwd: string = process.cwd()
): ExpandMentionsResult {
  if (!prompt || typeof prompt !== 'string') {
    return { expandedPrompt: prompt, attachments: [] };
  }

  const attachments: MentionAttachment[] = [];
  const seenMentions = new Set<string>();

  // Match @words that look like file paths or git markers, avoiding email addresses (no pre-@ word chars)
  const mentionRegex = /(?:^|\s)@([a-zA-Z0-9_\-./]+\.[a-zA-Z0-9]+|git:(?:status|diff))/g;
  let match: RegExpExecArray | null;

  while ((match = mentionRegex.exec(prompt)) !== null) {
    const rawTarget = match[1];
    if (seenMentions.has(rawTarget)) continue;
    seenMentions.add(rawTarget);

    // Git markers
    if (rawTarget === 'git:status') {
      try {
        const out = execSync('git status -s', { cwd, encoding: 'utf8', timeout: 5000 }).trim();
        const lines = out ? out.split('\n').length : 0;
        attachments.push({
          name: '@git:status',
          type: 'git',
          lines,
          snippet: out || '(working tree clean)',
        });
      } catch (err: any) {
        attachments.push({
          name: '@git:status',
          type: 'git',
          lines: 1,
          snippet: `Error running git status: ${err?.message ?? err}`,
        });
      }
      continue;
    }

    if (rawTarget === 'git:diff') {
      try {
        const out = execSync('git diff', { cwd, encoding: 'utf8', timeout: 10000 }).trim();
        const lines = out ? out.split('\n').length : 0;
        const truncated =
          lines > MAX_ATTACH_LINES
            ? out.split('\n').slice(0, MAX_ATTACH_LINES).join('\n') +
              `\n[...truncated to ${MAX_ATTACH_LINES} lines]`
            : out;
        attachments.push({
          name: '@git:diff',
          type: 'git',
          lines,
          snippet: truncated || '(no uncommitted git diff)',
        });
      } catch (err: any) {
        attachments.push({
          name: '@git:diff',
          type: 'git',
          lines: 1,
          snippet: `Error running git diff: ${err?.message ?? err}`,
        });
      }
      continue;
    }

    // File path resolution
    const resolvedPath = path.isAbsolute(rawTarget) ? rawTarget : path.resolve(cwd, rawTarget);

    if (fs.existsSync(resolvedPath)) {
      try {
        const stat = fs.statSync(resolvedPath);
        if (stat.isFile()) {
          const content = fs.readFileSync(resolvedPath, 'utf8');
          const allLines = content.split('\n');
          const lineCount = allLines.length;

          let snippet = content;
          if (content.length > MAX_ATTACH_BYTES || lineCount > MAX_ATTACH_LINES) {
            snippet =
              allLines.slice(0, MAX_ATTACH_LINES).join('\n') +
              `\n[...truncated at ${MAX_ATTACH_LINES} lines; total file is ${lineCount} lines (${Math.round(stat.size / 1024)} KB)]`;
          }

          attachments.push({
            name: `@${rawTarget}`,
            type: 'file',
            lines: lineCount,
            snippet,
          });
        }
      } catch {
        // Unreadable file - ignore
      }
    }
  }

  if (attachments.length === 0) {
    return { expandedPrompt: prompt, attachments: [] };
  }

  const contextBlocks = attachments.map((att) => {
    return `[Context attached by operator: ${att.name}]\n${att.snippet}\n[End ${att.name}]`;
  });

  const expandedPrompt = `${contextBlocks.join('\n\n')}\n\n${prompt}`;
  return { expandedPrompt, attachments };
}
