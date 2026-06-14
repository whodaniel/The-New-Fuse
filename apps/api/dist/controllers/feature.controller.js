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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeatureController = void 0;
const common_1 = require("@nestjs/common");
// Mock Feature Flags
let FEATURE_FLAGS = [
    {
        id: 'new-ui',
        name: 'New UI Layout',
        description: 'Enable the redesigned user interface',
        enabled: true,
        rolloutPercentage: 100,
    },
    {
        id: 'beta-workflows',
        name: 'Beta Workflow Engine',
        description: 'Access to experimental workflow features',
        enabled: false,
        rolloutPercentage: 0,
    },
    {
        id: 'agent-marketplace',
        name: 'Agent Marketplace',
        description: 'Browsable marketplace for agent skills',
        enabled: true,
        rolloutPercentage: 50,
    },
];
let FeatureController = class FeatureController {
    async getFeatureFlags() {
        return FEATURE_FLAGS;
    }
    async updateFeatureFlag(id, body) {
        const { enabled } = body;
        const index = FEATURE_FLAGS.findIndex((f) => f.id === id);
        if (index === -1) {
            return { success: false, message: 'Feature flag not found' };
        }
        FEATURE_FLAGS[index] = { ...FEATURE_FLAGS[index], enabled };
        return FEATURE_FLAGS[index];
    }
};
exports.FeatureController = FeatureController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], FeatureController.prototype, "getFeatureFlags", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], FeatureController.prototype, "updateFeatureFlag", null);
exports.FeatureController = FeatureController = __decorate([
    (0, common_1.Controller)('features')
], FeatureController);
//# sourceMappingURL=feature.controller.js.map