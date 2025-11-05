import { Permission } from '@the-new-fuse/types';
export declare class RoleService {
    findAll(): Promise<never[]>;
    getAllRoles(): Promise<{
        id: string;
        name: string;
        permissions: any[];
    }[]>;
    updateRolePermissions(roleId: string, permissions: Permission[]): Promise<{
        id: string;
        permissions: Permission[];
    }>;
    findById(_id: string): Promise<null>;
    create(roleData: any): Promise<any>;
    update(id: string, roleData: any): Promise<any>;
    delete(_id: string): Promise<boolean>;
}
//# sourceMappingURL=role.service.d.ts.map