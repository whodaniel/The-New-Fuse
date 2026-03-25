const toBool = (value: string | undefined, defaultValue: boolean): boolean => {
  if (value === undefined) {
    return defaultValue;
  }
  return value.toLowerCase() === "true";
};

const toInt = (value: string | undefined, defaultValue: number): number => {
  if (!value) {
    return defaultValue;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : defaultValue;
};

const toString = (value: string | undefined, defaultValue: string): string => {
  if (value === undefined || value === "") {
    return defaultValue;
  }
  return value;
};

export const env = {
  miniOmni: {
    enabled: toBool(process.env.MINI_OMNI_ENABLED, true),
    mode: toString(process.env.MINI_OMNI_MODE, "native_chat"),
    apiUrl: process.env.MINI_OMNI_API_URL,
    baseUrl: process.env.MINI_OMNI_BASE_URL ?? "http://127.0.0.1:60808",
    chatPath: process.env.MINI_OMNI_CHAT_PATH ?? "/chat",
    completionsPath:
      process.env.MINI_OMNI_COMPLETIONS_PATH ?? "/v1/chat/completions",
    model: process.env.MINI_OMNI_MODEL ?? "mini-omni",
    timeoutMs: toInt(process.env.MINI_OMNI_TIMEOUT_MS, 8000),
    streamStride: toInt(process.env.MINI_OMNI_STREAM_STRIDE, 8),
    maxTokens: toInt(process.env.MINI_OMNI_MAX_TOKENS, 256),
    sampleWavPath: process.env.MINI_OMNI_SAMPLE_WAV ?? "",
    outputWavDir:
      process.env.MINI_OMNI_OUTPUT_WAV_DIR ?? "/tmp/mini-omni-kws-mvp"
  },
  batcher: {
    flushIntervalMs: toInt(process.env.BATCH_FLUSH_INTERVAL_MS, 2000),
    maxItems: toInt(process.env.BATCH_MAX_ITEMS, 20)
  }
};
