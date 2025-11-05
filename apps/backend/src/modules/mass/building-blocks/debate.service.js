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
exports.DebateService = void 0;
const common_1 = require("@nestjs/common");
const mass_blocks_service_1 = require("./mass-blocks.service");
const mass_blocks_service_2 = require("./mass-blocks.service");
let DebateService = class DebateService {
    debateBlock;
    agentExecutor;
    constructor(debateBlock, agentExecutor) {
        this.debateBlock = debateBlock;
        this.agentExecutor = agentExecutor;
    }
    async execute(debaterAgentIds, input, config) {
        const debateConfig = {
            type: 'debate',
            parameters: {
                debaterAgentIds,
                debateRounds: config.debateRounds || 3,
                votingStrategy: config.votingStrategy || 'majority'
            }
        };
        const result = await this.debateBlock.execute(input, debateConfig);
        return {
            result,
            executionMetrics: {
                debaterAgentIds,
                debateRounds: config.debateRounds || 3,
                timestamp: new Date().toISOString()
            }
        };
    }
};
exports.DebateService = DebateService;
exports.DebateService = DebateService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [mass_blocks_service_1.DebateBlock,
        mass_blocks_service_2.AgentExecutorService])
], DebateService);
//# sourceMappingURL=debate.service.js.map