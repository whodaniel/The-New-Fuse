var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable } from '@nestjs/common';
import { z } from 'zod';
export const AuditLogEntry = z.object({
    id: z.string().optional(),
    action: z.string(),
    timestamp: z
        .date()
        .optional()
        .default(() => new Date()),
    userId: z.string().optional(),
    resourceId: z.string().optional(),
    resourceType: z.string().optional(),
    details: z.record(z.string(), z.any()).optional(),
});
let AuditService = class AuditService {
    constructor(storage) {
        this.storage = storage;
    }
    async log(entry) {
        const fullEntry = AuditLogEntry.parse({
            ...entry,
            id: crypto.randomUUID(),
            timestamp: new Date(),
        });
        await this.storage.store(fullEntry);
    }
    async query(filter) {
        return this.storage.query(filter);
    }
};
AuditService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [Object])
], AuditService);
export { AuditService };
//# sourceMappingURL=index.js.map