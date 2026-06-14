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
exports.WorkflowType = exports.WorkflowStatisticsType = exports.WorkflowStatus = void 0;
const graphql_1 = require("@nestjs/graphql");
const user_type_1 = require("./user.type");
const workflow_step_type_1 = require("./workflow-step.type");
var WorkflowStatus;
(function (WorkflowStatus) {
    WorkflowStatus["IDLE"] = "IDLE";
    WorkflowStatus["RUNNING"] = "RUNNING";
    WorkflowStatus["COMPLETED"] = "COMPLETED";
    WorkflowStatus["FAILED"] = "FAILED";
    WorkflowStatus["PAUSED"] = "PAUSED";
})(WorkflowStatus || (exports.WorkflowStatus = WorkflowStatus = {}));
(0, graphql_1.registerEnumType)(WorkflowStatus, {
    name: 'WorkflowStatus',
    description: 'The execution status of a workflow',
});
let WorkflowStatisticsType = class WorkflowStatisticsType {
};
exports.WorkflowStatisticsType = WorkflowStatisticsType;
__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    __metadata("design:type", Number)
], WorkflowStatisticsType.prototype, "averageExecutionTime", void 0);
__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    __metadata("design:type", Number)
], WorkflowStatisticsType.prototype, "successRate", void 0);
__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    __metadata("design:type", String)
], WorkflowStatisticsType.prototype, "lastExecutionStatus", void 0);
exports.WorkflowStatisticsType = WorkflowStatisticsType = __decorate([
    (0, graphql_1.ObjectType)('WorkflowStatistics')
], WorkflowStatisticsType);
let WorkflowType = class WorkflowType {
};
exports.WorkflowType = WorkflowType;
__decorate([
    (0, graphql_1.Field)(() => graphql_1.ID),
    __metadata("design:type", String)
], WorkflowType.prototype, "id", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], WorkflowType.prototype, "name", void 0);
__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    __metadata("design:type", String)
], WorkflowType.prototype, "description", void 0);
__decorate([
    (0, graphql_1.Field)(() => user_type_1.UserType, { nullable: true }),
    __metadata("design:type", user_type_1.UserType)
], WorkflowType.prototype, "creator", void 0);
__decorate([
    (0, graphql_1.Field)(() => [workflow_step_type_1.WorkflowStepType], { nullable: 'itemsAndList' }),
    __metadata("design:type", Array)
], WorkflowType.prototype, "steps", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", Boolean)
], WorkflowType.prototype, "isActive", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", Date)
], WorkflowType.prototype, "createdAt", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", Date)
], WorkflowType.prototype, "updatedAt", void 0);
__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    __metadata("design:type", Date)
], WorkflowType.prototype, "lastExecutedAt", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_1.Int),
    __metadata("design:type", Number)
], WorkflowType.prototype, "executionCount", void 0);
__decorate([
    (0, graphql_1.Field)(() => WorkflowStatisticsType, { nullable: true }),
    __metadata("design:type", WorkflowStatisticsType)
], WorkflowType.prototype, "statistics", void 0);
__decorate([
    (0, graphql_1.Field)(() => String, { nullable: true }),
    __metadata("design:type", String)
], WorkflowType.prototype, "variables", void 0);
__decorate([
    (0, graphql_1.Field)(() => String, { nullable: true }),
    __metadata("design:type", String)
], WorkflowType.prototype, "triggers", void 0);
__decorate([
    (0, graphql_1.Field)(() => String, { nullable: true }),
    __metadata("design:type", String)
], WorkflowType.prototype, "metadata", void 0);
__decorate([
    (0, graphql_1.Field)(() => WorkflowStatus),
    __metadata("design:type", String)
], WorkflowType.prototype, "status", void 0);
exports.WorkflowType = WorkflowType = __decorate([
    (0, graphql_1.ObjectType)('Workflow')
], WorkflowType);
//# sourceMappingURL=workflow.type.js.map