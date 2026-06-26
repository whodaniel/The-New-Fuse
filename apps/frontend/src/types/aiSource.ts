export type AISourceKind = 'local-relay' | 'tnf-cloud' | 'orchestrator';

export type AISourceHealth = 'online' | 'offline' | 'unknown';

export interface AISourceOption {
  id: string;
  kind: AISourceKind;
  label: string;
  description?: string;
  group: 'Local & Network' | 'TNF Cloud' | 'Automatic';
  health?: AISourceHealth;
  provider?: string;
  model?: string;
  relayProfileId?: string;
  relayBaseUrl?: string;
  tnfProviderId?: string;
}

export interface AISourceSelection {
  sourceId: string;
  updatedAt: string;
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
  temperature?: number;
  maxTokens?: number;
}

export interface AISourceChatResult {
  text: string;
  source: AISourceOption;
  raw?: unknown;
}
