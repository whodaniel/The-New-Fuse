import { EventBus } from '../../events/event-bus.service';
import { PrismaService } from '@the-new-fuse/database';
export declare class UsersService {
    private prisma;
    private eventBus;
    private readonly logger;
    constructor(prisma: PrismaService, eventBus: EventBus);
    create(data: any): Promise<any>;
    findAll(): Promise<any>;
    findOne(id: string): Promise<any>;
    findById(id: string): Promise<any>;
    findByEmail(email: string): Promise<any>;
    update(id: string, data: any): Promise<any>;
    delete(id: string): Promise<{
        success: boolean;
    }>;
    sanitizeUser(user: any): any;
}
//# sourceMappingURL=users.service.d.ts.map