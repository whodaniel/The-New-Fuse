import fs from 'node:fs';
import path from 'node:path';

const toBool = (value: string | undefined, defaultValue: boolean): boolean => {
  if (value === undefined) {
    return defaultValue;
  }
  return value.toLowerCase() === 'true';
};

const toInt = (value: string | undefined, defaultValue: number): number => {
  if (!value) {
    return defaultValue;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : defaultValue;
};

const toFloat = (value: string | undefined, defaultValue: number): number => {
  if (!value) {
    return defaultValue;
  }
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : defaultValue;
};

const toString = (value: string | undefined, defaultValue: string): string => {
  if (value === undefined || value === '') {
    return defaultValue;
  }
  return value;
};

const resolveDefaultContextCardDir = (): string => {
  const wikiCandidates = [
    path.resolve(process.cwd(), 'packages', 'compounding-memory', 'wiki'),
    path.resolve(process.cwd(), '..', 'packages', 'compounding-memory', 'wiki'),
    path.resolve(process.cwd(), '..', '..', 'packages', 'compounding-memory', 'wiki'),
    path.resolve(process.cwd(), 'apps', 'audio-trigger-kws-mvp', '..', '..', 'packages', 'compounding-memory', 'wiki'),
  ];

  for (const candidate of wikiCandidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return path.resolve(process.cwd(), 'logs', 'context-cards');
};

export const env = {
  miniOmni: {
    enabled: toBool(process.env.MINI_OMNI_ENABLED, true),
    mode: toString(process.env.MINI_OMNI_MODE, 'native_chat'),
    apiUrl: process.env.MINI_OMNI_API_URL,
    baseUrl: process.env.MINI_OMNI_BASE_URL ?? 'http://127.0.0.1:60808',
    chatPath: process.env.MINI_OMNI_CHAT_PATH ?? '/chat',
    completionsPath: process.env.MINI_OMNI_COMPLETIONS_PATH ?? '/v1/chat/completions',
    model: process.env.MINI_OMNI_MODEL ?? 'mini-omni',
    timeoutMs: toInt(process.env.MINI_OMNI_TIMEOUT_MS, 8000),
    streamStride: toInt(process.env.MINI_OMNI_STREAM_STRIDE, 8),
    maxTokens: toInt(process.env.MINI_OMNI_MAX_TOKENS, 256),
    sampleWavPath: process.env.MINI_OMNI_SAMPLE_WAV ?? '',
    outputWavDir: process.env.MINI_OMNI_OUTPUT_WAV_DIR ?? '/tmp/mini-omni-kws-mvp',
  },
  openaiCompat: {
    enabled: toBool(process.env.OPENAI_COMPAT_ENABLED, false),
    apiUrl: toString(process.env.OPENAI_COMPAT_API_URL, 'https://api.openai.com/v1/chat/completions'),
    model: toString(process.env.OPENAI_COMPAT_MODEL, 'gpt-3.5-turbo'),
    apiKey: process.env.OPENAI_COMPAT_API_KEY,
    timeoutMs: toInt(process.env.OPENAI_COMPAT_TIMEOUT_MS, 15000),
  },
  batcher: {
    flushIntervalMs: toInt(process.env.BATCH_FLUSH_INTERVAL_MS, 2000),
    maxItems: toInt(process.env.BATCH_MAX_ITEMS, 20),
  },
  api: {
    host: process.env.APP_HOST ?? '0.0.0.0',
    port: toInt(process.env.APP_PORT ?? process.env.PORT, 43110),
    ingestApiKey:
      process.env.INGEST_API_KEY ?? process.env.VOICE_KWS_API_KEY ?? process.env.EDGE_API_KEY ?? '',
    requireIngestAuth: toBool(process.env.REQUIRE_INGEST_AUTH, true),
  },
  automation: {
    enabled: toBool(process.env.AUTO_PROMPT_ENABLED, true),
    sequencesFile: toString(process.env.AUTO_PROMPT_SEQUENCES_FILE, ''),
    contextCardDir: toString(process.env.CONTEXT_CARD_DIR, resolveDefaultContextCardDir()),
    claudeHooksEnabled: toBool(process.env.CLAUDE_HOOKS_ENABLED, true),
    claudeHooksRequireSecret: toBool(process.env.CLAUDE_HOOKS_REQUIRE_SECRET, false),
    claudeHooksSharedSecret: toString(process.env.CLAUDE_HOOKS_SHARED_SECRET, ''),
    claudeHooksDefaultStreamPrefix: toString(process.env.CLAUDE_HOOKS_STREAM_PREFIX, 'claude-session'),
    claudeHooksDefaultConfidence: toFloat(process.env.CLAUDE_HOOKS_DEFAULT_CONFIDENCE, 0.72),
  },
  runtime: {
    maxRecentRuleFires: toInt(process.env.MAX_RECENT_RULE_FIRES, 200),
    maxRecentPackages: toInt(process.env.MAX_RECENT_PACKAGES, 200),
    maxRecentLlmResults: toInt(process.env.MAX_RECENT_LLM_RESULTS, 200),
    maxRecentAutoPromptRuns: toInt(process.env.MAX_RECENT_AUTOPROMPT_RUNS, 200),
    maxRecentAssessments: toInt(process.env.MAX_RECENT_ASSESSMENTS, 200),
    maxRecentContextCards: toInt(process.env.MAX_RECENT_CONTEXT_CARDS, 200),
  },
};
