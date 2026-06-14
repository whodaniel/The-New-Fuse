"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var QueryOptimizerInterceptor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryOptimizerInterceptor = void 0;
exports.MonitorQueries = MonitorQueries;
const common_1 = require("@nestjs/common");
const operators_1 = require("rxjs/operators");
let QueryOptimizerInterceptor = QueryOptimizerInterceptor_1 = class QueryOptimizerInterceptor {
    constructor() {
        this.logger = new common_1.Logger(QueryOptimizerInterceptor_1.name);
        this.queryStats = new Map();
        this.N_PLUS_ONE_THRESHOLD = 10; // Alert if more than 10 queries per request
    }
    intercept(context, next) {
        const request = context.switchToHttp().getRequest();
        const requestId = this.generateRequestId();
        const startTime = Date.now();
        // Initialize query tracking for this request
        this.queryStats.set(requestId, {
            count: 0,
            duration: 0,
            patterns: new Map(),
        });
        return next.handle().pipe((0, operators_1.tap)({
            next: () => {
                this.logQueryStats(requestId, request, startTime);
            },
            error: (error) => {
                this.logQueryStats(requestId, request, startTime, error);
            },
            complete: () => {
                // Clean up
                this.queryStats.delete(requestId);
            },
        }));
    }
    /**
     * Records a database query
     */
    recordQuery(requestId, query, duration) {
        const stats = this.queryStats.get(requestId);
        if (!stats)
            return;
        stats.count++;
        stats.duration += duration;
        // Extract query pattern (remove specific values)
        const pattern = this.extractQueryPattern(query);
        const currentCount = stats.patterns.get(pattern) || 0;
        stats.patterns.set(pattern, currentCount + 1);
    }
    /**
     * Logs query statistics and detects N+1 patterns
     */
    logQueryStats(requestId, request, startTime, error) {
        const stats = this.queryStats.get(requestId);
        if (!stats)
            return;
        const totalDuration = Date.now() - startTime;
        const route = `${request.method} ${request.url}`;
        // Check for N+1 pattern
        if (stats.count > this.N_PLUS_ONE_THRESHOLD) {
            this.logger.warn(`⚠️  Potential N+1 query detected on ${route}`);
            this.logger.warn(`   Total queries: ${stats.count}`);
            this.logger.warn(`   Query duration: ${stats.duration}ms`);
            this.logger.warn(`   Total duration: ${totalDuration}ms`);
            this.logger.warn(`   Added by: Self-Improvement Agent Swarm`);
            // Log query patterns
            const topPatterns = Array.from(stats.patterns.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3);
            topPatterns.forEach(([pattern, count]) => {
                this.logger.warn(`   - ${pattern}: ${count} times`);
            });
            // Suggest optimization
            this.suggestOptimization(topPatterns);
        }
        // Log successful optimized queries
        if (stats.count <= 5 && stats.count > 0) {
            this.logger.log(`✅ Optimized queries on ${route}: ${stats.count} queries in ${stats.duration}ms`);
        }
    }
    /**
     * Extracts a normalized query pattern
     */
    extractQueryPattern(query) {
        // Remove specific values to get the pattern
        return query
            .replace(/\d+/g, 'N')
            .replace(/'[^']*'/g, "'?'")
            .replace(/"[^"]*"/g, '"?"')
            .substring(0, 100);
    }
    /**
     * Suggests optimization strategies
     */
    suggestOptimization(patterns) {
        const mostFrequent = patterns[0];
        if (mostFrequent && mostFrequent[1] > 5) {
            this.logger.warn(`   💡 Suggestion: Consider using Drizzle's include/select to fetch related data in a single query`);
            this.logger.warn(`   💡 Or implement DataLoader pattern for batching`);
        }
    }
    /**
     * Generates a unique request ID
     */
    generateRequestId() {
        return `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
};
exports.QueryOptimizerInterceptor = QueryOptimizerInterceptor;
exports.QueryOptimizerInterceptor = QueryOptimizerInterceptor = QueryOptimizerInterceptor_1 = __decorate([
    (0, common_1.Injectable)()
], QueryOptimizerInterceptor);
/**
 * Decorator to enable query optimization monitoring
 */
function MonitorQueries() {
    return function (target, propertyKey, descriptor) {
        const originalMethod = descriptor.value;
        descriptor.value = async function (...args) {
            const startTime = Date.now();
            try {
                const result = await originalMethod.apply(this, args);
                const duration = Date.now() - startTime;
                // Log if slow
                if (duration > 1000) {
                    const logger = new common_1.Logger(target.constructor.name);
                    logger.warn(`⏱️  Slow query detected in ${propertyKey}: ${duration}ms`);
                    logger.warn(`   Added by: Self-Improvement Agent Swarm`);
                }
                return result;
            }
            catch (error) {
                throw error;
            }
        };
        return descriptor;
    };
}
//# sourceMappingURL=query-optimizer.interceptor.js.map