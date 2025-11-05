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
exports.ReflectService = void 0;
const common_1 = require("@nestjs/common");
const mass_blocks_service_1 = require("./mass-blocks.service");
const mass_blocks_service_2 = require("./mass-blocks.service");
let ReflectService = class ReflectService {
    reflectBlock;
    agentExecutor;
    constructor(reflectBlock, agentExecutor) {
        this.reflectBlock = reflectBlock;
        this.agentExecutor = agentExecutor;
    }
    async execute(predictorAgentId, reflectorAgentId, input, config) {
        const reflectConfig = {
            type: 'reflect',
            parameters: {
                predictorAgentId,
                reflectorAgentId,
                maxRounds: config.maxRounds
            }
        };
        const result = await this.reflectBlock.execute(input, reflectConfig);
        return {
            result,
            executionMetrics: {
                predictorAgentId,
                reflectorAgentId,
                timestamp: new Date().toISOString()
            }
        };
    }
};
exports.ReflectService = ReflectService;
exports.ReflectService = ReflectService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [mass_blocks_service_1.ReflectBlock,
        mass_blocks_service_2.AgentExecutorService])
], ReflectService);
//# sourceMappingURL=reflect.service.js.map