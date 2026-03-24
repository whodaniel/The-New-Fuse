import type { AgentVisualProfileRecord } from '@/data/agentVisualProfiles';

export const PFP_OVERRIDE_STORAGE_KEY = 'tnf_pfp_overrides_v5';
export const PFP_PROMPT_STORAGE_KEY = 'tnf_pfp_prompt_overrides_v2';

export type PfpSource = 'generated' | 'upload' | 'cloud';

export interface AgentPfpOverride {
  imageUrl: string;
  prompt?: string;
  provider?: string;
  model?: string;
  style?: string;
  source: PfpSource;
  updatedAt: string;
}

export type AgentPfpOverrideMap = Record<string, AgentPfpOverride>;
export type AgentPromptOverrideMap = Record<string, string>;

function parseJson<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function loadPfpOverrides(): AgentPfpOverrideMap {
  if (typeof window === 'undefined') return {};
  return parseJson<AgentPfpOverrideMap>(window.localStorage.getItem(PFP_OVERRIDE_STORAGE_KEY), {});
}

export function savePfpOverrides(overrides: AgentPfpOverrideMap): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(PFP_OVERRIDE_STORAGE_KEY, JSON.stringify(overrides));
}

export function loadPromptOverrides(): AgentPromptOverrideMap {
  if (typeof window === 'undefined') return {};
  return parseJson<AgentPromptOverrideMap>(window.localStorage.getItem(PFP_PROMPT_STORAGE_KEY), {});
}

export function savePromptOverrides(overrides: AgentPromptOverrideMap): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(PFP_PROMPT_STORAGE_KEY, JSON.stringify(overrides));
}

export function upsertPfpOverride(
  agentId: string,
  payload: Omit<AgentPfpOverride, 'updatedAt'>,
  existing?: AgentPfpOverrideMap
): AgentPfpOverrideMap {
  const base = existing || loadPfpOverrides();
  return {
    ...base,
    [agentId]: {
      ...payload,
      updatedAt: new Date().toISOString(),
    },
  };
}

export function mergePfpOverrides(
  localOverrides: AgentPfpOverrideMap,
  remoteOverrides: AgentPfpOverrideMap
): AgentPfpOverrideMap {
  const merged: AgentPfpOverrideMap = { ...localOverrides };

  for (const [agentId, remote] of Object.entries(remoteOverrides)) {
    const local = merged[agentId];
    if (!local) {
      merged[agentId] = remote;
      continue;
    }

    const localTs = Date.parse(local.updatedAt || '');
    const remoteTs = Date.parse(remote.updatedAt || '');
    if (!Number.isFinite(localTs) || (Number.isFinite(remoteTs) && remoteTs > localTs)) {
      merged[agentId] = remote;
    }
  }

  return merged;
}

export function getDefaultPrompt(profile: AgentVisualProfileRecord): string {
  return profile.promptSpec.imagePrompt;
}

export function withStyleFlavor(basePrompt: string, styleFlavor: string): string {
  if (!styleFlavor.trim()) return basePrompt;
  return `${basePrompt.trim()} Additional style direction: ${styleFlavor.trim()}.`;
}

export async function blobToDataUrl(blob: Blob): Promise<string> {
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image blob.'));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(blob);
  });
}

export async function fileToDataUrl(file: File): Promise<string> {
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read dropped file.'));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
}

declare global {
  interface Window {
    TNF_PFP_OVERRIDES_ENDPOINT?: string;
    TNF_PFP_OVERRIDES_NAMESPACE?: string;
  }
}

export interface CloudOverridesEnvelope {
  namespace?: string;
  overrides?: AgentPfpOverrideMap;
}

export async function fetchCloudOverrides(): Promise<AgentPfpOverrideMap | null> {
  if (typeof window === 'undefined' || !window.TNF_PFP_OVERRIDES_ENDPOINT) return null;

  const namespace = window.TNF_PFP_OVERRIDES_NAMESPACE || 'global';
  const endpoint = new URL(window.TNF_PFP_OVERRIDES_ENDPOINT);
  endpoint.searchParams.set('namespace', namespace);

  const response = await fetch(endpoint.toString(), {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Cloud overrides request failed: ${response.status}`);
  }

  const payload = (await response.json()) as unknown;
  if (
    payload &&
    typeof payload === 'object' &&
    'overrides' in payload &&
    typeof (payload as CloudOverridesEnvelope).overrides === 'object' &&
    (payload as CloudOverridesEnvelope).overrides
  ) {
    return (payload as CloudOverridesEnvelope).overrides as AgentPfpOverrideMap;
  }

  return payload as AgentPfpOverrideMap;
}

export async function pushCloudOverride(
  agentId: string,
  override: AgentPfpOverride
): Promise<void> {
  if (typeof window === 'undefined' || !window.TNF_PFP_OVERRIDES_ENDPOINT) return;

  const body = {
    namespace: window.TNF_PFP_OVERRIDES_NAMESPACE || 'global',
    agentId,
    override,
  };

  await fetch(window.TNF_PFP_OVERRIDES_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}
