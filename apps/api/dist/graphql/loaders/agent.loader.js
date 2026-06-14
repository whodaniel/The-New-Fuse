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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentLoader = void 0;
/**
 * Agent DataLoader - Migrated to Drizzle ORM
 * Provides efficient batched loading of agents for GraphQL resolvers
 */
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const database_1 = require("@the-new-fuse/database");
const dataloader_1 = __importDefault(require("dataloader"));
let AgentLoader = class AgentLoader {
    constructor(db, request) {
        this.db = db;
        this.request = request;
        const userId = this.request?.user?.id || this.request?.req?.user?.id;
        this.batchAgents = new dataloader_1.default(async (agentIds) => {
            // Load each agent individually since there's no batch method
            const results = await Promise.all(agentIds.map((id) => this.db.agents.findById(id, userId)));
            return results;
        });
        this.batchAgentsByUser = new dataloader_1.default(async (userIds) => {
            // For each userId, fetch agents owned by that user
            const agentsByUser = new Map();
            for (const userId of userIds) {
                const agents = await this.db.agents.findByUserId(userId);
                agentsByUser.set(userId, agents);
            }
            return userIds.map((userId) => agentsByUser.get(userId) || []);
        });
    }
    async load(agentId) {
        return this.batchAgents.load(agentId);
    }
    async loadMany(agentIds) {
        return this.batchAgents.loadMany(agentIds);
    }
    async loadByUserId(userId) {
        return this.batchAgentsByUser.load(userId);
    }
};
exports.AgentLoader = AgentLoader;
exports.AgentLoader = AgentLoader = __decorate([
    (0, common_1.Injectable)({ scope: common_1.Scope.REQUEST }),
    __param(1, (0, common_1.Inject)(core_1.REQUEST)),
    __metadata("design:paramtypes", [database_1.DatabaseService, Object])
], AgentLoader);
//# sourceMappingURL=agent.loader.js.map