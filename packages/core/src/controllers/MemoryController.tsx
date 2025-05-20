import { Request, Response } from 'express';
import { MetricsService } from '../services/MetricsService.js';
import { LoggingService } from '../services/LoggingService.js';
import { EpisodicMemory } from '../memory/EpisodicMemory.js';
import { MemoryOptimizer } from '../memory/MemoryOptimizer.js';

export class MemoryController {
    private metricsService: MetricsService;
    private loggingService: LoggingService;
    private episodicMemory: EpisodicMemory;
    private memoryOptimizer: MemoryOptimizer;

    constructor() {
        this.metricsService = new MetricsService();
        this.loggingService = new LoggingService();
        this.episodicMemory = new EpisodicMemory();
        this.memoryOptimizer = new MemoryOptimizer();
    }

    async storeMemory(req: Request, res: Response): Promise<void> {
        const startTime = Date.now();
        const { agentId } = req.params;
        const memoryData = req.body;

        try {
            await this.loggingService.info('Storing memory', {
                agentId,
                memoryType: memoryData.type
            });

            // Optimize memory before storage
            const optimizedMemory = await this.memoryOptimizer.optimizeMemory(memoryData);

            // Store in episodic memory
            const storedMemory = await this.episodicMemory.store({
                agentId,
                ...optimizedMemory
            });

            // Track performance
            const duration = Date.now() - startTime;
            await this.metricsService.trackPerformance({
                duration,
                operation: 'storeMemory',
                success: true,
                metadata: {
                    agentId,
                    memoryType: memoryData.type
                }
            });

            res.json(storedMemory);
        } catch (error) {
            await this.handleError(error, 'storeMemory', agentId, startTime);
            res.status(500).json({
                error: 'Error storing memory',
                details: error.message
            });
        }
    }

    async retrieveMemories(req: Request, res: Response): Promise<void> {
        const startTime = Date.now();
        const { agentId } = req.params;
        const { query, limit, timeRange } = req.query;

        try {
            await this.loggingService.info('Retrieving memories', {
                agentId,
                query,
                timeRange
            });

            const memories = await this.episodicMemory.retrieve({
                agentId,
                query: query as string,
                limit: limit ? parseInt(limit as string) : 10,
                timeRange: timeRange ? JSON.parse(timeRange as string) : undefined
            });

            // Track performance
            const duration = Date.now() - startTime;
            await this.metricsService.trackPerformance({
                duration,
                operation: 'retrieveMemories',
                success: true,
                metadata: {
                    agentId,
                    resultsCount: memories.length
                }
            });

            res.json(memories);
        } catch (error) {
            await this.handleError(error, 'retrieveMemories', agentId, startTime);
            res.status(500).json({
                error: 'Error retrieving memories',
                details: error.message
            });
        }
    }

    async consolidateMemories(req: Request, res: Response): Promise<void> {
        const startTime = Date.now();
        const { agentId } = req.params;

        try {
            await this.loggingService.info('Starting memory consolidation', {
                agentId
            });

            const consolidationResult = await this.memoryOptimizer.consolidateMemories(agentId);

            // Track performance
            const duration = Date.now() - startTime;
            await this.metricsService.trackPerformance({
                duration,
                operation: 'consolidateMemories',
                success: true,
                metadata: {
                    agentId,
                    consolidatedCount: consolidationResult.consolidatedCount
                }
            });

            res.json(consolidationResult);
        } catch (error) {
            await this.handleError(error, 'consolidateMemories', agentId, startTime);
            res.status(500).json({
                error: 'Error consolidating memories',
                details: error.message
            });
        }
    }

    private async handleError(error: Error, operation: string, agentId: string, startTime: number): Promise<void> {
        const duration = Date.now() - startTime;

        await Promise.all([
            this.loggingService.error(`Error in ${operation}`, {
                error: error.message,
                agentId,
                stack: error.stack
            }),
            this.metricsService.trackError({
                error: error.message,
                stack: error.stack,
                context: {
                    operation,
                    agentId
                }
            }),
            this.metricsService.trackPerformance({
                duration,
                operation,
                success: false,
                metadata: {
                    agentId,
                    error: error.message
                }
            })
        ]);
    }
}
