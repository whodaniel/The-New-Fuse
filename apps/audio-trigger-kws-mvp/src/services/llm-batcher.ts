import { renderPromptFromPackage } from '../templates/context-package';
import { ContextPackage, LlmBatchResult } from '../types/events';
import { ILlmClient } from './llm-backends/openai-compat-client';

export class LlmBatcher {
  private readonly queue: ContextPackage[] = [];
  private readonly dedupe = new Set<string>();
  private flushTimer: NodeJS.Timeout | null = null;
  private flushing = false;
  private resultHandler: ((result: LlmBatchResult) => void) | null = null;

  constructor(
    private readonly llmClients: ILlmClient[],
    private readonly flushIntervalMs: number,
    private readonly maxItems: number
  ) {
    if (llmClients.length === 0) {
      throw new Error('At least one LLM client must be provided to LlmBatcher');
    }
  }

  start(): void {
    if (this.flushTimer) {
      return;
    }
    this.flushTimer = setInterval(() => {
      void this.flush();
    }, this.flushIntervalMs);
  }

  stop(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }

  enqueue(pkg: ContextPackage): void {
    const dedupeKey = `${pkg.stream_id}:${pkg.rule_id}:${pkg.created_at.slice(0, 16)}`;
    if (this.dedupe.has(dedupeKey)) {
      return;
    }

    this.dedupe.add(dedupeKey);
    this.queue.push(pkg);

    if (this.queue.length >= this.maxItems) {
      void this.flush();
    }
  }

  setResultHandler(handler: (result: LlmBatchResult) => void): void {
    this.resultHandler = handler;
  }

  getQueueDepth(): number {
    return this.queue.length;
  }

  async flush(): Promise<void> {
    if (this.flushing || this.queue.length === 0) {
      return;
    }

    this.flushing = true;
    try {
      while (this.queue.length > 0) {
        const batch = this.queue.splice(0, this.maxItems);
        for (const pkg of batch) {
          const prompt = renderPromptFromPackage(pkg);
          let response = '';
          let success = false;

          for (const client of this.llmClients) {
            try {
              response = await client.complete(prompt, pkg);
              if (!response.includes('request error') && !response.includes('failed: HTTP')) {
                success = true;
                break; // Successfully got a response, no need to try other clients
              } else {
                console.warn(`[LlmBatcher] Client failed, trying next: ${response.slice(0, 100)}...`);
              }
            } catch (clientError) {
              console.error(`[LlmBatcher] Client threw an error, trying next:`, clientError);
            }
          }

          const result: LlmBatchResult = {
            pkgId: pkg.pkg_id,
            ruleId: pkg.rule_id,
            streamId: pkg.stream_id,
            ok: success,
            responsePreview: response.slice(0, 180),
            completedAt: new Date().toISOString(),
          };
          this.resultHandler?.(result);
          console.log(
            `[LLM] rule=${pkg.rule_id} stream=${pkg.stream_id} ok=${result.ok} response=${result.responsePreview}`
          );
        }
      }
    } finally {
      this.flushing = false;
    }
  }
}
