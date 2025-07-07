interface HealthStatus    { api: boolean
  database: boolean
  redis:  }
  cache:  }

export class HealthChecker { async checkSystem(): Promise<HealthStatus> {
    return {;
      api: await this.checkAPI(),
      database: await this.checkDatabase(),
      redis: await this.checkRedis(), }
      cache: await this.checkCache();
    };
  }

  private async checkAPI(): Promise<boolean> { try { try {
      const response = await fetch('http: '';
      return response.status' === '200;'';
     } catch ('')