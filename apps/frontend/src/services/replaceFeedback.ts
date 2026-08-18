import { createSuggestion } from '@/services/unifiedLedgerApi';

export interface ReplaceFeedbackInput {
  pagePath: string;
  pageName?: string;
  message: string;
  proposedReplacement?: string;
  userId?: string;
  userEmail?: string;
  snapshotExcerpt?: string;
}

/**
 * Submit page-linked "replace feedback" into the suggestions / scrutiny lane.
 * Tags route the item into review/gauntlet consideration rather than a silent log.
 */
export async function submitReplaceFeedback(input: ReplaceFeedbackInput): Promise<{
  id?: string;
  queuedLocally: boolean;
}> {
  const title = `Replace feedback: ${input.pageName || input.pagePath}`;
  const description = [
    input.message.trim(),
    input.proposedReplacement
      ? `\n\nProposed replacement:\n${input.proposedReplacement.trim()}`
      : '',
    input.snapshotExcerpt ? `\n\nPage excerpt:\n${input.snapshotExcerpt.slice(0, 1500)}` : '',
  ]
    .join('')
    .trim();

  const payload = {
    kind: 'suggestion' as const,
    title,
    description,
    status: 'submitted' as const,
    priority: 'medium' as const,
    owner: input.userEmail || input.userId || 'anonymous',
    tags: [
      'replace-feedback',
      'scrutiny-gauntlet',
      `page:${input.pagePath}`,
      ...(input.pageName ? [`page-name:${input.pageName}`] : []),
    ],
    metadata: {
      feedbackType: 'replace',
      pagePath: input.pagePath,
      pageName: input.pageName,
      proposedReplacement: input.proposedReplacement,
      submittedAt: new Date().toISOString(),
      scrutiny: 'queued',
    },
  };

  try {
    const record = await createSuggestion(payload);
    return { id: record?.id, queuedLocally: false };
  } catch {
    // Offline / API down — keep a local queue for later flywheel pickup.
    const key = 'tnf.replaceFeedback.queue.v1';
    const existing = (() => {
      try {
        return JSON.parse(localStorage.getItem(key) || '[]') as unknown[];
      } catch {
        return [];
      }
    })();
    const entry = { ...payload, localId: crypto.randomUUID?.() || String(Date.now()) };
    localStorage.setItem(key, JSON.stringify([...existing, entry].slice(-50)));
    return { id: (entry as { localId: string }).localId, queuedLocally: true };
  }
}
