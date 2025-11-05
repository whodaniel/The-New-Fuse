import { PrismaService } from '../prisma.service';
import { Agent, Prisma } from '@the-new-fuse/database/generated/prisma';
export declare class AgentService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(): Promise<Agent[]>;
    findOne(id: string): Promise<Agent | null>;
    create(data: Prisma.AgentCreateInput): Promise<Agent>;
    update(id: string, data: Partial<Agent>): Promise<Agent>;
    delete(id: string): Promise<Agent>;
}
//# sourceMappingURL=AgentService.d.ts.map