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
exports.WorkflowStepType = exports.WorkflowStepStatisticsType = void 0;
const graphql_1 = require("@nestjs/graphql");
const agent_type_1 = require("./agent.type");
let WorkflowStepStatisticsType = class WorkflowStepStatisticsType {
};
exports.WorkflowStepStatisticsType = WorkflowStepStatisticsType;
__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    __metadata("design:type", Number)
], WorkflowStepStatisticsType.prototype, "averageExecutionTime", void 0);
__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    __metadata("design:type", Number)
], WorkflowStepStatisticsType.prototype, "successRate", void 0);
__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    __metadata("design:type", String)
], WorkflowStepStatisticsType.prototype, "lastExecutionStatus", void 0);
__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    __metadata("design:type", Number)
], WorkflowStepStatisticsType.prototype, "errorCount", void 0);
exports.WorkflowStepStatisticsType = WorkflowStepStatisticsType = __decorate([
    (0, graphql_1.ObjectType)('WorkflowStepStatistics')
], WorkflowStepStatisticsType);
let WorkflowStepType = class WorkflowStepType {
};
exports.WorkflowStepType = WorkflowStepType;
__decorate([
    (0, graphql_1.Field)(() => graphql_1.ID),
    __metadata("design:type", String)
], WorkflowStepType.prototype, "id", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], WorkflowStepType.prototype, "name", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], WorkflowStepType.prototype, "type", void 0);
__decorate([
    (0, graphql_1.Field)(() => agent_type_1.AgentType, { nullable: true }),
    __metadata("design:type", agent_type_1.AgentType)
], WorkflowStepType.prototype, "agent", void 0);
__decorate([
    (0, graphql_1.Field)(() => [String]),
    __metadata("design:type", Array)
], WorkflowStepType.prototype, "nextSteps", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", Boolean)
], WorkflowStepType.prototype, "isActive", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", Date)
], WorkflowStepType.prototype, "createdAt", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", Date)
], WorkflowStepType.prototype, "updatedAt", void 0);
__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    __metadata("design:type", Date)
], WorkflowStepType.prototype, "lastExecutedAt", void 0);
__decorate([
    (0, graphql_1.Field)(() => WorkflowStepStatisticsType, { nullable: true }),
    __metadata("design:type", WorkflowStepStatisticsType)
], WorkflowStepType.prototype, "statistics", void 0);
__decorate([
    (0, graphql_1.Field)(() => String, { nullable: true }),
    __metadata("design:type", String)
], WorkflowStepType.prototype, "config", void 0);
__decorate([
    (0, graphql_1.Field)(() => String, { nullable: true }),
    __metadata("design:type", String)
], WorkflowStepType.prototype, "conditions", void 0);
__decorate([
    (0, graphql_1.Field)(() => String, { nullable: true }),
    __metadata("design:type", String)
], WorkflowStepType.prototype, "transformations", void 0);
__decorate([
    (0, graphql_1.Field)(() => String, { nullable: true }),
    __metadata("design:type", String)
], WorkflowStepType.prototype, "metadata", void 0);
exports.WorkflowStepType = WorkflowStepType = __decorate([
    (0, graphql_1.ObjectType)('WorkflowStep')
], WorkflowStepType);
//# sourceMappingURL=workflow-step.type.js.map