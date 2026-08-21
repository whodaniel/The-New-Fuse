import { authFetch } from '@/utils/authToken';

export type BrowserTaskResult = {
  ok: boolean;
  url: string | null;
  title?: string | null;
  steps: Array<{ step: string; ok: boolean; detail?: unknown }>;
  snapshot: unknown;
  screenshotDataUrl?: string | null;
  session?: BrowserSession;
  hint?: string;
};

export type BrowserSession = {
  controlling: boolean;
  available: boolean;
  engine?: string;
  url: string | null;
  title: string | null;
  lastTask: string | null;
  lastError: string | null;
  screenshotDataUrl: string | null;
  snapshot: unknown;
  updatedAt: string | null;
  canonicalEntry?: string;
};

export type BrowserInteractOp =
  | 'open'
  | 'snapshot'
  | 'screenshot'
  | 'click'
  | 'fill'
  | 'type'
  | 'back'
  | 'forward'
  | 'reload'
  | 'close';

export async function fetchBrowserPreview(): Promise<BrowserSession | null> {
  const res = await authFetch('/api/browser/preview');
  if (!res.ok) return null;
  const body = await res.json();
  return body?.data ?? null;
}

export async function runBrowserTask(message: string): Promise<BrowserTaskResult> {
  const res = await authFetch('/api/browser/task', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  });
  const body = await res.json();
  if (!res.ok) {
    throw new Error(body?.message || 'Browser task failed');
  }
  return body.data as BrowserTaskResult;
}

export async function interactBrowser(body: {
  operation: BrowserInteractOp;
  target?: string;
  value?: string;
  headed?: boolean;
}): Promise<{ success: boolean; data: unknown }> {
  const res = await authFetch('/api/browser/interact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const payload = await res.json();
  if (!res.ok) {
    throw new Error(payload?.message || 'Browser interact failed');
  }
  return payload;
}

export function snapshotElements(snapshot: unknown): Array<{
  handleId: string;
  tag: string;
  text: string;
}> {
  if (!snapshot) return [];
  if (Array.isArray(snapshot)) {
    return snapshot.slice(0, 40).map((node, index) => normalizeNode(node, index));
  }
  if (typeof snapshot !== 'object') return [];
  const rec = snapshot as Record<string, unknown>;
  const refs = Array.isArray(rec.elements)
    ? rec.elements
    : Array.isArray(rec.refs)
      ? rec.refs
      : Array.isArray(rec.nodes)
        ? rec.nodes
        : [];
  return refs.slice(0, 40).map((node, index) => normalizeNode(node, index));
}

function normalizeNode(node: unknown, index: number) {
  const rec = node && typeof node === 'object' ? (node as Record<string, unknown>) : {};
  return {
    handleId: String(rec.ref || rec.handleId || rec.id || `@e${index + 1}`),
    tag: String(rec.role || rec.tag || rec.type || 'element'),
    text: String(rec.name || rec.text || rec.label || '').slice(0, 80),
  };
}

export const fetchBrowserStatus = fetchBrowserPreview;

export function formatBrowserTaskForChat(result: BrowserTaskResult): string {
  const lines: string[] = [];
  if (result.url) lines.push(`Opened: ${result.url}`);
  if (result.title) lines.push(`Title: ${result.title}`);
  for (const step of result.steps) {
    lines.push(`${step.ok ? '✓' : '✗'} ${step.step}`);
  }
  const elements = snapshotElements(result.snapshot);
  if (elements.length) {
    lines.push(`Discovered ${elements.length} interactive element(s).`);
  } else if (result.snapshot) {
    lines.push('Snapshot captured.');
  }
  if (result.hint) lines.push(`\n${result.hint}`);
  lines.push('Open /computer-use for live preview and takeover.');
  return lines.join('\n') || 'Browser task completed.';
}
