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
exports.AgentType = exports.AgentStatus = void 0;
const graphql_1 = require("@nestjs/graphql");
const user_type_1 = require("./user.type");
var AgentStatus;
(function (AgentStatus) {
    AgentStatus["ACTIVE"] = "ACTIVE";
    AgentStatus["INACTIVE"] = "INACTIVE";
    AgentStatus["PROCESSING"] = "PROCESSING";
    AgentStatus["ERROR"] = "ERROR";
})(AgentStatus || (exports.AgentStatus = AgentStatus = {}));
(0, graphql_1.registerEnumType)(AgentStatus, {
    name: 'AgentStatus',
    description: 'The status of an agent',
});
let AgentType = class AgentType {
};
exports.AgentType = AgentType;
__decorate([
    (0, graphql_1.Field)(() => graphql_1.ID),
    __metadata("design:type", String)
], AgentType.prototype, "id", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], AgentType.prototype, "name", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], AgentType.prototype, "type", void 0);
__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    __metadata("design:type", String)
], AgentType.prototype, "description", void 0);
__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    __metadata("design:type", String)
], AgentType.prototype, "instanceId", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", Boolean)
], AgentType.prototype, "isActive", void 0);
__decorate([
    (0, graphql_1.Field)(() => [String], { nullable: 'itemsAndList' }),
    __metadata("design:type", Array)
], AgentType.prototype, "capabilities", void 0);
__decorate([
    (0, graphql_1.Field)(() => user_type_1.UserType, { nullable: true }),
    __metadata("design:type", user_type_1.UserType)
], AgentType.prototype, "owner", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", Date)
], AgentType.prototype, "createdAt", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", Date)
], AgentType.prototype, "updatedAt", void 0);
__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    __metadata("design:type", Date)
], AgentType.prototype, "lastActiveAt", void 0);
__decorate([
    (0, graphql_1.Field)(() => String, { nullable: true }),
    __metadata("design:type", String)
], AgentType.prototype, "config", void 0);
__decorate([
    (0, graphql_1.Field)(() => String, { nullable: true }),
    __metadata("design:type", String)
], AgentType.prototype, "metadata", void 0);
__decorate([
    (0, graphql_1.Field)(() => AgentStatus),
    __metadata("design:type", String)
], AgentType.prototype, "status", void 0);
exports.AgentType = AgentType = __decorate([
    (0, graphql_1.ObjectType)('Agent')
], AgentType);
//# sourceMappingURL=agent.type.js.map