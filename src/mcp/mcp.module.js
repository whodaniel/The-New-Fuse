"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MCPModule = void 0;
import common_1 from '@nestjs/common';
import MCPAgentServer_1 from './MCPAgentServer.js';
import MCPChatServer_1 from './MCPChatServer.js';
import MCPWorkflowServer_1 from './MCPWorkflowServer.js';
import MCPFuseServer_1 from './MCPFuseServer.js';
import agent_module_1 from '../modules/agent.module';
/**
 * MCP Module that provides all MCP server implementations
 * This module integrates the Model-Controller-Provider protocol into The New Fuse
 */
let MCPModule = class MCPModule {
};
exports.MCPModule = MCPModule;
exports.MCPModule = MCPModule = __decorate([
    (0, common_1.Module)({
        imports: [agent_module_1.AgentModule],
        providers: [MCPAgentServer_1.MCPAgentServer, MCPChatServer_1.MCPChatServer, MCPWorkflowServer_1.MCPWorkflowServer, MCPFuseServer_1.MCPFuseServer],
        exports: [MCPAgentServer_1.MCPAgentServer, MCPChatServer_1.MCPChatServer, MCPWorkflowServer_1.MCPWorkflowServer, MCPFuseServer_1.MCPFuseServer],
    })
], MCPModule);
