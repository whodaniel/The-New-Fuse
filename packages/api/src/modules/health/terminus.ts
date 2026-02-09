/**
 * Decorators for health checks
 */

export function HealthCheck() {
  return function(
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    return descriptor;
  };
}

/**
 * Service for running health checks
 */
export class HealthCheckService {
  check(checks: Array<() => Promise<any> | any>) {
    return Promise.all(checks.map(check => {
      try {
        return Promise.resolve(check());
      } catch (e) {
        return Promise.reject(e);
      }
    }))
    .then(results => {
      return {
        status: 'ok',
        info: {},
        error: {},
        details: Object.assign({}, ...results)
      };
    })
    .catch(error => {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        status: 'error',
        info: {},
        error: { message: errorMessage },
        details: { error: errorMessage }
      };
    });
  }
}

/**
 * Base class for all health indicators
 */
export class HealthIndicator {
  protected getStatus(
    key: string,
    isHealthy: boolean,
    data: { [key: string]: any } = {}
  ): Promise<Record<string, any>> {
    return Promise.resolve({
      [key]: {
        status: isHealthy ? 'up' : 'down',
        ...data
      }
    });
  }
}

/**
 * Prisma health indicator
 */
export class PrismaHealthIndicator extends HealthIndicator {
  constructor() {
    super();
  }

  async pingCheck(key: string, prismaService: any): Promise<Record<string, any>> {
    try {
      if (typeof prismaService.healthCheck === 'function') {
        const isHealthy = await prismaService.healthCheck();
        if (isHealthy) {
          return this.getStatus(key, true);
        }
        throw new Error('Database health check failed');
      }
      
      if (typeof prismaService.$queryRaw === 'function') {
        await prismaService.$queryRaw`SELECT 1`;
        return this.getStatus(key, true);
      }
      
      throw new Error('Service does not support health check methods');
    } catch (e) {
      return this.getStatus(key, false, { message: e instanceof Error ? e.message : 'Unknown error' });
    }
  }
}

/**
 * Error thrown when a health check fails
 */
export class HealthCheckError extends Error {
  constructor(message: string, public causes: any) {
    super(message);
  }
}
