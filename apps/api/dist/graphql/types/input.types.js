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
exports.CreateWorkflowInput = exports.ExecuteWorkflowInput = exports.UpdateAgentInput = exports.CreateAgentInput = void 0;
const graphql_1 = require("@nestjs/graphql");
let CreateAgentInput = class CreateAgentInput {
};
exports.CreateAgentInput = CreateAgentInput;
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], CreateAgentInput.prototype, "name", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], CreateAgentInput.prototype, "type", void 0);
__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    __metadata("design:type", String)
], CreateAgentInput.prototype, "description", void 0);
__decorate([
    (0, graphql_1.Field)(() => [String], { nullable: true }),
    __metadata("design:type", Array)
], CreateAgentInput.prototype, "capabilities", void 0);
__decorate([
    (0, graphql_1.Field)(() => String, { nullable: true }),
    __metadata("design:type", String)
], CreateAgentInput.prototype, "config", void 0);
exports.CreateAgentInput = CreateAgentInput = __decorate([
    (0, graphql_1.InputType)()
], CreateAgentInput);
let UpdateAgentInput = class UpdateAgentInput {
};
exports.UpdateAgentInput = UpdateAgentInput;
__decorate([
    (0, graphql_1.Field)(() => graphql_1.ID),
    __metadata("design:type", String)
], UpdateAgentInput.prototype, "id", void 0);
__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    __metadata("design:type", String)
], UpdateAgentInput.prototype, "name", void 0);
__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    __metadata("design:type", String)
], UpdateAgentInput.prototype, "description", void 0);
__decorate([
    (0, graphql_1.Field)(() => [String], { nullable: true }),
    __metadata("design:type", Array)
], UpdateAgentInput.prototype, "capabilities", void 0);
__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    __metadata("design:type", Boolean)
], UpdateAgentInput.prototype, "isActive", void 0);
exports.UpdateAgentInput = UpdateAgentInput = __decorate([
    (0, graphql_1.InputType)()
], UpdateAgentInput);
let ExecuteWorkflowInput = class ExecuteWorkflowInput {
};
exports.ExecuteWorkflowInput = ExecuteWorkflowInput;
__decorate([
    (0, graphql_1.Field)(() => graphql_1.ID),
    __metadata("design:type", String)
], ExecuteWorkflowInput.prototype, "workflowId", void 0);
__decorate([
    (0, graphql_1.Field)(() => String, { nullable: true }),
    __metadata("design:type", String)
], ExecuteWorkflowInput.prototype, "variables", void 0);
__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    __metadata("design:type", Boolean)
], ExecuteWorkflowInput.prototype, "async", void 0);
exports.ExecuteWorkflowInput = ExecuteWorkflowInput = __decorate([
    (0, graphql_1.InputType)()
], ExecuteWorkflowInput);
let CreateWorkflowInput = class CreateWorkflowInput {
};
exports.CreateWorkflowInput = CreateWorkflowInput;
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], CreateWorkflowInput.prototype, "name", void 0);
__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    __metadata("design:type", String)
], CreateWorkflowInput.prototype, "description", void 0);
__decorate([
    (0, graphql_1.Field)(() => String, { nullable: true }),
    __metadata("design:type", String)
], CreateWorkflowInput.prototype, "variables", void 0);
__decorate([
    (0, graphql_1.Field)(() => String, { nullable: true }),
    __metadata("design:type", String)
], CreateWorkflowInput.prototype, "triggers", void 0);
exports.CreateWorkflowInput = CreateWorkflowInput = __decorate([
    (0, graphql_1.InputType)()
], CreateWorkflowInput);
//# sourceMappingURL=input.types.js.map