import { PrismaService } from '../prisma/prisma.service.js';
import { LoggingService } from '../services/logging.service.js';
import { EventBus } from '../events/event-bus.service.js';
export declare class UsersService {
    private prisma;
    private logger;
    private eventBus;
    constructor(prisma: PrismaService, logger: LoggingService, eventBus: EventBus);
    create(data: any): Promise<any>;
    findAll(): Promise<any[]>;
    findById(id: string): Promise<any>;
    findByEmail(email: string): Promise<{
        name: string | null;
        email: string;
        password: string | null;
        role: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        googleId: string | null;
        avatar: string | null;
        picture: string | null;
        emailVerified: boolean;
    } | null>;
    update(id: string, data: any): Promise<any>;
    delete(id: string): Promise<{
        success: boolean;
    }>;
    sanitizeUser(user: any): any;
}
