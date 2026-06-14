"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResourcesModule = void 0;
const common_1 = require("@nestjs/common");
const marketplace_module_1 = require("../marketplace/marketplace.module");
const resource_interaction_service_1 = require("./resource-interaction.service");
const personal_skills_service_1 = require("./personal-skills.service");
const resource_search_policy_service_1 = require("./resource-search-policy.service");
const resource_search_protocol_service_1 = require("./resource-search-protocol.service");
const resources_controller_1 = require("./resources.controller");
let ResourcesModule = class ResourcesModule {
};
exports.ResourcesModule = ResourcesModule;
exports.ResourcesModule = ResourcesModule = __decorate([
    (0, common_1.Module)({
        imports: [marketplace_module_1.MarketplaceModule],
        controllers: [resources_controller_1.ResourcesController],
        providers: [
            resource_search_policy_service_1.ResourceSearchPolicyService,
            resource_search_protocol_service_1.ResourceSearchProtocolService,
            resource_interaction_service_1.ResourceInteractionService,
            personal_skills_service_1.PersonalSkillsService,
        ],
    })
], ResourcesModule);
//# sourceMappingURL=resources.module.js.map