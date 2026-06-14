/**
 * Decorators for health checks
 */
export function HealthCheck() {
    return function (target, propertyKey, descriptor) {
        return descriptor;
    };
}
/**
 * Service for running health checks
 */
export class HealthCheckService {
    check(checks) {
        return Promise.all(checks.map(check => {
            try {
                return Promise.resolve(check());
            }
            catch (e) {
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
    getStatus(key, isHealthy, data = {}) {
        return Promise.resolve({
            [key]: {
                status: isHealthy ? 'up' : 'down',
                ...data
            }
        });
    }
}
/**
 * Drizzle health indicator
 */
export class DrizzleHealthIndicator extends HealthIndicator {
    constructor() {
        super();
    }
    async pingCheck(key, drizzleService) {
        try {
            if (typeof drizzleService.healthCheck === 'function') {
                const isHealthy = await drizzleService.healthCheck();
                if (isHealthy) {
                    return this.getStatus(key, true);
                }
                throw new Error('Database health check failed');
            }
            if (typeof drizzleService.$queryRaw === 'function') {
                await drizzleService.$queryRaw `SELECT 1`;
                return this.getStatus(key, true);
            }
            throw new Error('Service does not support health check methods');
        }
        catch (e) {
            return this.getStatus(key, false, { message: e instanceof Error ? e.message : 'Unknown error' });
        }
    }
}
/**
 * Error thrown when a health check fails
 */
export class HealthCheckError extends Error {
    constructor(message, causes) {
        super(message);
        this.causes = causes;
    }
}
//# sourceMappingURL=terminus.js.map