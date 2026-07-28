import { apiService } from '@/services/api';
import {
  getRelayReachability,
  relayGetJson,
  relayGetOptionalJson,
  relayPostJson,
  resetRelayReachability,
  setRelayAuthToken,
} from '@/services/relayHttp.client';
import type {
  AISourceChatMessage,
  AISourceChatRequest,
  AISourceChatResult,
  AISourceOption,
  AISourceSelection,
} from '@/types/aiSource';

const STORAGE_KEY = 'tnf.aiSource.v1';
const CONFIGURED_RELAY_URL = import.meta.env.VITE_AI_RELAY_URL?.trim() || '';
const LOOPBACK_RELAY_URL = 'http://127.0.0.1:43120';

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
  /** True when this provider is backed by the signed-in user's own API key. */
  isUserKey?: boolean;
};

function isLoopbackUrl(value: string): boolean {
  try {
    const host = new URL(value).hostname;
    return host === '127.0.0.1' || host === 'localhost' || host === '::1';
  } catch {
    return /127\.0\.0\.1|localhost/i.test(value);
  }
}

/**
 * Validate a user-supplied relay URL.
 *
 * Loopback may be plain http: — browsers treat 127.0.0.1/localhost as a trustworthy origin. Any
 * remote host must be https:, otherwise the request dies at the mixed-content/CSP layer with an
 * opaque failure, so we reject it up front where we can explain why.
 */
export function validateRelayUrl(
  value: string
): { ok: true; url: string } | { ok: false; error: string } {
  const trimmed = (value || '').trim().replace(/\/+$/, '');
  if (!trimmed) return { ok: false, error: 'Enter a relay URL.' };

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return {
      ok: false,
      error: 'That is not a valid URL. Include the protocol, e.g. https://relay.example.com',
    };
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { ok: false, error: 'Relay URL must use http:// or https://' };
  }

  if (parsed.protocol === 'http:' && !isLoopbackUrl(trimmed)) {
    return {
      ok: false,
      error: 'A remote relay must use https:// — browsers block insecure requests from this page.',
    };
  }

  return { ok: true, url: trimmed };
}

/**
 * Resolve which relay to talk to, in precedence order:
 *   explicit argument → user setting → build-time VITE_AI_RELAY_URL → loopback default.
 *
 * This no longer gates on page origin. A hosted page *can* reach the loopback relay now that CSP
 * allows :43120 and the relay answers the Private Network Access preflight; where it genuinely
 * cannot (Safari, Firefox, relay not running) the request fails and `relayHttp.client` caches that,
 * which surfaces to the user as an explicit "not reachable" state rather than a silently empty list.
 */
function resolveRelayBaseUrl(explicit?: string): string | null {
  const candidate = (explicit || readCustomRelayUrl() || CONFIGURED_RELAY_URL || LOOPBACK_RELAY_URL)
    .trim()
    .replace(/\/+$/, '');
  return candidate || null;
}

function readStoredState(): Partial<AISourceSelection> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return (JSON.parse(raw) as Partial<AISourceSelection>) || {};
  } catch {
    return {};
  }
}

function writeStoredState(patch: Partial<AISourceSelection>): AISourceSelection {
  const next = {
    ...readStoredState(),
    ...patch,
    updatedAt: new Date().toISOString(),
  } as AISourceSelection;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

function readSelection(): AISourceSelection | null {
  const stored = readStoredState();
  return stored.sourceId ? (stored as AISourceSelection) : null;
}

function readCustomRelayUrl(): string {
  return readStoredState().customRelayUrl?.trim() || '';
}

function readRelayAuthToken(): string {
  return readStoredState().relayAuthToken?.trim() || '';
}

// Prime the HTTP client at module load so the very first relay call is already authenticated.
setRelayAuthToken(readRelayAuthToken());

function writeSelection(sourceId: string): AISourceSelection {
  return writeStoredState({ sourceId });
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
    // Providers the user personally holds a key for get their own group so they are not buried
    // among the globally-configured ones.
    group: provider.isUserKey ? 'Your Providers' : 'TNF Cloud',
    health: 'online',
    provider: provider.provider,
    model: provider.modelName,
    tnfProviderId: provider.id,
    isUserKey: provider.isUserKey,
  };
}

async function fetchRelaySources(relayBaseUrl: string | null): Promise<AISourceOption[]> {
  if (!relayBaseUrl) return [];

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

function coerceProviderList(payload: any): TnfProvider[] {
  const body = payload?.data ?? payload;
  if (Array.isArray(body)) return body;
  if (Array.isArray(body?.data)) return body.data;
  if (Array.isArray(body?.providers)) return body.providers;
  return [];
}

async function fetchTnfCloudSources(): Promise<AISourceOption[]> {
  // User-scoped endpoint: global providers ∪ providers this user holds a personal key for.
  try {
    const response: any = await apiService.get('/api/llm/providers/available', undefined, {
      silent: true,
    });
    const list = coerceProviderList(response);
    if (list.length) return list.map(mapTnfProvider);
  } catch {
    /* fall through to the global list below */
  }

  // Fallback for an API that predates /available.
  try {
    const response: any = await apiService.get('/api/llm/providers', undefined, { silent: true });
    return coerceProviderList(response).map(mapTnfProvider);
  } catch {
    return [];
  }
}

async function activateRelayProfile(relayBaseUrl: string, profileId: string): Promise<void> {
  const activated = await relayPostJson(relayBaseUrl, '/v1/provider-profiles/activate', {
    id: profileId,
  });
  if (activated) return;
  // Newer relays also accept auto-select.
  await relayPostJson(relayBaseUrl, '/v1/agents/auto-select', {});
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
  /** Relay base URL that will be used for local AI, following the documented precedence order. */
  getRelayBaseUrl(): string {
    return resolveRelayBaseUrl() || '';
  },

  isLocalRelayAvailable(): boolean {
    return resolveRelayBaseUrl() != null;
  },

  /** The user's own relay URL override, or '' when they haven't set one. */
  getCustomRelayUrl(): string {
    return readCustomRelayUrl();
  },

  /**
   * Save a user-supplied relay URL. Validates before storing so a bad value is rejected here
   * rather than failing opaquely at the browser's mixed-content check later.
   */
  setCustomRelayUrl(value: string): AISourceSelection {
    const trimmed = (value || '').trim();
    if (!trimmed) {
      resetRelayReachability();
      return writeStoredState({ customRelayUrl: '' });
    }
    const validated = validateRelayUrl(trimmed);
    if (!validated.ok) throw new Error(validated.error);
    resetRelayReachability();
    return writeStoredState({ customRelayUrl: validated.url });
  },

  clearCustomRelayUrl(): AISourceSelection {
    resetRelayReachability();
    return writeStoredState({ customRelayUrl: '' });
  },

  getRelayAuthToken(): string {
    return readRelayAuthToken();
  },

  /**
   * Store the relay's shared secret. Deliberately device-local and never synced to the profile —
   * it grants access to whatever models that relay fronts.
   */
  setRelayAuthToken(token: string): AISourceSelection {
    const trimmed = (token || '').trim();
    setRelayAuthToken(trimmed);
    resetRelayReachability();
    return writeStoredState({ relayAuthToken: trimmed });
  },

  /**
   * Mirror the relay URL onto the user's profile so it follows them to another browser.
   * Best-effort: localStorage is the source of truth for this device, and a failed sync must not
   * block saving locally.
   */
  async syncCustomRelayUrlToProfile(relayUrl: string): Promise<boolean> {
    try {
      await apiService.patch(
        '/api/auth/me',
        { preferences: { aiSource: { relayUrl: relayUrl || '' } } },
        { silent: true }
      );
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Adopt a relay URL stored on the user's profile when this device has none set, so a user who
   * configured it elsewhere doesn't have to re-enter it. A local value always wins.
   */
  async hydrateCustomRelayUrlFromProfile(): Promise<string> {
    if (readCustomRelayUrl()) return readCustomRelayUrl();
    try {
      const response: any = await apiService.get('/api/auth/me', undefined, { silent: true });
      const stored = (response?.data ?? response)?.preferences?.aiSource?.relayUrl;
      if (typeof stored !== 'string' || !stored.trim()) return '';
      const validated = validateRelayUrl(stored);
      if (!validated.ok) return '';
      writeStoredState({ customRelayUrl: validated.url });
      resetRelayReachability();
      return validated.url;
    } catch {
      return '';
    }
  },

  /** Force the next relay call to re-probe rather than trust a cached failure. */
  resetRelayProbe(): void {
    resetRelayReachability();
  },

  /**
   * Whether the last relay attempt succeeded. `null` = not yet attempted, `false` = this browser
   * or machine genuinely cannot reach it (Safari/Firefox loopback block, or relay not running).
   */
  getRelayReachability(relayBaseUrl?: string): boolean | null {
    const resolved = resolveRelayBaseUrl(relayBaseUrl);
    return resolved ? getRelayReachability(resolved) : null;
  },

  /** Models offered by the relay's active backend, for the model-override dropdown. */
  async listRelayModels(relayBaseUrl?: string): Promise<string[]> {
    const resolved = resolveRelayBaseUrl(relayBaseUrl);
    if (!resolved) return [];
    const payload = await relayGetOptionalJson<any>(resolved, '/v1/models');
    const list = payload?.data ?? payload?.models ?? payload;
    if (!Array.isArray(list)) return [];
    return list
      .map((entry: any) => (typeof entry === 'string' ? entry : entry?.id || entry?.name))
      .filter((id: unknown): id is string => typeof id === 'string' && id.trim().length > 0);
  },

  /**
   * Override the model on the relay's active backend without restarting it.
   *
   * /v1/backend/config is keyed by backend `name` (ollama | openai-compat | gemini), so we read the
   * currently active one from /v1/health first — sending only a model is rejected.
   */
  async setRelayModel(model: string, relayBaseUrl?: string): Promise<boolean> {
    const resolved = resolveRelayBaseUrl(relayBaseUrl);
    if (!resolved || !model.trim()) return false;

    const health = await relayGetOptionalJson<{ active?: string }>(resolved, '/v1/health');
    const active = health?.active?.trim();
    if (!active) return false;

    const result = await relayPostJson(resolved, '/v1/backend/config', {
      name: active,
      model: model.trim(),
    });
    return result != null;
  },

  getSelectedSourceId(): string | null {
    return readSelection()?.sourceId || null;
  },

  setSelectedSourceId(sourceId: string): AISourceSelection {
    return writeSelection(sourceId);
  },

  async listSources(relayBaseUrl?: string): Promise<AISourceOption[]> {
    const normalizedRelay = resolveRelayBaseUrl(relayBaseUrl);
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
    // Prefer orchestrator over stale local-relay selections when relay is unavailable.
    const orchestrator = sources.find((source) => source.kind === 'orchestrator');
    if (orchestrator) return orchestrator;
    return orchestratorDefault();
  },

  async chat(request: AISourceChatRequest): Promise<AISourceChatResult> {
    const sources = await this.listSources();
    const source = this.resolveSelected(sources, request.sourceId);
    const messages = buildMessages(request);
    if (!messages.length) {
      throw new Error('A user message is required.');
    }

    if (source.kind === 'local-relay') {
      const relayBaseUrl = resolveRelayBaseUrl(source.relayBaseUrl);
      if (!relayBaseUrl) {
        throw new Error(
          'No local AI relay is configured. Set one under Settings → API → Local AI Relay, or choose TNF Auto (Orchestrator).'
        );
      }
      if (source.relayProfileId) {
        await activateRelayProfile(relayBaseUrl, source.relayProfileId);
      }

      const relayToken = readRelayAuthToken();
      const response = await fetch(`${relayBaseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(relayToken ? { Authorization: `Bearer ${relayToken}` } : {}),
        },
        body: JSON.stringify({
          messages,
          model: request.model || source.model || 'story-architect',
          temperature: request.temperature,
          max_tokens: request.maxTokens,
        }),
      }).catch(() => null);

      if (!response) {
        resetRelayReachability(relayBaseUrl);
        throw new Error(
          `Could not reach the local AI relay at ${relayBaseUrl}. Confirm it is running, and note that Safari and Firefox block requests from this page to a loopback address — use Chrome, or point Settings → API → Local AI Relay at an https:// relay URL.`
        );
      }

      if (response.status === 401) {
        throw new Error(
          'The local AI relay rejected the auth token. Set the matching RELAY_AUTH_TOKEN value in Settings → API → Local AI Relay.'
        );
      }

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

    // Nest global prefix is `api` → /api/orchestration/chat.
    // VITE_API_URL is https://api.thenewfuse.com (no /api), so include the prefix here
    // (same pattern as /api/llm/providers).
    const payload = await apiService.post(
      '/api/orchestration/chat',
      {
        message: userMessage,
        systemPrompt: request.systemPrompt,
        provider: source.kind === 'tnf-cloud' ? source.provider : undefined,
        model: source.kind === 'tnf-cloud' ? source.model : undefined,
        temperature: request.temperature,
        maxTokens: request.maxTokens,
        context: request.context,
      },
      { silent: true }
    );

    const text = extractText(payload);
    if (!text) throw new Error('AI orchestrator returned an empty response.');
    return { text, source, raw: payload };
  },

  async probeRelayHealth(relayBaseUrl?: string): Promise<boolean> {
    const resolved = resolveRelayBaseUrl(relayBaseUrl);
    if (!resolved) return false;
    const payload = await relayGetJson<{ status?: string }>(resolved, '/v1/health', {
      status: 'down',
    });
    return payload?.status === 'ok';
  },
};
