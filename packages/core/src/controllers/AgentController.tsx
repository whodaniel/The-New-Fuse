import { Request, Response } from 'express';
import { TaskService } from '../services/TaskService.js';
import { MetricsService } from '../services/MetricsService.js';
import { LoggingService } from '../services/LoggingService.js';
import { CognitiveCore, CognitiveResult } from '../cognitive/CognitiveCore.js'; // Assuming CognitiveResult type export
import { MetaLearner, LearningResult } from '../learning/MetaLearner.js'; // Assuming LearningResult type export
import { SocialCore, SocialResult } from '../social/SocialCore.js'; // Assuming SocialResult type export
import { EmergenceCore, EmergenceResult } from '../emergence/EmergenceCore.js'; // Assuming EmergenceResult type export

// Define a more specific type for interaction data
interface InteractionData {
  type: string;
  taskTitle?: string;
  taskDescription?: string;
  createTask?: boolean;
  [key: string]: any; // For other potential properties
}

// Define a type for the agent's state
interface AgentState {
  lastUpdated: Date;
  [key: string]: any; // For other state properties
}

export class AgentController {
    private taskService: TaskService;
    private metricsService: MetricsService;
    private loggingService: LoggingService;
    private cognitiveCore: CognitiveCore;
    private metaLearner: MetaLearner;
    private socialCore: SocialCore;
    private emergenceCore: EmergenceCore;
    private agentStates: Map<string, AgentState>;

    constructor() {
        // Initialize services and cores
        this.taskService = new TaskService();
        this.metricsService = new MetricsService();
        this.loggingService = new LoggingService(); // Assuming LoggingService has a default constructor or is injectable
        this.cognitiveCore = new CognitiveCore(); // Assuming default constructors or DI
        this.metaLearner = new MetaLearner();
        this.socialCore = new SocialCore();
        this.emergenceCore = new EmergenceCore();
        this.agentStates = new Map<string, AgentState>();
    }

    async processInteraction(req: Request, res: Response): Promise<void> {
        const startTime = Date.now();
        const { agentId } = req.params;
        const interactionData = req.body as InteractionData; // Use the defined interface

        try {
            await this.loggingService.info('Processing interaction', {
                agentId,
                interactionType: interactionData.type
            });

            // Update agent state with incoming data first
            this.updateAgentState(agentId, interactionData);

            // Process through each system
            // Ensure these methods return specific types if possible, or handle 'any' carefully
            const [cognitiveResult, learningResult, socialResult, emergenceResult] = await Promise.all([
                this.cognitiveCore.processInput(interactionData),
                this.metaLearner.learnFromInteraction(interactionData),
                this.socialCore.processSocialInteraction(interactionData),
                this.emergenceCore.analyzeEmergence(this.agentStates.get(agentId) || { lastUpdated: new Date() })
            ]);

            // Create task if needed
            if (interactionData.createTask && interactionData.taskTitle) {
                await this.taskService.createTask({
                    userId: agentId, // Assuming agentId can be used as userId
                    title: interactionData.taskTitle,
                    description: interactionData.taskDescription || '',
                    // Add other necessary fields for task creation if any
                });
            }

            const result = this.integrateResults(
                cognitiveResult as CognitiveResult, // Cast to specific types if known
                learningResult as LearningResult,
                socialResult as SocialResult,
                emergenceResult as EmergenceResult
            );
            
            const duration = Date.now() - startTime;
            await this.metricsService.trackPerformance({
                duration,
                operation: 'processInteraction',
                success: true,
                metadata: {
                    agentId,
                    interactionType: interactionData.type
                }
            });

            res.json(result);
        } catch (e: unknown) { // Specify error type
            const duration = Date.now() - startTime;
            let errorMessage = 'Unknown error during interaction processing';
            let errorStack: string | undefined = undefined;
            if (e instanceof Error) {
                errorMessage = e.message;
                errorStack = e.stack;
            } else if (typeof e === 'string') {
                errorMessage = e;
            }

            await Promise.all([
                this.loggingService.error('Error processing interaction', {
                    error: errorMessage,
                    agentId,
                    stack: errorStack
                }),
                this.metricsService.trackError({
                    error: errorMessage,
                    stack: errorStack,
                    context: {
                        agentId,
                        interactionType: interactionData.type
                    }
                }),
                this.metricsService.trackPerformance({
                    duration,
                    operation: 'processInteraction',
                    success: false,
                    metadata: {
                        agentId,
                        error: errorMessage
                    }
                })
            ]);

            res.status(500).json({
                error: 'Error processing interaction',
                details: errorMessage
            });
        }
    }

    private updateAgentState(agentId: string, data: Partial<InteractionData>): void {
        const currentState = this.agentStates.get(agentId) || { lastUpdated: new Date() };
        this.agentStates.set(agentId, {
            ...currentState,
            ...data,
            lastUpdated: new Date(),
        });
    }

    // Define specific types for results if possible
    private integrateResults(
        cognitiveResult: CognitiveResult, 
        learningResult: LearningResult, 
        socialResult: SocialResult, 
        emergenceResult: EmergenceResult
    ): Record<string, unknown> {
        // Combine results into a meaningful structure
        return {
            cognitive: cognitiveResult,
            learning: learningResult,
            social: socialResult,
            emergence: emergenceResult,
            timestamp: new Date(),
        };
    }

    async getAgentState(req: Request, res: Response): Promise<void> {
        const { agentId } = req.params;
        try {
            const state = this.agentStates.get(agentId);
            if (state) {
                res.json(state);
            } else {
                res.status(404).json({ error: 'Agent state not found' });
            }
        } catch (e: unknown) { // Specify error type
            let errorMessage = 'Unknown error retrieving agent state';
            if (e instanceof Error) {
                errorMessage = e.message;
            } else if (typeof e === 'string') {
                errorMessage = e;
            }
            await this.loggingService.error('Error retrieving agent state', {
                error: errorMessage,
                agentId
            });
            res.status(500).json({
                error: 'Error retrieving agent state',
                details: errorMessage
            });
        }
    }

    async resetAgentState(req: Request, res: Response): Promise<void> {
        const { agentId } = req.params;
        try {
            if (this.agentStates.has(agentId)) {
                this.agentStates.delete(agentId);
                await this.loggingService.info('Agent state reset', { agentId });
                res.json({ message: 'Agent state reset successfully' });
            } else {
                res.status(404).json({ error: 'Agent state not found for reset' });
            }
        } catch (e: unknown) { // Specify error type
            let errorMessage = 'Unknown error resetting agent state';
            if (e instanceof Error) {
                errorMessage = e.message;
            } else if (typeof e === 'string') {
                errorMessage = e;
            }
            await this.loggingService.error('Error resetting agent state', {
                error: errorMessage,
                agentId
            });
            res.status(500).json({
                error: 'Error resetting agent state',
                details: errorMessage
            });
        }
    }
}
