export type ProviderAuthMode = 'api_key' | 'oauth' | 'token' | 'custom';

export type ModelApiFormat =
  | 'openai'
  | 'anthropic'
  | 'google'
  | 'github'
  | 'bedrock';

export interface ModelDefinition {
  id: string;
  name: string;
  providerId: string;
  apiFormat: ModelApiFormat;
  reasoning: boolean;
  capabilities: Array<'text' | 'image' | 'audio' | 'video'>;
  contextWindow: number;
  maxTokens: number;
  cost?: {
    input: number;
    output: number;
  };
}

export interface ProviderDefinition {
  id: string;
  name: string;
  baseUrl: string;
  authMode: ProviderAuthMode;
  apiFormat: ModelApiFormat;
  models: ModelDefinition[];
  enabled: boolean;
  isCustom?: boolean;
}

export interface AuthProfile {
  id: string;
  providerId: string;
  label: string;
  credential: {
    type: ProviderAuthMode;
    key?: string;
    token?: string;
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
    email?: string;
    projectId?: string;
  };
}

export interface ProviderConfig {
  primaryModelId: string;
  fallbackModelIds: string[];
  preferredProfiles: Record<string, string>; // providerId -> profileId
}
