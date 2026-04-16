import { defaultLexicon } from '../config/default-lexicon';
import { defaultRules } from '../config/default-rules';
import { env } from '../config/env';
import { AgentRouter } from '../services/agent-router';
import { AudioGateway } from '../services/audio-gateway';
import { Enricher } from '../services/enricher';
import { GroupingFilter } from '../services/grouping-filter';
import { KwsEngine } from '../services/kws-engine';
import { MiniOmniClient } from '../services/llm-backends/mini-omni-client';
import { LlmBatcher } from '../services/llm-batcher';
import { RuleEngine } from '../services/rule-engine';
import { VadGate } from '../services/vad-gate';
import { ContextPackage, HitEvent, LlmBatchResult, RuleFireEvent } from '../types/events';

const pushBounded = <T>(list: T[], item: T, maxItems: number): void => {
  list.push(item);
  while (list.length > maxItems) {
    list.shift();
  }
};

export class AudioTriggerRuntime {
  private readonly gateway = new AudioGateway();
  private readonly vadGate = new VadGate();
  private readonly kwsEngine = new KwsEngine(defaultLexicon);
  private readonly groupingFilter = new GroupingFilter();
  private readonly ruleEngine = new RuleEngine(defaultRules);
  private readonly hitStore = new Map<string, HitEvent>();
  private readonly enricher = new Enricher(this.hitStore);
  private readonly miniOmniClient = new MiniOmniClient(env.miniOmni);
  private readonly llmBatcher = new LlmBatcher(
    this.miniOmniClient,
    env.batcher.flushIntervalMs,
    env.batcher.maxItems
  );
  private readonly agentRouter = new AgentRouter();
  private currentUtterance: string = '';

  private readonly startedAtMs = Date.now();
  private readonly recentRuleFires: RuleFireEvent[] = [];
  private readonly recentPackages: ContextPackage[] = [];
  private readonly recentLlmResults: LlmBatchResult[] = [];
  private processedFrames = 0;
  private processedHits = 0;
  private running = false;

  constructor() {
    this.gateway.on('frame', (frame) => {
      this.processedFrames += 1;
      this.vadGate.push(frame);
    });
    this.vadGate.on('speech_frame', (frame) => this.kwsEngine.push(frame));
    this.kwsEngine.on('hit', (hit: HitEvent) => {
      this.processedHits += 1;
      this.hitStore.set(hit.eventId, hit);
      this.groupingFilter.push(hit);
      this.agentRouter.processHit(hit, this.currentUtterance, hit.streamId);
    });
    this.groupingFilter.on('grouped_hit', (hit: HitEvent) => this.ruleEngine.push(hit));
    this.ruleEngine.on('rule_fired', async (ruleFire: RuleFireEvent) => {
      pushBounded(this.recentRuleFires, ruleFire, env.runtime.maxRecentRuleFires);
      const pkg = await this.enricher.buildContextPackage(ruleFire);
      pushBounded(this.recentPackages, pkg, env.runtime.maxRecentPackages);
      this.llmBatcher.enqueue(pkg);
      console.log(
        `[rule-fired] rule=${ruleFire.ruleId} stream=${ruleFire.streamId} confidence=${ruleFire.confidence.toFixed(3)}`
      );
    });
    this.llmBatcher.setResultHandler((result) => {
      pushBounded(this.recentLlmResults, result, env.runtime.maxRecentLlmResults);
    });
  }

  start(): void {
    if (this.running) {
      return;
    }
    this.llmBatcher.start();
    this.running = true;
  }

  async stop(): Promise<void> {
    if (!this.running) {
      return;
    }
    await this.llmBatcher.flush();
    this.llmBatcher.stop();
    this.running = false;
  }

  ingestText(streamId: string, utterance: string): void {
    this.currentUtterance = utterance;
    this.gateway.ingestMockUtterance(streamId, utterance);
  }

  async flush(): Promise<void> {
    await this.llmBatcher.flush();
  }

  getStatus(): Record<string, unknown> {
    const okLlmResults = this.recentLlmResults.filter((result) => result.ok).length;
    return {
      status: 'ok',
      uptimeMs: Date.now() - this.startedAtMs,
      running: this.running,
      queueDepth: this.llmBatcher.getQueueDepth(),
      processedFrames: this.processedFrames,
      processedHits: this.processedHits,
      recentRuleFires: this.recentRuleFires.length,
      recentPackages: this.recentPackages.length,
      recentLlmResults: this.recentLlmResults.length,
      llmSuccessRate:
        this.recentLlmResults.length === 0
          ? 1
          : Number((okLlmResults / this.recentLlmResults.length).toFixed(3)),
      miniOmniMode: env.miniOmni.mode,
      miniOmniEndpoint: env.miniOmni.apiUrl ?? `${env.miniOmni.baseUrl}${env.miniOmni.chatPath}`,
    };
  }

  getRecentRuleFires(limit = 50): RuleFireEvent[] {
    return this.recentRuleFires.slice(-Math.max(1, Math.min(limit, 1000))).reverse();
  }

  getRecentPackages(limit = 50): ContextPackage[] {
    return this.recentPackages.slice(-Math.max(1, Math.min(limit, 1000))).reverse();
  }

  getRecentLlmResults(limit = 50): LlmBatchResult[] {
    return this.recentLlmResults.slice(-Math.max(1, Math.min(limit, 1000))).reverse();
  }
}
