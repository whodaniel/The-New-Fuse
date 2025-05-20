import { CreateAgentDto, UpdateAgentDto } from "@the-new-fuse/types";
import { ConfigService } from "@nestjs/config";
export declare class AgentController {
  private readonly prismaService;
  private readonly configService;
  private readonly agentService;
  constructor(prismaService: PrismaService, configService: ConfigService);
  createAgent(data: CreateAgentDto, req: Request): Promise<any>;
  getAgents(req: Request): Promise<any>;
  getAgentById(id: string, req: Request): Promise<any>;
  updateAgent(id: string, updates: UpdateAgentDto, req: Request): Promise<any>;
  deleteAgent(id: string, req: Request): Promise<void>;
}
