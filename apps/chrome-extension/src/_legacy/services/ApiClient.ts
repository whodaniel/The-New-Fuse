export class TheNewFuseApiClient {
  private baseUrl: string;
  private authToken: string | null = null;

  constructor() {
    this.baseUrl = 'http://localhost:3001/api';
    this.loadConfig();
  }

  private async loadConfig() {
    const config = await chrome.storage.sync.get(['apiUrl', 'authToken']);
    this.baseUrl = config.apiUrl || this.baseUrl;
    this.authToken = config.authToken || null;
  }

  async authenticate(credentials: { email: string; password: string }): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      if (response.ok) {
        const data = await response.json();
        this.authToken = data.accessToken;
        await chrome.storage.sync.set({ authToken: this.authToken });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Authentication failed:', error);
      return false;
    }
  }

  async getAgents(): Promise<any[]> {
    return this.apiCall('/agents');
  }

  async createAgent(agentData: any): Promise<any> {
    return this.apiCall('/agents', 'POST', agentData);
  }

  async sendAgentMessage(agentId: string, message: string): Promise<string> {
    const response = await this.apiCall(`/agents/${agentId}/chat`, 'POST', { message });
    return response.response;
  }

  async updateAgentStatus(agentId: string, status: string): Promise<any> {
    return this.apiCall(`/agents/${agentId}/status`, 'PUT', { status });
  }

  private async apiCall(endpoint: string, method: string = 'GET', body?: any): Promise<any> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.authToken) {
      headers.Authorization = `Bearer ${this.authToken}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.statusText}`);
    }

    return response.json();
  }
}
