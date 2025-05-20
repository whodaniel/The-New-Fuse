import axios from 'axios';

export class HealthCheck {
  private static readonly TIMEOUT = 5000; // 5 seconds timeout

  static async checkService(url: string): Promise<boolean> {
    try {
      const response = await axios.get(`${url}/health`, {
        timeout: this.TIMEOUT
      });
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  static async checkAll(): Promise<Record<string, boolean>> {
    const services: Record<string, string> = {
      api: 'http://localhost:3001',
      backend: 'http://localhost:3002',
      frontend: 'http://localhost:3000'
    };

    const results: Record<string, boolean> = {};

    for (const [service, url] of Object.entries(services)) {
      results[service] = await this.checkService(url);
    }

    return results;
  }
}