import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../services/redis.service';
export declare class UsersService {
    private readonly prisma;
    private readonly redisService;
    private readonly logger;
    constructor(prisma: PrismaService, redisService: RedisService);
    findOne(id: string): Promise<any>;
    findByEmail(email: string): Promise<any>;
    create(userData: any): Promise<any>;
    update(id: string, userData: any): Promise<any>;
    delete(id: string): Promise<any>;
    findAll(): Promise<any>;
}
//# sourceMappingURL=user.service.d.ts.map