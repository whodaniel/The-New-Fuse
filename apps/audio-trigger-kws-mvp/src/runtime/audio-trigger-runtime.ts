import { EventEmitter } from 'node:events';
import { defaultLexicon } from '../config/default-lexicon';
import { defaultRules } from '../config/default-rules';
import { env } from '../config/env';
import { AgentRouter } from '../services/agent-router';
import { AudioGateway } from '../services/audio-gateway';
import { EchoSuppression } from '../services/echo-suppression';
import { Enricher } from '../services/enricher';
import { GroupingFilter } from '../services/grouping-filter';
import { KwsEngine } from '../services/kws-engine';
import { MiniOmniClient } from '../services/llm-backends/mini-omni-client';
import { OpenaiCompatClient, ILlmClient } from '../services/llm-backends/openai-compat-client';
import { LlmBatcher } from '../services/llm-batcher';
import { profileService } from '../services/profile/service';
import { ProfileUpdate } from '../services/profile/schema';
import { RuleEngine } from '../services/rule-engine';
import { VadGate } from '../services/vad-gate';
import { ContextPackage, HitEvent, LlmBatchResult, RuleFireEvent, TriggerRule } from '../types/events';
import { loadRulesFromDirectory } from '../config/rule-parser';
import * as path from 'node:path';

const pushBounded = <T>(list: T[], item: T, maxItems: number): void => {
  list.push(item);
  while (list.length > maxItems) {
    list.shift();
  }
};

export class AudioTriggerRuntime extends EventEmitter {
  private readonly gateway = new AudioGateway();
  private readonly vadGate = new VadGate();
  private readonly kwsEngine = new KwsEngine(defaultLexicon);
  private readonly groupingFilter = new GroupingFilter();
  private readonly ruleEngine: RuleEngine;
  private readonly hitStore = new Map<string, HitEvent>();
  private readonly enricher = new Enricher(this.hitStore);
  private readonly miniOmniClient: MiniOmniClient;
  private readonly openaiCompatClient: OpenaiCompatClient;
  private readonly llmBatcher: LlmBatcher;
  private readonly agentRouter = new AgentRouter();
  readonly echoSuppression = new EchoSuppression();
  private currentUtterance: string = '';

  private readonly startedAtMs = Date.now();
  private readonly recentRuleFires: RuleFireEvent[] = [];
  private readonly recentPackages: ContextPackage[] = [];
  private readonly recentLlmResults: LlmBatchResult[] = [];
  private processedFrames = 0;
  private processedHits = 0;
  private running = false;

  constructor() {
    super();
    this.ruleEngine = new RuleEngine(defaultRules, profileService);
    void this.loadAdditionalRules();

    this.miniOmniClient = new MiniOmniClient(env.miniOmni);
    this.openaiCompatClient = new OpenaiCompatClient(env.openaiCompat);

    const llmClients: ILlmClient[] = [];
    if (env.miniOmni.enabled) {
      llmClients.push(this.miniOmniClient);
    }
    if (env.openaiCompat.enabled) {
      llmClients.push(this.openaiCompatClient);
    }

    this.llmBatcher = new LlmBatcher(
      llmClients.length > 0 ? llmClients : [this.miniOmniClient], // Fallback to miniOmniClient if no other clients are explicitly enabled
      env.batcher.flushIntervalMs,
      env.batcher.maxItems
    );
    
    // Event handlers
    this.gateway.on('frame', (frame) => {
      this.processedFrames += 1;
      this.vadGate.push(frame);
    });
    this.vadGate.on('speech_frame', (frame) => this.kwsEngine.push(frame));
    this.kwsEngine.on('hit', (hit: HitEvent) => {
      this.processedHits += 1;
      // Echo suppression: skip hits that are likely caused by TTS output
      if (this.echoSuppression.filterHit(hit) === null) {
        return;
      }
      this.hitStore.set(hit.eventId, hit);
      this.groupingFilter.push(hit);
      this.agentRouter.processHit(hit, this.currentUtterance, hit.streamId);
    });
    this.groupingFilter.on('grouped_hit', (hit: HitEvent) => this.ruleEngine.push(hit));
    this.ruleEngine.on('rule_fired', async (ruleFire: RuleFireEvent) => {
      pushBounded(this.recentRuleFires, ruleFire, env.runtime.maxRecentRuleFires);
      this.emit('rule_fired', ruleFire);
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

  private async loadAdditionalRules(): Promise<void> {
    try {
      const rulesPath = path.join(__dirname, '..', 'configs', 'rules');
      const additionalRules = await loadRulesFromDirectory(rulesPath);
      console.log(`[AudioTriggerRuntime] Loaded ${additionalRules.length} additional rules from ${rulesPath}`);
      this.ruleEngine.addRules(additionalRules);
    } catch (error) {
      console.error('[AudioTriggerRuntime] Failed to load additional rules:', error);
    }
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

  getProfile(userId: string) {
    return profileService.getProfile(userId);
  }

  updateProfile(userId: string, update: ProfileUpdate) {
    return profileService.updateProfile(userId, update);
  }

  getProfilesDirectory() {
    return profileService.getProfilesDirectory();
  }
}
