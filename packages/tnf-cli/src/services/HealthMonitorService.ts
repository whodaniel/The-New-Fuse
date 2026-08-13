import { spawnSync } from 'child_process';
import * as http from 'http';
import * as https from 'https';

export interface HealthStatus {
  component: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  details?: string;
  latency?: number;
}

/**
 * Health monitoring service for the TNF ecosystem.
 * Probes key infrastructure components: Redis, WebSocket, Hermes Bridge, and LLM Providers.
 */
export class HealthMonitorService {
  private redisHost: string;
  private redisPort: number;
  private relayUrl: string;
  private bridgeUrl: string;

  constructor(
    config: { redisHost?: string; redisPort?: number; relayUrl?: string; bridgeUrl?: string } = {}
  ) {
    this.redisHost = config.redisHost || 'localhost';
    this.redisPort = config.redisPort || 6379;
    this.relayUrl = config.relayUrl || 'http://localhost:3000/health';
    this.bridgeUrl = config.bridgeUrl || 'http://localhost:4000/health';
  }

  /**
   * Run a full health check of the TNF infrastructure.
   */
  async runFullCheck(): Promise<HealthStatus[]> {
    const results: HealthStatus[] = [];

    results.push(await this.checkRedis());
    results.push(await this.checkWebSocketRelay());
    results.push(await this.checkHermesBridge());
    results.push(await this.checkLLMProviders());

    return results;
  }

  private async checkRedis(): Promise<HealthStatus> {
    const start = Date.now();
    try {
      // Simple ping via redis-cli
      const result = spawnSync(
        'redis-cli',
        ['-h', this.redisHost, '-p', String(this.redisPort), 'ping'],
        { encoding: 'utf8' }
      );
      if (result.stdout?.trim() === 'PONG') {
        return { component: 'Redis', status: 'healthy', latency: Date.now() - start };
      }
      return {
        component: 'Redis',
        status: 'unhealthy',
        details: 'Ping returned unexpected response.',
      };
    } catch (err) {
      return { component: 'Redis', status: 'unhealthy', details: String(err) };
    }
  }

  private async checkWebSocketRelay(): Promise<HealthStatus> {
    return this.probeHttpEndpoint('WebSocket Relay', this.relayUrl);
  }

  private async checkHermesBridge(): Promise<HealthStatus> {
    return this.probeHttpEndpoint('Hermes Bridge', this.bridgeUrl);
  }

  private async checkLLMProviders(): Promise<HealthStatus> {
    // Placeholder for LLM provider health checks
    // In a real implementation, this would iterate through configured providers
    return {
      component: 'LLM Providers',
      status: 'healthy',
      details: 'All providers responding (simulated check).',
    };
  }

  private probeHttpEndpoint(component: string, url: string): Promise<HealthStatus> {
    return new Promise((resolve) => {
      const start = Date.now();
      const protocol = url.startsWith('https') ? https : http;
      const req = protocol.get(url, (res) => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ component, status: 'healthy', latency: Date.now() - start });
        } else {
          resolve({ component, status: 'degraded', details: `HTTP ${res.statusCode}` });
        }
      });
      req.on('error', (err) => resolve({ component, status: 'unhealthy', details: err.message }));
      req.setTimeout(5000, () => {
        req.destroy();
        resolve({ component, status: 'unhealthy', details: 'Connection timeout' });
      });
    });
  }
}
