"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var DrizzleService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DrizzleService = void 0;
// @ts-nocheck
/**
 * DrizzleService - Legacy compatibility layer
 *
 * This service now wraps the DatabaseService from @the-new-fuse/database
 * which uses Drizzle ORM instead of Drizzle.
 *
 * @deprecated Use DatabaseService directly from @the-new-fuse/database
 */
const common_1 = require("@nestjs/common");
const database_1 = require("@the-new-fuse/database");
let DrizzleService = DrizzleService_1 = class DrizzleService extends database_1.DatabaseService {
    constructor() {
        super(...arguments);
        this.drizzleLogger = new common_1.Logger(DrizzleService_1.name);
    }
    // Aliases for backward compatibility with Drizzle-style property access
    get user() { return this.users; }
    get agent() { return this.agents; }
    get chat() { return this.chats; }
    get task() { return this.tasks; }
    get workflow() { return this.workflows; }
    get workspace() { return this.workspaces; }
    // Stubs for models not yet migrated to Drizzle Repositories
    // These return a Proxy to allow compilation but will throw clear errors at runtime
    get wallet() { return this.createProxy('wallet'); }
    get promptTemplate() { return this.createProxy('promptTemplate'); }
    get promptVersion() { return this.createProxy('promptVersion'); }
    get workflowExecution() { return this.createProxy('workflowExecution'); }
    get lLMConfig() { return this.createProxy('lLMConfig'); }
    createProxy(modelName) {
        return new Proxy({}, {
            get: (target, prop) => {
                // Return a function that throws
                return (...args) => {
                    const msg = `Model '${modelName}' is not yet migrated to Drizzle. Operation '${String(prop)}' failed.`;
                    this.drizzleLogger.error(msg);
                    throw new Error(msg);
                };
            }
        });
    }
};
exports.DrizzleService = DrizzleService;
exports.DrizzleService = DrizzleService = DrizzleService_1 = __decorate([
    (0, common_1.Injectable)()
], DrizzleService);
//# sourceMappingURL=prisma.service.js.map