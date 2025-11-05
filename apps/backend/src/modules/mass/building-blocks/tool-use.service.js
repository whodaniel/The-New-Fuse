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
exports.ToolUseService = void 0;
const common_1 = require("@nestjs/common");
const mass_blocks_service_1 = require("./mass-blocks.service");
let ToolUseService = class ToolUseService {
    massBlocksService;
    constructor(massBlocksService) {
        this.massBlocksService = massBlocksService;
    }
    async execute(agentId, input, config) {
        const toolUseConfig = {
            type: 'tool-use',
            parameters: {
                agentId,
                toolName: config.toolName,
                parameters: config.parameters
            }
        };
        const result = await this.massBlocksService.executeBlock(agentId, input, toolUseConfig);
        return {
            result,
            executionMetrics: {
                agentId,
                toolName: config.toolName,
                timestamp: new Date().toISOString()
            }
        };
    }
};
exports.ToolUseService = ToolUseService;
exports.ToolUseService = ToolUseService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [mass_blocks_service_1.MassBlocksService])
], ToolUseService);
//# sourceMappingURL=tool-use.service.js.map