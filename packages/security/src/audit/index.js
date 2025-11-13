"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditService = exports.AuditLogEntry = void 0;
const common_1 = require("@nestjs/common");
const zod_1 = require("zod");
exports.AuditLogEntry = zod_1.z.object({
    id: zod_1.z.string().optional(),
    action: zod_1.z.string(),
    timestamp: zod_1.z.date().optional().default(() => new Date()),
    userId: zod_1.z.string().optional(),
    resourceId: zod_1.z.string().optional(),
    resourceType: zod_1.z.string().optional(),
    details: zod_1.z.record(zod_1.z.any()).optional()
});
let AuditService = class AuditService {
    storage;
    constructor(storage) {
        this.storage = storage;
    }
    async log(entry) {
        const fullEntry = exports.AuditLogEntry.parse({
            ...entry,
            id: crypto.randomUUID(),
            timestamp: new Date()
        });
        await this.storage.store(fullEntry);
    }
    async query(filter) {
        return this.storage.query(filter);
    }
};
exports.AuditService = AuditService;
exports.AuditService = AuditService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [Object])
], AuditService);
//# sourceMappingURL=index.js.map