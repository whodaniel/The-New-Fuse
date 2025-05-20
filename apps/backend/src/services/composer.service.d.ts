import { RedisService } from './redis.service.js';
import { AgentService } from './agent.service.js';
export declare class ComposerService {
    private readonly redisService;
    private readonly agentService;
    private readonly logger;
    private readonly agentId;
    constructor(redisService: RedisService, agentService: AgentService);
    private initialize;
    private sendInitialInstructions;
    private handleRooCoderMessage;
    private handleTaskRequest;
    private handleTaskUpdate;
    private handleTaskComplete;
    assignTask(task: any): Promise<void>;
    requestCodeReview(codeDetails: any): Promise<void>;
    suggestImprovement(suggestion: any): Promise<void>;
}
