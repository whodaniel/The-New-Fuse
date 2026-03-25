import { defaultLexicon } from "./config/default-lexicon";
import { defaultRules } from "./config/default-rules";
import { env } from "./config/env";
import { AudioGateway } from "./services/audio-gateway";
import { Enricher } from "./services/enricher";
import { GroupingFilter } from "./services/grouping-filter";
import { KwsEngine } from "./services/kws-engine";
import { MiniOmniClient } from "./services/llm-backends/mini-omni-client";
import { LlmBatcher } from "./services/llm-batcher";
import { RuleEngine } from "./services/rule-engine";
import { VadGate } from "./services/vad-gate";
import { HitEvent } from "./types/events";

const isDemo = process.argv.includes("--demo");
const isDemoFull = process.argv.includes("--demo-full");
const demoWaitMs = Number.parseInt(process.env.DEMO_WAIT_MS ?? "45000", 10);

const gateway = new AudioGateway();
const vadGate = new VadGate();
const kwsEngine = new KwsEngine(defaultLexicon);
const groupingFilter = new GroupingFilter();
const ruleEngine = new RuleEngine(defaultRules);
const hitStore = new Map<string, HitEvent>();
const enricher = new Enricher(hitStore);
const miniOmniClient = new MiniOmniClient(env.miniOmni);
const llmBatcher = new LlmBatcher(
  miniOmniClient,
  env.batcher.flushIntervalMs,
  env.batcher.maxItems
);

gateway.on("frame", (frame) => vadGate.push(frame));
vadGate.on("speech_frame", (frame) => kwsEngine.push(frame));
kwsEngine.on("hit", (hit: HitEvent) => {
  hitStore.set(hit.eventId, hit);
  groupingFilter.push(hit);
});
groupingFilter.on("grouped_hit", (hit: HitEvent) => ruleEngine.push(hit));
ruleEngine.on("rule_fired", async (ruleFire) => {
  const pkg = await enricher.buildContextPackage(ruleFire);
  llmBatcher.enqueue(pkg);
  console.log(
    `[rule-fired] rule=${ruleFire.ruleId} stream=${ruleFire.streamId} confidence=${ruleFire.confidence.toFixed(3)}`
  );
});

llmBatcher.start();

const run = async (): Promise<void> => {
  if (isDemo) {
    console.log(
      `Running demo with mini-omni mode=${env.miniOmni.mode} endpoint=${env.miniOmni.apiUrl ?? `${env.miniOmni.baseUrl}${env.miniOmni.chatPath}`}`
    );
    const streamId = "demo_stream_01";
    gateway.ingestMockUtterance(streamId, "aspirin 200 mg please");
    if (isDemoFull) {
      gateway.ingestMockUtterance(streamId, "i am in distress self harm");
    }

    await new Promise((resolve) => setTimeout(resolve, demoWaitMs));
    await llmBatcher.flush();
    llmBatcher.stop();
    console.log("Demo completed.");
    return;
  }

  console.log("Audio Trigger KWS MVP scaffold running.");
  console.log(
    `mini-omni mode=${env.miniOmni.mode} endpoint=${env.miniOmni.apiUrl ?? `${env.miniOmni.baseUrl}${env.miniOmni.chatPath}`}`
  );
  console.log("Run `pnpm --filter @the-new-fuse/audio-trigger-kws-mvp demo` for a local simulation.");
};

void run();
