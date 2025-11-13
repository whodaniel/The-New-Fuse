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
 * Prisma health indicator
 */
export class PrismaHealthIndicator extends HealthIndicator {
    constructor() {
        super();
    }
    async pingCheck(key, prismaService) {
        try {
            await prismaService.$queryRaw `SELECT 1`;
            return this.getStatus(key, true);
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
    causes;
    constructor(message, causes) {
        super(message);
        this.causes = causes;
    }
}
//# sourceMappingURL=terminus.js.map