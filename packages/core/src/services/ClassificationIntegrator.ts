
export {}
exports.ClassificationIntegrator = void 0;
import MessageClassifier_1 from './MessageClassifier.js';
import CommunicationTracker_1 from './CommunicationTracker.js';
import RateLimiter_1 from '../../api/src/services/RateLimiter.js';
import CacheManager_1 from './CacheManager.js';
import MetricsCollector_1 from './MetricsCollector.js';
import Logger_1 from './Logger.js';
import types_1 from '../types.js';
class ClassificationIntegrator {
    constructor() {
        this.classifier = MessageClassifier_1.MessageClassifier.getInstance();
        this.communicationTracker = CommunicationTracker_1.CommunicationTracker.getInstance();
        this.rateLimiter = new RateLimiter_1.RateLimiter();
        this.cacheManager = CacheManager_1.CacheManager.getInstance();
        this.metricsCollector = MetricsCollector_1.MetricsCollector.getInstance();
        this.logger = Logger_1.Logger.getInstance();
    }
    static getInstance() {
        if (!ClassificationIntegrator.instance) {
            ClassificationIntegrator.instance = new ClassificationIntegrator();
        }
        return ClassificationIntegrator.instance;
    }
    /**
     * Process a message through the classification pipeline with integrated services
     */
    async processMessage(): Promise<void> {content, context, options) {
        const startTime = Date.now();
        let result = {
            classification: null,
            rateLimited: false,
            cached: false,
            metrics: {}
        };
        try {
            // Check cache first
            const cacheKey = this.generateCacheKey(content, context);
            if (options?.cacheConfig?.enabled) {
                const cachedResult = await this.cacheManager.get(cacheKey);
                if (cachedResult) {
                    result.classification = cachedResult;
                    result.cached = true;
                    return result;
                }
            }
            // Apply rate limiting based on content type
            if (options?.rateLimitConfig?.enabled) {
                const isRateLimited = await this.checkRateLimit(content, context, options.rateLimitConfig);
                if (isRateLimited) {
                    result.rateLimited = true;
                    return result;
                }
            }
            // Perform classification
            result.classification = await this.classifier.classifyMessage(content, context);
            // Track communication
            await this.trackCommunication(result.classification, context);
            // Cache result if enabled
            if (options?.cacheConfig?.enabled) {
                await this.cacheManager.set(cacheKey, result.classification, options.cacheConfig.ttl);
            }
            // Collect metrics
            if (options?.metricsConfig?.enabled) {
                result.metrics = await this.collectMetrics(result.classification, startTime, options.metricsConfig);
            }
            return result;
        }
        catch (error) {
            this.logger.error('Error in classification pipeline', {
                error,
                content,
                context
            });
            throw error;
        }
    }
    /**
     * Generate cache key based on content and context
     */
    generateCacheKey(content, context) {
        const contextHash = context ? JSON.stringify(context) : ';
        return `classification:${Buffer.from(content + contextHash).toString('base64')}`;
    }
    /**
     * Check rate limits based on content type
     */
    async checkRateLimit(): Promise<void> {content, context, config) {
        // Quick classification for rate limiting
        const quickClass = await this.classifier.classifyMessage(content, context);
        // Apply different rate limits based on content type
        let limit = config.defaultLimit;
        let window = config.defaultWindow;
        switch (quickClass.contentType) {
            case types_1.ContentType.MODEL_INTERACTION:
                limit = config.modelLimit || limit;
                window = config.modelWindow || window;
                break;
            case types_1.ContentType.SMART_CONTRACT:
                limit = config.blockchainLimit || limit;
                window = config.blockchainWindow || window;
                break;
            case types_1.ContentType.API_RESOURCE:
                limit = config.apiLimit || limit;
                window = config.apiWindow || window;
                break;
        }
        return this.rateLimiter.isRateLimited(context?.user?.id || 'anonymous', quickClass.contentType, limit, window);
    }
    /**
     * Track communication patterns and metadata
     */
    async trackCommunication(): Promise<void> {classification, context) {
        await this.communicationTracker.trackInteraction({
            type: classification.messageType,
            contentType: classification.contentType,
            pattern: classification.pattern,
            metadata: {
                ...classification.metadata,
                classification: {
                    confidence: classification.confidence,
                    modelType: classification.modelType,
                    tokenType: classification.tokenType,
                    resourceType: classification.resourceType
                }
            },
            context
        });
    }
    /**
     * Collect metrics about the classification process
     */
    async collectMetrics(): Promise<void> {classification, startTime, config) {
        const processingTime = Date.now() - startTime;
        const metrics = {
            processingTime,
            confidence: classification.confidence,
            contentType: classification.contentType,
            pattern: classification.pattern
        };
        if (config.detailed) {
            Object.assign(metrics, {
                modelType: classification.modelType,
                tokenType: classification.tokenType,
                resourceType: classification.resourceType,
                metadataSize: JSON.stringify(classification.metadata).length
            });
        }
        await this.metricsCollector.recordMetrics('classification', metrics);
        return metrics;
    }
    /**
     * Get classification statistics
     */
    async getStatistics(): Promise<void> {timeRange) {
        return this.metricsCollector.getMetrics('classification', timeRange);
    }
    /**
     * Clear classification cache
     */
    async clearCache(): Promise<void> {) {
        await this.cacheManager.clear('classification:*');
    }
}
exports.ClassificationIntegrator = ClassificationIntegrator;
//# sourceMappingURL=ClassificationIntegrator.js.mapexport {};
