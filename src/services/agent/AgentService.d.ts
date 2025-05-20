import { BaseService } from '../core/BaseService.js';
import { Agent, CreateAgentDto, UpdateAgentDto } from "@the-new-fuse/types";
export declare class AgentService extends BaseService {
  private readonly prisma;
  private readonly agentFactory;
  private readonly redis;
  constructor(
    prisma: PrismaService,
    agentFactory: AgentFactory,
    redis: RedisService,
  );
  protected doInitialize(): Promise<void>;
  private setupEventListeners;
  createAgent(data: CreateAgentDto, userId: string): Promise<Agent>;
  updateAgent(
    id: string,
    updates: UpdateAgentDto,
    userId: string,
  ): Promise<Agent>;
  deleteAgent(id: string, userId: string): Promise<void>;
  private handleAgentEvent;
  private handleStatusChange;
  private handleAgentError;
}
