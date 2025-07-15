export interface APIConfig {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
}

export class APINode {
  async execute(config: APIConfig, context: any): Promise<any> {
    if (!config.url || !config.method) {
      throw new Error('API URL and method are required');
    }

    try {
      const response = await fetch(config.url, {
        method: config.method,
        headers: {
          'Content-Type': 'application/json',
          ...config.headers
        },
        body: config.body ? JSON.stringify(config.body) : undefined,
      });

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`API node execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}