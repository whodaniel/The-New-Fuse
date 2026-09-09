/**
 * Onboarding Greeter service — AI gateway with secret-safe context.
 *
 * Protocol gates (tnf-onboarding-audit-loop):
 *  - Gate 2: suggestions are advisory; sovereign write-in always wins.
 *  - Gate 3: unreachable AI degrades to offline tips; onboarding never blocks.
 *  - Credential law: session secrets never enter system prompts (see onboardingSecrets).
 */

import api from './api';
import { buildGreeterSafeSessionData } from './onboardingSecrets';

export interface GreeterStepContext {
  stepLabel: string;
  userType: 'human' | 'ai_agent' | 'unknown';
  userName?: string;
  stepsCompleted?: string[];
  allSteps?: string[];
  /** Already scrubbed / allowlisted onboarding facts only. */
  sessionData?: Record<string, unknown>;
}

export interface GreeterReply {
  text: string;
  offline: boolean;
  provider?: string;
  model?: string;
}

interface TextCompletionResponse {
  text: string;
  provider: string;
  model: string;
}

const REQUEST_TIMEOUT_MS = 15_000;
const HISTORY_WINDOW = 8;

const STEP_TIPS: Record<string, string> = {
  welcome:
    'Take the tour at your own pace — every step can be revisited from the dashboard, and you can type any custom question for me at any time.',
  'user profile':
    'Fill in what you are comfortable sharing; only the display name is required. You can also skip ahead and complete this later.',
  'api & provider':
    'You will need at least one LLM provider key (OpenAI, Anthropic, Google, or a self-hosted endpoint). Keys stay on this device and are never sent to the greeter or TNF servers from this step.',
  'billing & usage':
    'You can start on the free tier and add billing later. Usage caps can be set per agent from the admin panel.',
  'ai preferences':
    'These are defaults, not constraints — every preference here can be overridden per session or per agent at any time.',
  'workspace setup':
    'Point the workspace at an existing folder, scaffold a fresh one, or write in a custom path or database URI. The CLI equivalent is `tnf boot <handle>`.',
  'tools & integrations':
    'MCP servers and integrations can be enabled or disabled later without re-onboarding. Missing Docker or Redis will not block you — TNF falls back to local mode.',
  'meet your assistant':
    'That is me! I stay available from the dashboard after onboarding, and I read your harness state to stay useful.',
  complete:
    'Your profile is saved locally under ~/.tnf/profiles and synced if you chose cloud mode. Run `tnf boot <handle>` to launch your personalized stack.',
};

function buildSystemPrompt(context: GreeterStepContext): string {
  const completed = (context.stepsCompleted ?? []).join(', ') || 'none yet';
  const upcoming = (context.allSteps ?? [])
    .slice((context.allSteps ?? []).indexOf(context.stepLabel) + 1)
    .join(', ');
  const safeSession = buildGreeterSafeSessionData(context.sessionData);

  return [
    'You are the Greeter Agent for The New Fuse (TNF) platform, an AI agent coordination',
    'platform where AI systems and humans work together through a unified harness.',
    'You proactively help the user through their onboarding wizard.',
    '',
    'ONBOARDING STATE:',
    `- User type: ${context.userType}`,
    `- Display name: ${context.userName ?? 'not provided yet'}`,
    `- Current step: ${context.stepLabel}`,
    `- Steps completed: ${completed}`,
    `- Steps remaining: ${upcoming || 'this is the current step'}`,
    Object.keys(safeSession).length
      ? `- Session data (non-secret): ${JSON.stringify(safeSession)}`
      : '- Session data: nothing captured yet',
    '',
    'RULES:',
    '- Be concise (2-4 sentences unless the user asks for detail) and concrete.',
    '- Be proactive: suggest the natural next action for the current step.',
    '- Never ask the user to paste API keys, tokens, or passwords into chat.',
    '- Never claim you can see or store provider credentials.',
    '- SOVEREIGN OVERRIDE: every suggestion you make is advisory. Always make it',
    '  clear the user can write in their own custom value, skip the step, or',
    '  override any default. Never present a suggestion as mandatory.',
    '- If the user asks something unrelated to onboarding, answer helpfully but',
    '  briefly, then offer to return to the current step.',
  ].join('\n');
}

function offlineReply(context: GreeterStepContext, query?: string): GreeterReply {
  const tip =
    STEP_TIPS[context.stepLabel.toLowerCase()] ??
    'Continue at your own pace — every step is optional and can be completed later. You can type any custom question or value at any time.';
  const text = query
    ? `I could not reach the AI service just now, so here is offline guidance for **${context.stepLabel}**: ${tip}`
    : `Welcome to **${context.stepLabel}**. ${tip}`;
  return { text, offline: true };
}

export function buildGreeterContext(params: {
  stepLabel: string;
  userType: 'human' | 'ai_agent' | 'unknown';
  userName?: string;
  stepsCompleted?: string[];
  allSteps?: string[];
  sessionData?: Record<string, unknown>;
}): GreeterStepContext {
  return {
    stepLabel: params.stepLabel,
    userType: params.userType,
    userName: params.userName,
    stepsCompleted: params.stepsCompleted,
    allSteps: params.allSteps,
    // Always scrub + allowlist before context leaves this boundary.
    sessionData: buildGreeterSafeSessionData(params.sessionData),
  };
}

export async function askOnboardingGreeter(
  query: string,
  context: GreeterStepContext,
  history: Array<{ role: 'user' | 'assistant'; content: string }> = []
): Promise<GreeterReply> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const safeContext: GreeterStepContext = {
    ...context,
    sessionData: buildGreeterSafeSessionData(context.sessionData),
  };

  const historyTail = history.slice(-HISTORY_WINDOW);
  const conversation = [...historyTail.map((m) => `${m.role}: ${m.content}`), `user: ${query}`].join(
    '\n'
  );

  try {
    const response = await api.post<TextCompletionResponse>(
      '/api/ai/text-completion',
      {
        prompt: conversation,
        systemPrompt: buildSystemPrompt(safeContext),
      },
      { signal: controller.signal }
    );
    const res = response.data;
    if (!res?.text) return offlineReply(safeContext, query);
    return { text: res.text, offline: false, provider: res.provider, model: res.model };
  } catch {
    return offlineReply(safeContext, query);
  } finally {
    clearTimeout(timer);
  }
}
