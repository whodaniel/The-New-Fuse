import { Injectable } from '@nestjs/common';

// Define the interfaces from @nestjs/terminus to avoid direct dependency
export interface HealthIndicatorResult {
  [key: string]: {
    status: string;
    message?: string;
  };
}

export class HealthCheckError extends Error {
  constructor(message: string, public causes: HealthIndicatorResult) {
    super(message);
  }
}

@Injectable()
export class HealthService {
  // Implement a health indicator for checking various services
  async check(key: string): Promise<HealthIndicatorResult> {
    try {
      // This would normally check a service like database or cache
      return this.getStatus(key, true);
    } catch (err: any) {
      if (err instanceof Error) {
        return this.getStatus(key, false, { message: err.message });
      }
      return this.getStatus(key, false, { message: 'Unknown error occurred' });
    }
  }

  // Helper method to create status results
  private getStatus(key: string, isHealthy: boolean, data: Record<string, any> = {}): HealthIndicatorResult {
    const status = isHealthy ? 'up' : 'down';
    return {
      [key]: {
        status,
        ...data
      }
    };
  }
}