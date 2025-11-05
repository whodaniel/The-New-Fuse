var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
// Minimal stubbed PrismaService that satisfies injection without requiring @prisma/client
export class PrismaService {
    async $connect() { }
    async $disconnect() { }
    constructor() {
        return new Proxy(this, {
            get(target, prop) {
                if (typeof prop === 'string') {
                    // Return a generic model proxy with common Prisma methods
                    return new Proxy({}, {
                        get(_model, method) {
                            if (method === 'findMany')
                                return async () => [];
                            if (method === 'findFirst')
                                return async () => null;
                            if (method === 'findUnique')
                                return async () => null;
                            if (method === 'create')
                                return async (args) => ({ id: 'stub-id', ...(args?.data || {}) });
                            if (method === 'update')
                                return async (_args) => ({});
                            if (method === 'delete')
                                return async (_args) => ({});
                            if (method === 'count')
                                return async () => 0;
                            return async () => null;
                        }
                    });
                }
                return target[prop];
            }
        });
    }
}
// Minimal DatabaseModule that provides PrismaService
let DatabaseModule = class DatabaseModule {
};
DatabaseModule = __decorate([
    Module({
        providers: [PrismaService],
        exports: [PrismaService]
    })
], DatabaseModule);
export { DatabaseModule };
export const $Enums = {};
// Provide a minimal PrismaClient for modules that import it directly
export class PrismaClient {
    async $connect() { }
    async $disconnect() { }
    constructor() {
        return new Proxy(this, {
            get(_target, prop) {
                if (typeof prop === 'string') {
                    return new Proxy({}, {
                        get(_model, method) {
                            if (method === 'findMany')
                                return async () => [];
                            if (method === 'findFirst')
                                return async () => null;
                            if (method === 'findUnique')
                                return async () => null;
                            if (method === 'create')
                                return async (args) => ({ id: 'stub-id', ...(args?.data || {}) });
                            if (method === 'update')
                                return async (_args) => ({});
                            if (method === 'delete')
                                return async (_args) => ({});
                            if (method === 'count')
                                return async () => 0;
                            return async () => null;
                        }
                    });
                }
                return this[prop];
            }
        });
    }
}
// Minimal enums and types used across controllers and guards
export var EnhancedUserRole;
(function (EnhancedUserRole) {
    EnhancedUserRole["USER"] = "USER";
    EnhancedUserRole["ADMIN"] = "ADMIN";
})(EnhancedUserRole || (EnhancedUserRole = {}));
export var AuditAction;
(function (AuditAction) {
    AuditAction["READ"] = "READ";
    AuditAction["WRITE"] = "WRITE";
})(AuditAction || (AuditAction = {}));
export var VersionChangeType;
(function (VersionChangeType) {
    VersionChangeType["CREATE"] = "CREATE";
    VersionChangeType["UPDATE"] = "UPDATE";
    VersionChangeType["DELETE"] = "DELETE";
})(VersionChangeType || (VersionChangeType = {}));
//# sourceMappingURL=stub.js.map