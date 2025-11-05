import { PrismaService } from '@the-new-fuse/database';
// import { UnifiedWorkflowEngine } from '@the-new-fuse/workflow-engine'; // Removed workflow-engine dependency
import { CreateInterfaceDto, UpdateInterfaceDto } from '../dtos/interface.dto';
export declare class InterfaceService {
    private prisma;
    // private workflowEngine; // Removed workflow-engine dependency
    constructor(prisma: PrismaService /* workflowEngine: UnifiedWorkflowEngine */); // Removed workflow-engine dependency
    create(createInterfaceDto: CreateInterfaceDto, userId: string): Promise<void>;
    findAll(userId: string): Promise<void>;
    findOne(id: string, userId?: string): Promise<void>;
    update(id: string, updateInterfaceDto: UpdateInterfaceDto, userId: string): Promise<void>;
    remove(id: string, userId: string): Promise<void>;
    execute(id: string, formData: Record<string, any>): Promise<any>;
}
//# sourceMappingURL=interface.service.d.ts.map