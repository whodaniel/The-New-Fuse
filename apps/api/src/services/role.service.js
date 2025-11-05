var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Injectable } from '@nestjs/common';
import { Permission } from '@the-new-fuse/types';
let RoleService = class RoleService {
    async findAll() {
        return [];
    }
    async getAllRoles() {
        return [
            { id: '1', name: 'admin', permissions: [Permission.ADMIN_ACCESS] },
            { id: '2', name: 'user', permissions: [Permission.READ_USERS] },
        ];
    }
    async updateRolePermissions(roleId, permissions) {
        // Implementation would update role permissions in database
        return { id: roleId, permissions };
    }
    async findById(_id) {
        return null;
    }
    async create(roleData) {
        return roleData;
    }
    async update(id, roleData) {
        return roleData;
    }
    async delete(_id) {
        return true;
    }
};
RoleService = __decorate([
    Injectable()
], RoleService);
export { RoleService };
//# sourceMappingURL=role.service.js.map