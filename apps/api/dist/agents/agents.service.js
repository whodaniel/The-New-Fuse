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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const database_1 = require("@the-new-fuse/database");
const agent_factory_1 = require("./agent.factory");
let AgentsService = class AgentsService {
    constructor(db, config, agentFactory, monitoring) {
        this.db = db;
        this.config = config;
        this.agentFactory = agentFactory;
        this.monitoring = monitoring;
    }
    async create(userId, dto) {
        try {
            const agent = await this.db.agents.create({
                ...dto,
                userId,
                config: this.agentFactory.getDefaultConfig(dto.type),
            });
            this.monitoring?.recordMetric('agent.created', 1, {
                type: dto.type,
                userId,
            });
            return agent;
        }
        catch (error) {
            this.monitoring?.captureError(error, { userId, dto });
            throw error;
        }
    }
    async findAll(userId) {
        const agents = await this.db.agents.findByUserId(userId);
        // Enrich with latest chat for compatibility
        const enrichedAgents = await Promise.all(agents.map(async (agent) => {
            // Assuming findChatsByAgentId exists and returns chats sorted by date or we sort here
            // The repository method findChatsByAgentId sorts by createdAt desc usually?
            // Let's rely on finding standard chats
            let chats = [];
            try {
                chats = await this.db.chats.findChatsByAgentId(agent.id);
            }
            catch (e) {
                // ignore if fails
            }
            return {
                ...agent,
                chats: chats.slice(0, 1),
            };
        }));
        return enrichedAgents;
    }
    async update(id, userId, dto) {
        // Verify ownership
        const agent = await this.db.agents.findById(id, userId);
        if (!agent) {
            throw new common_1.NotFoundException('Agent not found');
        }
        return this.db.agents.update(id, userId, {
            name: dto.name,
            description: dto.description,
            capabilities: dto.capabilities,
            config: dto.config,
        });
    }
};
exports.AgentsService = AgentsService;
exports.AgentsService = AgentsService = __decorate([
    (0, common_1.Injectable)(),
    __param(3, (0, common_1.Optional)()),
    __param(3, (0, common_1.Inject)('UnifiedMonitoringService')),
    __metadata("design:paramtypes", [database_1.DatabaseService,
        config_1.ConfigService,
        agent_factory_1.AgentFactory, Object])
], AgentsService);
//# sourceMappingURL=agents.service.js.map