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
exports.CustomAgentService = void 0;
const common_1 = require("@nestjs/common");
const mass_blocks_service_1 = require("./mass-blocks.service");
let CustomAgentService = class CustomAgentService {
    massBlocksService;
    constructor(massBlocksService) {
        this.massBlocksService = massBlocksService;
    }
    async execute(agentId, input, config) {
        const customConfig = {
            type: 'custom',
            parameters: {
                agentId,
                customLogic: config.customLogic,
                parameters: config.parameters
            }
        };
        const result = await this.massBlocksService.executeBlock(agentId, input, customConfig);
        return {
            result,
            executionMetrics: {
                agentId,
                customLogic: config.customLogic,
                timestamp: new Date().toISOString()
            }
        };
    }
};
exports.CustomAgentService = CustomAgentService;
exports.CustomAgentService = CustomAgentService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [mass_blocks_service_1.MassBlocksService])
], CustomAgentService);
//# sourceMappingURL=custom-agent.service.js.map