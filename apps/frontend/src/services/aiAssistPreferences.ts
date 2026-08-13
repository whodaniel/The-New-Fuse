export type AIAssistFocusMode = 'platform-dev' | 'personal' | 'personal-professional';

export interface AIAssistPreferences {
  includePageContent: boolean;
  includeUserFactors: boolean;
  temperature: number;
  maxTokens: number;
  focusMode: AIAssistFocusMode;
  systemPromptOverride?: string;
  updatedAt: string;
}

const STORAGE_KEY = 'tnf.aiAssist.prefs.v1';

export const DEFAULT_AI_ASSIST_PREFS: AIAssistPreferences = {
  includePageContent: true,
  includeUserFactors: true,
  temperature: 0.4,
  maxTokens: 2048,
  focusMode: 'personal-professional',
  updatedAt: new Date(0).toISOString(),
};

export function readAIAssistPreferences(): AIAssistPreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_AI_ASSIST_PREFS };
    const parsed = JSON.parse(raw) as Partial<AIAssistPreferences>;
    return {
      ...DEFAULT_AI_ASSIST_PREFS,
      ...parsed,
      temperature: clampNumber(parsed.temperature, 0, 1.5, DEFAULT_AI_ASSIST_PREFS.temperature),
      maxTokens: clampNumber(parsed.maxTokens, 256, 8192, DEFAULT_AI_ASSIST_PREFS.maxTokens),
      focusMode: isFocusMode(parsed.focusMode)
        ? parsed.focusMode
        : DEFAULT_AI_ASSIST_PREFS.focusMode,
    };
  } catch {
    return { ...DEFAULT_AI_ASSIST_PREFS };
  }
}

export function writeAIAssistPreferences(patch: Partial<AIAssistPreferences>): AIAssistPreferences {
  const next: AIAssistPreferences = {
    ...readAIAssistPreferences(),
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  // Mirror focus mode for CLI / local agents
  try {
    localStorage.setItem(
      'tnf.agentFocus.v1',
      JSON.stringify({
        mode: next.focusMode,
        updatedAt: next.updatedAt,
      })
    );
  } catch {
    /* ignore */
  }
  return next;
}

function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function isFocusMode(value: unknown): value is AIAssistFocusMode {
  return value === 'platform-dev' || value === 'personal' || value === 'personal-professional';
}

export function focusModeLabel(mode: AIAssistFocusMode): string {
  switch (mode) {
    case 'platform-dev':
      return 'Platform / codebase';
    case 'personal':
      return 'Personal';
    case 'personal-professional':
      return 'Personal · Professional';
  }
}

export function systemPromptForFocus(mode: AIAssistFocusMode): string {
  switch (mode) {
    case 'platform-dev':
      return [
        'You are assisting inside The New Fuse product UI while the operator is doing platform/codebase work.',
        'Prefer concrete, implementable guidance about TNF surfaces, APIs, agents, and operators.',
        'Do not invent personal goals; stay on product/engineering context unless the user asks otherwise.',
      ].join(' ');
    case 'personal':
      return [
        'You are assisting the signed-in TNF user in a personal context.',
        'Use their profile factors and current page content to personalize answers.',
        'Bridge product features to their personal goals when relevant; avoid treating them as a generic visitor.',
      ].join(' ');
    case 'personal-professional':
      return [
        'You are assisting the signed-in TNF user in a personal-professional context.',
        'Balance product/operator capabilities with their professional goals and profile factors.',
        'When the page is a TNF control surface, explain how it can advance their goals; when they ask for code/platform work, switch into precise engineering mode.',
      ].join(' ');
  }
}
