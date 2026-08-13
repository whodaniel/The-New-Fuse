import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export type AgentFocusMode = 'platform-dev' | 'personal' | 'personal-professional';

export interface AgentFocusState {
  mode: AgentFocusMode;
  profileId?: string;
  goals?: string[];
  /** When true, platform work may still personalize TNF for a named profile's goals. */
  bridgePersonalization: boolean;
  updatedAt: string;
  source: 'env' | 'file' | 'default';
}

const FOCUS_FILE = path.join(os.homedir(), '.tnf', 'agent-focus.json');

const MODE_ALIASES: Record<string, AgentFocusMode> = {
  'platform-dev': 'platform-dev',
  platform: 'platform-dev',
  codebase: 'platform-dev',
  dev: 'platform-dev',
  personal: 'personal',
  'personal-professional': 'personal-professional',
  professional: 'personal-professional',
  personal_professional: 'personal-professional',
};

function normalizeMode(raw?: string | null): AgentFocusMode | null {
  if (!raw) return null;
  return MODE_ALIASES[raw.trim().toLowerCase()] || null;
}

function readFocusFile(): Partial<AgentFocusState> | null {
  try {
    if (!fs.existsSync(FOCUS_FILE)) return null;
    return JSON.parse(fs.readFileSync(FOCUS_FILE, 'utf8')) as Partial<AgentFocusState>;
  } catch {
    return null;
  }
}

/**
 * Resolve who/what the local TNF agent should optimize for.
 *
 * Precedence: TNF_AGENT_FOCUS env → ~/.tnf/agent-focus.json → default platform-dev.
 * Super-admin token answers "can you mutate the system?", not "whose goals?".
 */
export function resolveAgentFocus(): AgentFocusState {
  const fromEnv = normalizeMode(process.env.TNF_AGENT_FOCUS || process.env.TNF_FOCUS_MODE);
  if (fromEnv) {
    return {
      mode: fromEnv,
      profileId: process.env.TNF_AGENT_PROFILE || undefined,
      goals: (process.env.TNF_AGENT_GOALS || '')
        .split('|')
        .map((g) => g.trim())
        .filter(Boolean),
      bridgePersonalization:
        String(process.env.TNF_AGENT_BRIDGE_PERSONALIZATION || 'true').toLowerCase() !== 'false',
      updatedAt: new Date().toISOString(),
      source: 'env',
    };
  }

  const file = readFocusFile();
  const fileMode = normalizeMode(file?.mode || null);
  if (fileMode) {
    return {
      mode: fileMode,
      profileId: file?.profileId,
      goals: file?.goals || [],
      bridgePersonalization: file?.bridgePersonalization !== false,
      updatedAt: file?.updatedAt || new Date().toISOString(),
      source: 'file',
    };
  }

  return {
    mode: 'platform-dev',
    bridgePersonalization: true,
    updatedAt: new Date(0).toISOString(),
    source: 'default',
  };
}

export function writeAgentFocus(patch: Partial<AgentFocusState>): AgentFocusState {
  const current = resolveAgentFocus();
  const next: AgentFocusState = {
    ...current,
    ...patch,
    mode: normalizeMode(patch.mode || current.mode) || current.mode,
    updatedAt: new Date().toISOString(),
    source: 'file',
  };
  fs.mkdirSync(path.dirname(FOCUS_FILE), { recursive: true });
  fs.writeFileSync(FOCUS_FILE, JSON.stringify(next, null, 2));
  return next;
}

export function describeAgentFocus(state: AgentFocusState = resolveAgentFocus()): string {
  const lines = [
    `TNF agent focus: ${state.mode} (source=${state.source})`,
    state.profileId ? `profile: ${state.profileId}` : null,
    state.goals?.length ? `goals: ${state.goals.join('; ')}` : null,
    `bridge personalization: ${state.bridgePersonalization ? 'on' : 'off'}`,
    '',
    state.mode === 'platform-dev'
      ? 'Mode guidance: optimize for TNF codebase / platform work. Only personalize the product when bridge personalization is on and goals are set.'
      : state.mode === 'personal'
        ? 'Mode guidance: optimize for the signed-in / configured personal user. Platform changes should clearly serve that person.'
        : 'Mode guidance: balance professional goals with TNF platform leverage. Bridge product surfaces to the operator profile.',
  ];
  return lines.filter(Boolean).join('\n');
}

export function focusFilePath(): string {
  return FOCUS_FILE;
}
