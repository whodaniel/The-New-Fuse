import { AgentService } from '../services/agent.service.js';
import { CreateAgentDto, UpdateAgentDto } from '../dtos/agent.dto.js';
export declare class AgentController {
    private readonly agentService;
    constructor(agentService: AgentService);
    findAll(): Promise<import("../entities/agent.entity").Agent[]>;
    findOne(id: string): Promise<import("../entities/agent.entity").Agent>;
    create(createAgentDto: CreateAgentDto): Promise<import("../entities/agent.entity").Agent>;
    update(id: string, updateAgentDto: UpdateAgentDto): Promise<import("../entities/agent.entity").Agent>;
    remove(id: string): Promise<void>;
}
