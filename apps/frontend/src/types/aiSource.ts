export type AISourceKind = 'local-relay' | 'tnf-cloud' | 'orchestrator';

export type AISourceHealth = 'online' | 'offline' | 'unknown';

export type AISourceGroup = 'Local & Network' | 'Your Providers' | 'TNF Cloud' | 'Automatic';

export interface AISourceOption {
  id: string;
  kind: AISourceKind;
  label: string;
  description?: string;
  group: AISourceGroup;
  health?: AISourceHealth;
  provider?: string;
  model?: string;
  relayProfileId?: string;
  relayBaseUrl?: string;
  tnfProviderId?: string;
  /** Backed by the signed-in user's own API key rather than a globally-configured one. */
  isUserKey?: boolean;
}

export interface AISourceSelection {
  sourceId: string;
  updatedAt: string;
  /**
   * User-configured relay URL, overriding the loopback default. Lets someone reach a relay that
   * isn't on this machine (e.g. via a tunnel), or one in a browser that blocks loopback.
   */
  customRelayUrl?: string;
  /**
   * Shared secret for relays started with RELAY_AUTH_TOKEN. Device-local only — never synced to the
   * user's profile, since it grants access to whatever models that relay fronts.
   */
  relayAuthToken?: string;
}

/** A model offered by the currently active relay backend. */
export interface RelayModelOption {
  id: string;
  label?: string;
}

export interface AISourceChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AISourceChatRequest {
  message?: string;
  messages?: AISourceChatMessage[];
  systemPrompt?: string;
  context?: Record<string, unknown>;
  sourceId?: string;
  /** Overrides the source's default model for this request (local relay model picker). */
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface AISourceChatResult {
  text: string;
  source: AISourceOption;
  raw?: unknown;
}
