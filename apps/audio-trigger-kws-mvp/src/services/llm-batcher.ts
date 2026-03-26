import { renderPromptFromPackage } from '../templates/context-package';
import { ContextPackage, LlmBatchResult } from '../types/events';
import { MiniOmniClient } from './llm-backends/mini-omni-client';

export class LlmBatcher {
  private readonly queue: ContextPackage[] = [];
  private readonly dedupe = new Set<string>();
  private flushTimer: NodeJS.Timeout | null = null;
  private flushing = false;
  private resultHandler: ((result: LlmBatchResult) => void) | null = null;

  constructor(
    private readonly llmClient: MiniOmniClient,
    private readonly flushIntervalMs: number,
    private readonly maxItems: number
  ) {}

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
          const response = await this.llmClient.complete(prompt, pkg);
          const result: LlmBatchResult = {
            pkgId: pkg.pkg_id,
            ruleId: pkg.rule_id,
            streamId: pkg.stream_id,
            ok: !response.includes('request error') && !response.includes('failed: HTTP'),
            responsePreview: response.slice(0, 180),
            completedAt: new Date().toISOString(),
          };
          this.resultHandler?.(result);
          console.log(
            `[mini-omni] rule=${pkg.rule_id} stream=${pkg.stream_id} response=${result.responsePreview}`
          );
        }
      }
    } finally {
      this.flushing = false;
    }
  }
}
