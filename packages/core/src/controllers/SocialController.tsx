import { Request, Response } from 'express';
import { MetricsService } from '../services/MetricsService.js';
import { LoggingService } from '../services/LoggingService.js';
import { SocialCore } from '../social/SocialCore.js';
import { TaskService } from '../services/TaskService.js';

export class SocialController {
    private metricsService: MetricsService;
    private loggingService: LoggingService;
    private socialCore: SocialCore;
    private taskService: TaskService;

    constructor() {
        this.metricsService = new MetricsService();
        this.loggingService = new LoggingService();
        this.socialCore = new SocialCore();
        this.taskService = new TaskService();
    }

    async processSocialInteraction(req: Request, res: Response): Promise<void> {
        const startTime = Date.now();
        const { agentId } = req.params;
        const interactionData = req.body;

        try {
            await this.loggingService.info('Processing social interaction', {
                agentId,
                interactionType: interactionData.type
            });

            const result = await this.socialCore.processSocialInteraction({
                agentId,
                ...interactionData
            });

            // Create task if needed
            if (result.taskTitle) {
                await this.taskService.createTask({
                    userId: agentId,
                    title: result.taskTitle,
                    description: result.taskDescription,
                    priority: result.taskPriority
                });
            }

            // Track performance
            const duration = Date.now() - startTime;
            await this.metricsService.trackPerformance({
                duration,
                operation: 'processSocialInteraction',
                success: true,
                metadata: {
                    agentId,
                    interactionType: interactionData.type
                }
            });

            res.json(result);
        } catch (error) {
            await this.handleError(error, 'processSocialInteraction', agentId, startTime);
            res.status(500).json({
                error: 'Error processing social interaction',
                details: error.message
            });
        }
    }

    async getSocialMetrics(req: Request, res: Response): Promise<void> {
        const startTime = Date.now();
        const { agentId } = req.params;
        const { timeRange } = req.query;

        try {
            await this.loggingService.info('Retrieving social metrics', {
                agentId,
                timeRange
            });

            const metrics = await this.socialCore.getSocialMetrics({
                agentId,
                timeRange: timeRange ? JSON.parse(timeRange as string) : undefined
            });

            // Track performance
            const duration = Date.now() - startTime;
            await this.metricsService.trackPerformance({
                duration,
                operation: 'getSocialMetrics',
                success: true,
                metadata: {
                    agentId
                }
            });

            res.json(metrics);
        } catch (error) {
            await this.handleError(error, 'getSocialMetrics', agentId, startTime);
            res.status(500).json({
                error: 'Error retrieving social metrics',
                details: error.message
            });
        }
    }

    async updateSocialPreferences(req: Request, res: Response): Promise<void> {
        const startTime = Date.now();
        const { agentId } = req.params;
        const preferences = req.body;

        try {
            await this.loggingService.info('Updating social preferences', {
                agentId
            });

            const updatedPreferences = await this.socialCore.updatePreferences({
                agentId,
                preferences
            });

            // Track performance
            const duration = Date.now() - startTime;
            await this.metricsService.trackPerformance({
                duration,
                operation: 'updateSocialPreferences',
                success: true,
                metadata: {
                    agentId
                }
            });

            res.json(updatedPreferences);
        } catch (error) {
            await this.handleError(error, 'updateSocialPreferences', agentId, startTime);
            res.status(500).json({
                error: 'Error updating social preferences',
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
