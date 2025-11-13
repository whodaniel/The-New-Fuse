import type { Response } from 'express';
import { AgentService } from '../services/agent.service';
import type { AgentDto } from '../modules/controllers/dto/agent.dto';
interface User {
    id: string;
    [key: string]: any;
}
export declare class AgentController {
    private readonly agentService;
    constructor(agentService: AgentService);
    getAllAgents(user: User, res: Response): Promise<Response<any, Record<string, any>>>;
    getAgentById(id: string, user: User, res: Response): Promise<Response<any, Record<string, any>>>;
    createAgent(createAgentDto: AgentDto, user: User, res: Response): Promise<Response<any, Record<string, any>>>;
    updateAgent(id: string, updateAgentDto: AgentDto, user: User, res: Response): Promise<Response<any, Record<string, any>>>;
    deleteAgent(id: string, user: User, res: Response): Promise<Response<any, Record<string, any>>>;
}
export {};
//# sourceMappingURL=AgentController.d.ts.map