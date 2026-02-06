export interface RawUsage {
  input?: number;
  output?: number;
  cacheRead?: number;
  cacheWrite?: number;
  total?: number;
  // Common alternates across providers/SDKs.
  inputTokens?: number;
  outputTokens?: number;
  promptTokens?: number;
  completionTokens?: number;
  input_tokens?: number;
  output_tokens?: number;
  prompt_tokens?: number;
  completion_tokens?: number;
  cache_read_input_tokens?: number;
  cache_creation_input_tokens?: number;
  // Some agents/logs emit alternate naming.
  totalTokens?: number;
  total_tokens?: number;
  cache_read?: number;
  cache_write?: number;
}

export type UsageLike = RawUsage;

export interface NormalizedUsage {
  input?: number;
  output?: number;
  cacheRead?: number;
  cacheWrite?: number;
  total?: number;
}

export function hasNonzeroUsage(usage?: NormalizedUsage): usage is NormalizedUsage {
  if (!usage) {
    return false;
  }
  return Object.values(usage).some((v) => typeof v === 'number' && v > 0);
}

export function normalizeUsage(raw: RawUsage | null | undefined): NormalizedUsage | undefined {
  if (raw === null || raw === undefined || Array.isArray(raw)) {
    return undefined;
  }
  const input =
    raw.input ??
    raw.inputTokens ??
    raw.promptTokens ??
    raw.input_tokens ??
    raw.prompt_tokens ??
    raw.cache_read_input_tokens ??
    raw.cache_creation_input_tokens;
  const output =
    raw.output ??
    raw.outputTokens ??
    raw.completionTokens ??
    raw.output_tokens ??
    raw.completion_tokens;
  const cacheRead = raw.cacheRead ?? raw.cache_read;
  const cacheWrite = raw.cacheWrite ?? raw.cache_write;
  const total = raw.total ?? raw.totalTokens ?? raw.total_tokens;

  return {
    input,
    output,
    cacheRead,
    cacheWrite,
    total,
  };
}

export function derivePromptTokens(usage?: {
  input?: number;
  cacheRead?: number;
  cacheWrite?: number;
}): number | undefined {
  if (!usage) return undefined;
  const sum = (usage.input ?? 0) + (usage.cacheRead ?? 0) + (usage.cacheWrite ?? 0);
  return sum > 0 ? sum : undefined;
}
