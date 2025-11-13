import { PrismaService } from '../../services/prisma.service';
import { CreateEntityDto } from './dto/create-entity.dto';
export declare class EntityService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    createEntity(data: CreateEntityDto): Promise<any>;
}
//# sourceMappingURL=entity.service.d.ts.map