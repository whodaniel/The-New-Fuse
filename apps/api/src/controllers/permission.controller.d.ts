import { PermissionService } from '../services/permission.service';
import { UpdateUserPermissionsDto } from '../dtos/permission.dto';
import { Request } from 'express';
export declare class PermissionController {
    private readonly permissionService;
    constructor(permissionService: PermissionService);
    getUserPermissions(userId: string): any;
    updateUserPermissions(userId: string, updateUserPermissionsDto: UpdateUserPermissionsDto, req: Request): any;
    getAllAgents(): any;
}
//# sourceMappingURL=permission.controller.d.ts.map