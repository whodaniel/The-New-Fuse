var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a;
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from 'typeorm';
import { User } from './User';
import { Pipeline } from './Pipeline';
let Agent = class Agent {
    id;
    name;
    type;
    config;
    user;
    userId;
    pipelines;
    createdAt;
    updatedAt;
    deletedAt;
};
__decorate([
    PrimaryGeneratedColumn('uuid'),
    __metadata("design:type", String)
], Agent.prototype, "id", void 0);
__decorate([
    Column(),
    __metadata("design:type", String)
], Agent.prototype, "name", void 0);
__decorate([
    Column(),
    __metadata("design:type", String)
], Agent.prototype, "type", void 0);
__decorate([
    Column({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], Agent.prototype, "config", void 0);
__decorate([
    ManyToOne(() => User, user => user.agents),
    __metadata("design:type", typeof (_a = typeof User !== "undefined" && User) === "function" ? _a : Object)
], Agent.prototype, "user", void 0);
__decorate([
    Column(),
    __metadata("design:type", String)
], Agent.prototype, "userId", void 0);
__decorate([
    OneToMany(() => Pipeline, pipeline => pipeline.agent),
    __metadata("design:type", Array)
], Agent.prototype, "pipelines", void 0);
__decorate([
    CreateDateColumn(),
    __metadata("design:type", Date)
], Agent.prototype, "createdAt", void 0);
__decorate([
    UpdateDateColumn(),
    __metadata("design:type", Date)
], Agent.prototype, "updatedAt", void 0);
__decorate([
    DeleteDateColumn(),
    __metadata("design:type", Date)
], Agent.prototype, "deletedAt", void 0);
Agent = __decorate([
    Entity()
], Agent);
export { Agent };
//# sourceMappingURL=Agent.js.map