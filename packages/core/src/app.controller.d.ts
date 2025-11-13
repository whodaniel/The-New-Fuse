import { AppService } from './app.service';
import { AgentManager } from './agents/AgentManager';
import { AgentOrchestrator } from './agents/agent-orchestrator';
import { SimpleCognitiveAgent } from './agents/cognitive_system/simple_cognitive_agent';
export declare class AppController {
    private readonly appService;
    private readonly agentManager;
    private readonly agentOrchestrator;
    private readonly cognitiveAgent;
    constructor(appService: AppService, agentManager: AgentManager, agentOrchestrator: AgentOrchestrator, cognitiveAgent: SimpleCognitiveAgent);
    getHello(): string;
    getHealth(): object;
    getAgentStatus(): object;
    getWorkflowStatus(): object;
    getCognitiveStatus(): object;
}
//# sourceMappingURL=app.controller.d.ts.map