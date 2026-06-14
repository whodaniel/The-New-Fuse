var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Agent } from './agent.entity.js';
import { PromptTemplate } from './prompt.entity.js';
let AgentPrompt = class AgentPrompt {
};
__decorate([
    PrimaryGeneratedColumn('uuid'),
    __metadata("design:type", String)
], AgentPrompt.prototype, "id", void 0);
__decorate([
    Column('uuid'),
    __metadata("design:type", String)
], AgentPrompt.prototype, "agentId", void 0);
__decorate([
    ManyToOne(() => Agent, { nullable: false }),
    JoinColumn({ name: 'agentId' }),
    __metadata("design:type", Agent)
], AgentPrompt.prototype, "agent", void 0);
__decorate([
    Column('uuid'),
    __metadata("design:type", String)
], AgentPrompt.prototype, "promptId", void 0);
__decorate([
    ManyToOne(() => PromptTemplate, { nullable: false }),
    JoinColumn({ name: 'promptId' }),
    __metadata("design:type", PromptTemplate)
], AgentPrompt.prototype, "prompt", void 0);
__decorate([
    Column({
        type: 'enum',
        enum: ['system', 'user', 'function', 'response'],
        default: 'user'
    }),
    __metadata("design:type", String)
], AgentPrompt.prototype, "purpose", void 0);
__decorate([
    Column('jsonb', { nullable: true }),
    __metadata("design:type", Object)
], AgentPrompt.prototype, "config", void 0);
__decorate([
    Column('jsonb', { nullable: true }),
    __metadata("design:type", Object)
], AgentPrompt.prototype, "formatOptions", void 0);
__decorate([
    CreateDateColumn(),
    __metadata("design:type", Date)
], AgentPrompt.prototype, "createdAt", void 0);
__decorate([
    UpdateDateColumn(),
    __metadata("design:type", Date)
], AgentPrompt.prototype, "updatedAt", void 0);
AgentPrompt = __decorate([
    Entity('agent_prompts')
], AgentPrompt);
export { AgentPrompt };
//# sourceMappingURL=agent-prompt.entity.js.map