import { InterfaceService } from '../services/interface.service';
import { CreateInterfaceDto, UpdateInterfaceDto } from '../dtos/interface.dto';
export declare class InterfaceController {
    private readonly interfaceService;
    constructor(interfaceService: InterfaceService);
    create(createInterfaceDto: CreateInterfaceDto, userId: string): any;
    findAll(userId: string): any;
    findOne(id: string): any;
    update(id: string, updateInterfaceDto: UpdateInterfaceDto, userId: string): any;
    remove(id: string, userId: string): any;
    execute(id: string, executionData: {
        formData: Record<string, any>;
    }): any;
}
//# sourceMappingURL=interface.controller.d.ts.map