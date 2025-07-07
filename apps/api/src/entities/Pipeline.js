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
exports.Pipeline = void 0;
const typeorm_1 = require("typeorm");
let Pipeline = class Pipeline {
    id;
    name;
    description;
    configuration;
    user;
    userId;
    agent;
    agentId;
    tasks;
    createdAt;
    updatedAt;
    deletedAt;
};
exports.Pipeline = Pipeline;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Pipeline.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Pipeline.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Pipeline.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], Pipeline.prototype, "configuration", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => 'User', user => user.pipelines),
    __metadata("design:type", Function)
], Pipeline.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Pipeline.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => 'Agent', agent => agent.pipelines),
    __metadata("design:type", Function)
], Pipeline.prototype, "agent", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Pipeline.prototype, "agentId", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => 'Task', task => task.pipeline),
    __metadata("design:type", Array)
], Pipeline.prototype, "tasks", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Pipeline.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Pipeline.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.DeleteDateColumn)(),
    __metadata("design:type", Date)
], Pipeline.prototype, "deletedAt", void 0);
exports.Pipeline = Pipeline = __decorate([
    (0, typeorm_1.Entity)()
], Pipeline);
