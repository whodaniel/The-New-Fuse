var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { z } from 'zod';
import { ApiProperty } from '@nestjs/swagger';
export const AgentSchema = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional(),
    systemPrompt: z.string(),
    maxTokens: z.number().optional(),
    temperature: z.number().optional(),
    createdAt: z.date(),
    updatedAt: z.date(),
});
export const CreateAgentSchema = AgentSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true
});
export class CreateAgentDtoZod {
    constructor() {
        this.name = '';
        this.systemPrompt = '';
    }
}
__decorate([
    ApiProperty({ description: 'Name of the agent' }),
    __metadata("design:type", String)
], CreateAgentDtoZod.prototype, "name", void 0);
__decorate([
    ApiProperty({ description: 'Description of the agent', required: false }),
    __metadata("design:type", String)
], CreateAgentDtoZod.prototype, "description", void 0);
__decorate([
    ApiProperty({ description: 'System prompt for the agent' }),
    __metadata("design:type", String)
], CreateAgentDtoZod.prototype, "systemPrompt", void 0);
__decorate([
    ApiProperty({ description: 'Maximum tokens for agent response', required: false }),
    __metadata("design:type", Number)
], CreateAgentDtoZod.prototype, "maxTokens", void 0);
__decorate([
    ApiProperty({ description: 'Temperature for agent response generation', required: false }),
    __metadata("design:type", Number)
], CreateAgentDtoZod.prototype, "temperature", void 0);
export const UpdateAgentSchema = AgentSchema.partial();
export class UpdateAgentDtoZod {
}
__decorate([
    ApiProperty({ description: 'Name of the agent', required: false }),
    __metadata("design:type", String)
], UpdateAgentDtoZod.prototype, "name", void 0);
__decorate([
    ApiProperty({ description: 'Description of the agent', required: false }),
    __metadata("design:type", String)
], UpdateAgentDtoZod.prototype, "description", void 0);
__decorate([
    ApiProperty({ description: 'System prompt for the agent', required: false }),
    __metadata("design:type", String)
], UpdateAgentDtoZod.prototype, "systemPrompt", void 0);
__decorate([
    ApiProperty({ description: 'Maximum tokens for agent response', required: false }),
    __metadata("design:type", Number)
], UpdateAgentDtoZod.prototype, "maxTokens", void 0);
__decorate([
    ApiProperty({ description: 'Temperature for agent response generation', required: false }),
    __metadata("design:type", Number)
], UpdateAgentDtoZod.prototype, "temperature", void 0);
//# sourceMappingURL=agent-validation.dto.js.map