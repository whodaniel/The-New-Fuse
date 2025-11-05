import { PrismaService } from '../prisma/prisma.service';
import { LoggingService } from '../services/logging.service';
import { EventBus } from '../events/event-bus.service';
export declare class UsersService {
    private prisma;
    private logger;
    private eventBus;
    constructor(prisma: PrismaService, logger: LoggingService, eventBus: EventBus);
    create(data: any): Promise<any>;
    findAll(): Promise<any>;
    findById(id: string): Promise<any>;
    findByEmail(email: string): Promise<any>;
    update(id: string, data: any): Promise<any>;
    delete(id: string): Promise<{
        success: boolean;
    }>;
    sanitizeUser(user: any): any;
}
//# sourceMappingURL=users.service.d.ts.map