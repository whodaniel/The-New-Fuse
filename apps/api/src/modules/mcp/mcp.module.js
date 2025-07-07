"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.McpModule = void 0;
const common_1 = require("@nestjs/common");
const mcp_registry_service_1 = require("./mcp-registry.service");
const mcp_registry_server_1 = require("./mcp-registry.server");
const prisma_service_1 = require("../prisma/prisma.service");
let McpModule = class McpModule {
};
exports.McpModule = McpModule;
exports.McpModule = McpModule = __decorate([
    (0, common_1.Module)({
        providers: [mcp_registry_service_1.MCPRegistryService, mcp_registry_server_1.MCPRegistryServer, prisma_service_1.PrismaService],
        exports: [mcp_registry_service_1.MCPRegistryService, mcp_registry_server_1.MCPRegistryServer],
    })
], McpModule);
