/**
 * Bookmark Relay Broker
 *
 * Fuse Connect's only existing "AI" pattern automates the AI Studio web UI in a
 * browser tab — there is no direct text-completion API call anywhere in this
 * extension. The AI Bookmark Organizer feature instead routes its classification
 * requests through Fuse Connect's existing multi-agent relay/federation network:
 * whatever agent (Claude, GPT, a local orchestrator, ...) is connected on the
 * user's relay does the actual thinking, and this broker's job is purely
 * request/response plumbing on top of the relay's pub/sub `AgentMessage` traffic.
 *
 * There was no generic "ask an agent a question and await one correlated reply"
 * helper before this file — `sendTaskAndWait` (background/index.ts) is tab-targeted
 * browser automation, not relay-targeted. This fills that gap for bookmarks (and is
 * intentionally decoupled from BackgroundService/WebSocket internals via the
 * `RelayBrokerDeps` it's constructed with, so it's unit-testable without chrome.*).
 */

import { TIMINGS } from '../../shared/constants';
import type { Agent, AgentMessage } from '../../shared/types';

export interface RelayBrokerDeps {
  /** Send a raw payload over the relay connection (BackgroundService#send). */
  send: (data: Record<string, unknown>) => void;
  /** Currently known agents (BackgroundService#agents, as a plain array). */
  getAgents: () => Agent[];
  /** This browser's own agent id, used as the `from`. */
  getAgentId: () => string;
}

export interface BookmarkRequestOptions {
  /** Explicit relay agent id to target; skips capability matching when set. */
  targetAgentId?: string | null;
  /** Channel to broadcast on when no explicit/capable agent is known. */
  channel?: string | null;
  timeoutMs?: number;
}

interface PendingRequest {
  resolve: (message: AgentMessage) => void;
  reject: (err: Error) => void;
  timer: ReturnType<typeof setTimeout>;
}

/** Agents advertising either of these capabilities are preferred classification targets. */
const PREFERRED_CAPABILITIES = ['bookmark-classify', 'text-completion'];

export class BookmarkRelayBroker {
  private pending: Map<string, PendingRequest> = new Map();

  constructor(private deps: RelayBrokerDeps) {}

  /**
   * Resolve any pending request whose id matches this inbound message's
   * `metadata.requestId`. Called from BackgroundService#handleAgentMessage for
   * every relay message received, before dedup/loop-guard logic can suppress it.
   * Returns true if the message was consumed as a bookmark-broker reply.
   */
  resolve(message: AgentMessage): boolean {
    const requestId = (message.metadata as Record<string, unknown> | undefined)?.requestId;
    if (typeof requestId !== 'string') return false;

    const entry = this.pending.get(requestId);
    if (!entry) return false;

    clearTimeout(entry.timer);
    this.pending.delete(requestId);
    entry.resolve(message);
    return true;
  }

  /** Reject and drop every in-flight request (e.g. on relay disconnect). */
  cancelAll(reason = 'relay_disconnected'): void {
    for (const [id, entry] of this.pending.entries()) {
      clearTimeout(entry.timer);
      entry.reject(new Error(reason));
      this.pending.delete(id);
    }
  }

  private pickTarget(opts: BookmarkRequestOptions): { to: string; channel?: string } {
    if (opts.targetAgentId) {
      return { to: opts.targetAgentId };
    }
    const agents = this.deps.getAgents();
    const capable = agents.find(
      (a) =>
        Array.isArray(a.capabilities) &&
        a.capabilities.some((c) => PREFERRED_CAPABILITIES.includes(c))
    );
    if (capable) {
      return { to: capable.id };
    }
    return { to: 'broadcast', channel: opts.channel || undefined };
  }

  /**
   * Send one classification/taxonomy request and wait for a single correlated
   * reply. `data` is JSON-stringified as the AgentMessage content; the receiving
   * agent is expected to reply (type: 'response') with the same requestId in its
   * own metadata and its answer as JSON in `content`.
   */
  request(kind: string, data: unknown, opts: BookmarkRequestOptions = {}): Promise<AgentMessage> {
    const requestId =
      (globalThis.crypto?.randomUUID?.() as string | undefined) ||
      `bm-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const target = this.pickTarget(opts);
    const timeoutMs = opts.timeoutMs ?? TIMINGS.bookmarkAgentTimeout;

    return new Promise<AgentMessage>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(requestId);
        reject(new Error('no_agent_response'));
      }, timeoutMs);

      this.pending.set(requestId, { resolve, reject, timer });

      try {
        this.deps.send({
          type: 'MESSAGE_SEND',
          to: target.to,
          channel: target.channel,
          content: JSON.stringify(data),
          messageType: 'command',
          metadata: { kind: 'bookmark-classify', requestKind: kind, requestId },
        });
      } catch (err) {
        clearTimeout(timer);
        this.pending.delete(requestId);
        reject(err instanceof Error ? err : new Error(String(err)));
      }
    });
  }

  /** Same as request(), but retries on timeout with linear backoff. */
  async requestWithRetry(
    kind: string,
    data: unknown,
    opts: BookmarkRequestOptions = {},
    retries = 2
  ): Promise<AgentMessage> {
    let lastErr: Error | null = null;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await this.request(kind, data, opts);
      } catch (err) {
        lastErr = err instanceof Error ? err : new Error(String(err));
        if (attempt < retries) {
          await new Promise((r) => setTimeout(r, TIMINGS.retryInterval * (attempt + 1)));
        }
      }
    }
    throw lastErr ?? new Error('no_agent_response');
  }
}
