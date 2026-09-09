/**
 * Pure helpers for the in-session `/sessions` slash command.
 *
 * Kept free of I/O and readline concerns so the picker UX stays in cli.ts
 * (which owns the TUI) while the transcript-switching semantics live here,
 * unit-tested.
 */
import type { SelectItem } from './interactive-select.js';
import type { Session, SessionExport, SessionMessage } from '../services/SessionManagerService.js';

/** Local transcript row — structurally identical to cli.ts ChatMessage. */
export type JumpMessage = { role: 'system' | 'user' | 'assistant'; content: string };

const CURRENT_MARK = '● current';

/**
 * Build interactive-select entries for saved sessions, most recent first
 * (`SessionManagerService.list()` already sorts by updatedAt desc).
 * The currently-persisted session is marked and sorted to the top so the
 * operator immediately sees where they are.
 */
export function buildSessionJumpItems(
  sessions: Session[],
  currentId?: string
): Array<SelectItem<Session> & { isCurrent: boolean }> {
  const decorated = sessions.map((session) => {
    const isCurrent = session.id === currentId;
    const label = session.name || session.id;
    const bits = [`${session.messageCount} msgs`];
    if (session.model) bits.push(session.model);
    bits.push(new Date(session.updatedAt).toLocaleString());
    if (isCurrent) bits.push(CURRENT_MARK);
    return { value: session, label, description: bits.join(' · '), isCurrent, disabled: false };
  });
  // Current session first, then updatedAt order preserved.
  return decorated.sort((a, b) => Number(b.isCurrent) - Number(a.isCurrent));
}

/**
 * Replace the live transcript with a saved session's messages, preserving the
 * leading system prompt(s). Mirrors the startup hydration rule (system rows
 * are skipped — the transcript already carries the fresh system prompt).
 *
 * Returns the number of conversation messages now in the transcript.
 */
export function applySessionJump(
  messages: JumpMessage[],
  systemMessageCount: number,
  target: SessionExport
): number {
  const keep = messages.slice(0, Math.max(0, systemMessageCount));
  const incoming = (target.messages ?? []).filter(
    (m: SessionMessage) => m.role !== 'system' && typeof m.content === 'string' && m.content.length > 0
  );
  messages.length = 0;
  for (const m of keep) messages.push(m);
  for (const m of incoming) {
    messages.push({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content });
  }
  return incoming.length;
}
