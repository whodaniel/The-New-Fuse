"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResourceRegistryModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const resource_registry_service_1 = require("./services/resource-registry.service");
const resource_access_control_service_1 = require("./services/resource-access-control.service");
const resource_registry_controller_1 = require("./controllers/resource-registry.controller");
let ResourceRegistryModule = class ResourceRegistryModule {
};
exports.ResourceRegistryModule = ResourceRegistryModule;
exports.ResourceRegistryModule = ResourceRegistryModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
            }),
        ],
        controllers: [resource_registry_controller_1.ResourceRegistryController],
        providers: [
            resource_registry_service_1.ResourceRegistryService,
            resource_access_control_service_1.ResourceAccessControlService,
        ],
        exports: [
            resource_registry_service_1.ResourceRegistryService,
            resource_access_control_service_1.ResourceAccessControlService,
        ],
    })
], ResourceRegistryModule);
//# sourceMappingURL=resource-registry.module.js.map