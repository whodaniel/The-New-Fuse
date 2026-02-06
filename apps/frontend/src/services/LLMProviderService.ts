import {
  ProviderDefinition,
  AuthProfile,
  ProviderConfig
} from '@the-new-fuse/types';

class LLMProviderService {
  private baseUrl: string;

  constructor(baseUrl: string = '/api/advanced-llm/providers') {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`LLM Provider API Error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  async listProviders(): Promise<ProviderDefinition[]> {
    return this.request<ProviderDefinition[]>('');
  }

  async getAuthProfiles(): Promise<AuthProfile[]> {
    return this.request<AuthProfile[]>('/auth-profiles');
  }

  async addAuthProfile(profile: AuthProfile): Promise<void> {
    await this.request('/auth-profiles', {
      method: 'POST',
      body: JSON.stringify(profile),
    });
  }

  async removeAuthProfile(id: string): Promise<void> {
    await this.request(`/auth-profiles/${id}`, {
      method: 'DELETE',
    });
  }

  async getConfig(): Promise<ProviderConfig> {
    return this.request<ProviderConfig>('/config');
  }

  async saveConfig(config: ProviderConfig): Promise<void> {
    await this.request('/config', {
      method: 'PUT',
      body: JSON.stringify(config),
    });
  }
}

export const llmProviderService = new LLMProviderService();
export default llmProviderService;
