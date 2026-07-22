import { apiService } from '@/services/api';
import { relayGetJson, relayGetOptionalJson } from '@/services/relayHttp.client';
import type {
  AISourceChatMessage,
  AISourceChatRequest,
  AISourceChatResult,
  AISourceOption,
  AISourceSelection,
} from '@/types/aiSource';

const STORAGE_KEY = 'tnf.aiSource.v1';
const DEFAULT_RELAY_URL = import.meta.env.VITE_AI_RELAY_URL?.trim() || 'http://127.0.0.1:43120';

type RelayDiscoverPayload = {
  profiles?: Array<{
    id?: string;
    label?: string;
    description?: string;
    source?: string;
    backend?: string;
    model?: string | null;
    baseUrl?: string | null;
    health?: string;
  }>;
  recommendedProfileId?: string | null;
};

type TnfProvider = {
  id: string;
  name: string;
  provider: string;
  modelName: string;
  isDefault?: boolean;
};

function readSelection(): AISourceSelection | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AISourceSelection;
    if (!parsed?.sourceId) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeSelection(sourceId: string): AISourceSelection {
  const next: AISourceSelection = { sourceId, updatedAt: new Date().toISOString() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

function orchestratorDefault(): AISourceOption {
  return {
    id: 'orchestrator-auto',
    kind: 'orchestrator',
    label: 'TNF Auto (Orchestrator)',
    description: 'Uses your configured TNF provider keys and routing policy.',
    group: 'Automatic',
    health: 'online',
  };
}

function mapRelayProfile(
  profile: NonNullable<RelayDiscoverPayload['profiles']>[number],
  relayBaseUrl: string
): AISourceOption | null {
  const id = profile?.id?.trim();
  if (!id) return null;
  return {
    id: `relay:${id}`,
    kind: 'local-relay',
    label: profile.label || id,
    description: profile.description || `Relay backend: ${profile.backend || 'unknown'}`,
    group: 'Local & Network',
    health: profile.health === 'up' ? 'online' : 'unknown',
    provider: profile.backend || undefined,
    model: profile.model || undefined,
    relayProfileId: id,
    relayBaseUrl,
  };
}

function mapTnfProvider(provider: TnfProvider): AISourceOption {
  return {
    id: `tnf:${provider.id}`,
    kind: 'tnf-cloud',
    label: provider.name || provider.provider,
    description: `${provider.provider} · ${provider.modelName}`,
    group: 'TNF Cloud',
    health: 'online',
    provider: provider.provider,
    model: provider.modelName,
    tnfProviderId: provider.id,
  };
}

async function fetchRelaySources(relayBaseUrl: string): Promise<AISourceOption[]> {
  const payload = await relayGetOptionalJson<RelayDiscoverPayload>(
    relayBaseUrl,
    '/v1/agents/discover'
  );
  if (!payload?.profiles?.length) {
    const legacy = await relayGetOptionalJson<{ profiles?: RelayDiscoverPayload['profiles'] }>(
      relayBaseUrl,
      '/v1/provider-profiles'
    );
    if (!legacy?.profiles?.length) return [];
    return legacy.profiles
      .map((profile) => mapRelayProfile(profile, relayBaseUrl))
      .filter(Boolean) as AISourceOption[];
  }

  return payload.profiles
    .map((profile) => mapRelayProfile(profile, relayBaseUrl))
    .filter(Boolean) as AISourceOption[];
}

async function fetchTnfCloudSources(): Promise<AISourceOption[]> {
  try {
    const response: any = await apiService.get('/api/llm/providers');
    const payload = response?.data;
    const list: TnfProvider[] = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.data)
        ? payload.data
        : [];
    return list.map(mapTnfProvider);
  } catch {
    return [];
  }
}

async function activateRelayProfile(relayBaseUrl: string, profileId: string): Promise<void> {
  try {
    await fetch(`${relayBaseUrl}/v1/provider-profiles/activate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: profileId }),
    });
  } catch {
    // Newer relays also accept auto-select
    try {
      await fetch(`${relayBaseUrl}/v1/agents/auto-select`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      });
    } catch {}
  }
}

function extractText(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') return null;
  const record = payload as Record<string, unknown>;
  const candidates = [
    record.response,
    record.message,
    record.text,
    record.reply,
    (record.data as Record<string, unknown> | undefined)?.message,
    (record.data as Record<string, unknown> | undefined)?.response,
    (record.choices as Array<{ message?: { content?: string } }> | undefined)?.[0]?.message
      ?.content,
  ];
  for (const value of candidates) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return null;
}

function buildMessages(request: AISourceChatRequest): AISourceChatMessage[] {
  if (Array.isArray(request.messages) && request.messages.length) {
    return request.messages;
  }
  const messages: AISourceChatMessage[] = [];
  if (request.systemPrompt?.trim()) {
    messages.push({ role: 'system', content: request.systemPrompt.trim() });
  }
  if (request.message?.trim()) {
    messages.push({ role: 'user', content: request.message.trim() });
  }
  return messages;
}

export const aiSourceService = {
  getRelayBaseUrl(): string {
    return DEFAULT_RELAY_URL.replace(/\/+$/, '');
  },

  getSelectedSourceId(): string | null {
    return readSelection()?.sourceId || null;
  },

  setSelectedSourceId(sourceId: string): AISourceSelection {
    return writeSelection(sourceId);
  },

  async listSources(relayBaseUrl = DEFAULT_RELAY_URL): Promise<AISourceOption[]> {
    const normalizedRelay = relayBaseUrl.replace(/\/+$/, '');
    const [relaySources, cloudSources] = await Promise.all([
      fetchRelaySources(normalizedRelay),
      fetchTnfCloudSources(),
    ]);

    const combined = [orchestratorDefault(), ...relaySources, ...cloudSources];
    const seen = new Set<string>();
    return combined.filter((source) => {
      if (seen.has(source.id)) return false;
      seen.add(source.id);
      return true;
    });
  },

  resolveSelected(sources: AISourceOption[], sourceId?: string | null): AISourceOption {
    const preferredId = sourceId || readSelection()?.sourceId;
    const match = preferredId ? sources.find((source) => source.id === preferredId) : null;
    if (match) return match;
    return sources.find((source) => source.kind === 'orchestrator') || orchestratorDefault();
  },

  async chat(request: AISourceChatRequest): Promise<AISourceChatResult> {
    const sources = await this.listSources();
    const source = this.resolveSelected(sources, request.sourceId);
    const messages = buildMessages(request);
    if (!messages.length) {
      throw new Error('A user message is required.');
    }

    if (source.kind === 'local-relay') {
      const relayBaseUrl = (source.relayBaseUrl || DEFAULT_RELAY_URL).replace(/\/+$/, '');
      if (source.relayProfileId) {
        await activateRelayProfile(relayBaseUrl, source.relayProfileId);
      }

      const response = await fetch(`${relayBaseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages,
          model: source.model || 'story-architect',
          temperature: request.temperature,
          max_tokens: request.maxTokens,
        }),
      });

      if (!response.ok) {
        const detail = await response.text().catch(() => '');
        throw new Error(`Local relay error (${response.status}): ${detail.slice(0, 180)}`);
      }

      const payload = await response.json();
      const text = extractText(payload);
      if (!text) throw new Error('Local relay returned an empty response.');
      return { text, source, raw: payload };
    }

    const userMessage =
      request.message?.trim() ||
      [...messages].reverse().find((entry) => entry.role === 'user')?.content ||
      '';

    const payload = await apiService.post('/orchestration/chat', {
      message: userMessage,
      systemPrompt: request.systemPrompt,
      provider: source.kind === 'tnf-cloud' ? source.provider : undefined,
      model: source.kind === 'tnf-cloud' ? source.model : undefined,
      temperature: request.temperature,
      maxTokens: request.maxTokens,
      context: request.context,
    });

    const text = extractText(payload);
    if (!text) throw new Error('AI orchestrator returned an empty response.');
    return { text, source, raw: payload };
  },

  async probeRelayHealth(relayBaseUrl = DEFAULT_RELAY_URL): Promise<boolean> {
    const payload = await relayGetJson<{ status?: string }>(
      relayBaseUrl.replace(/\/+$/, ''),
      '/v1/health',
      { status: 'down' }
    );
    return payload?.status === 'ok';
  },
};
