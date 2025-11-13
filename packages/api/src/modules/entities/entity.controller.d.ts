import { EntityService } from './entity.service';
import { CreateEntityDto } from './dto/create-entity.dto';
import { BaseController } from '../controllers/base.controller';
import { ApiResponse as FuseApiResponse } from '@the-new-fuse/types';
export declare class EntityController extends BaseController {
    private readonly entityService;
    constructor(entityService: EntityService);
    create(createEntityDto: CreateEntityDto): Promise<FuseApiResponse<any>>;
    findAll(type?: string, name?: string, skip?: number, take?: number): Promise<FuseApiResponse<any[]>>;
    findOne(id: string): Promise<FuseApiResponse<any>>;
    remove(id: string): Promise<FuseApiResponse<void>>;
}
//# sourceMappingURL=entity.controller.d.ts.map