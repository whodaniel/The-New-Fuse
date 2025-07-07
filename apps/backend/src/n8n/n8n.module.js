"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.N8nModule = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const config_1 = require("@nestjs/config");
const n8n_integration_controller_1 = require("./n8n-integration.controller");
const n8n_metadata_service_1 = require("./n8n-metadata.service");
let N8nModule = class N8nModule {
};
exports.N8nModule = N8nModule;
exports.N8nModule = N8nModule = __decorate([
    (0, common_1.Module)({
        imports: [
            axios_1.HttpModule,
            config_1.ConfigModule,
        ],
        controllers: [n8n_integration_controller_1.N8nIntegrationController],
        providers: [n8n_metadata_service_1.N8nMetadataService],
        exports: [n8n_metadata_service_1.N8nMetadataService],
    })
], N8nModule);
