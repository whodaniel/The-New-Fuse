import type { AgentVisualProfileRecord } from '@/data/agentVisualProfiles';
import { apiService } from './api';

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

export interface CloudAccessResponse {
  canSave: boolean;
  tier: 'STARTER' | 'PRO' | 'ENTERPRISE';
  active: boolean;
  storageBackend?: 'cloudflare-images' | 'inline';
}

function resolveNamespace(): string {
  if (typeof window === 'undefined') return 'global';
  return window.TNF_PFP_OVERRIDES_NAMESPACE || 'global';
}

function resolveEndpoint(): string {
  if (typeof window === 'undefined') return '/api/agent-pfp-overrides';
  return window.TNF_PFP_OVERRIDES_ENDPOINT || '/api/agent-pfp-overrides';
}

function resolveAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return (
    window.localStorage.getItem('auth_token') ||
    window.localStorage.getItem('authToken') ||
    window.localStorage.getItem('token')
  );
}

function withAuthHeaders(base: Record<string, string>): Record<string, string> {
  const token = resolveAuthToken();
  if (!token) return base;
  return {
    ...base,
    Authorization: `Bearer ${token}`,
  };
}

function extractOverridesPayload(payload: unknown): AgentPfpOverrideMap {
  if (
    payload &&
    typeof payload === 'object' &&
    'overrides' in payload &&
    typeof (payload as CloudOverridesEnvelope).overrides === 'object' &&
    (payload as CloudOverridesEnvelope).overrides
  ) {
    return (payload as CloudOverridesEnvelope).overrides as AgentPfpOverrideMap;
  }

  return (payload || {}) as AgentPfpOverrideMap;
}

export async function fetchCloudOverrides(): Promise<AgentPfpOverrideMap | null> {
  if (typeof window === 'undefined') return null;

  const namespace = resolveNamespace();
  const endpoint = resolveEndpoint();

  if (endpoint.startsWith('/')) {
    const payload = await apiService.get<CloudOverridesEnvelope | AgentPfpOverrideMap>(
      endpoint,
      { namespace },
      { silent: true }
    );
    return extractOverridesPayload(payload);
  }

  const url = new URL(endpoint);
  url.searchParams.set('namespace', namespace);

  const response = await fetch(url.toString(), {
    method: 'GET',
    credentials: 'include',
    headers: withAuthHeaders({ Accept: 'application/json' }),
  });

  if (!response.ok) {
    throw new Error(`Cloud overrides request failed: ${response.status}`);
  }

  const payload = (await response.json()) as unknown;
  return extractOverridesPayload(payload);
}

export async function fetchCloudAccess(): Promise<CloudAccessResponse | null> {
  if (typeof window === 'undefined') return null;

  const endpoint = resolveEndpoint();

  if (endpoint.startsWith('/')) {
    return await apiService.get<CloudAccessResponse>(`${endpoint}/access`, undefined, {
      silent: true,
    });
  }

  const url = new URL(endpoint.replace(/\/$/, '') + '/access');
  const response = await fetch(url.toString(), {
    method: 'GET',
    credentials: 'include',
    headers: withAuthHeaders({ Accept: 'application/json' }),
  });

  if (!response.ok) {
    throw new Error(`Cloud access request failed: ${response.status}`);
  }

  return (await response.json()) as CloudAccessResponse;
}

export async function pushCloudOverride(agentId: string, override: AgentPfpOverride): Promise<void> {
  if (typeof window === 'undefined') return;

  const body = {
    namespace: resolveNamespace(),
    agentId,
    override,
  };

  const endpoint = resolveEndpoint();

  if (endpoint.startsWith('/')) {
    await apiService.post(endpoint, body, { silent: true });
    return;
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    credentials: 'include',
    headers: withAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const bodyText = await response.text().catch(() => '');
    throw new Error(`Cloud override save failed (${response.status}): ${bodyText.slice(0, 180)}`);
  }
}

export async function pushCloudOverridesBatch(
  updates: Array<{ agentId: string; override: AgentPfpOverride }>
): Promise<void> {
  if (typeof window === 'undefined' || updates.length === 0) return;

  const endpoint = resolveEndpoint();

  if (endpoint.startsWith('/')) {
    await apiService.post(
      `${endpoint}/batch`,
      {
        namespace: resolveNamespace(),
        updates,
      },
      { silent: true }
    );
    return;
  }

  for (const update of updates) {
    await pushCloudOverride(update.agentId, update.override);
  }
}
