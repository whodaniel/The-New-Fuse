var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
import { Injectable, Logger } from '@nestjs/common';
import { TheNewFuseMCPServer } from '../../../../src/mcp/TheNewFuseMCPServer';
let TNFMCPService = (() => {
    let _classDecorators = [Injectable()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var TNFMCPService = _classThis = class {
        constructor(agentService, chatService, workflowService, monitoringService, claudeDevService) {
            this.agentService = agentService;
            this.chatService = chatService;
            this.workflowService = workflowService;
            this.monitoringService = monitoringService;
            this.claudeDevService = claudeDevService;
            this.logger = new Logger(TNFMCPService.name);
        }
        async onModuleInit() {
            this.logger.log('Initializing TNF MCP Service...');
            try {
                // Create MCP server instance
                this.mcpServer = new TheNewFuseMCPServer(false); // stdio mode by default
                // Inject actual services
                this.mcpServer.setServices({
                    agent: this.agentService,
                    chat: this.chatService,
                    workflow: this.workflowService,
                    monitoring: this.monitoringService,
                    claudeDev: this.claudeDevService,
                });
                this.logger.log('TNF MCP Service initialized successfully');
            }
            catch (error) {
                this.logger.error('Failed to initialize TNF MCP Service:', error);
                throw error;
            }
        }
        getMCPServer() {
            return this.mcpServer;
        }
        async startRemoteServer(port = 3001) {
            if (!this.mcpServer) {
                throw new Error('MCP Server not initialized');
            }
            try {
                await this.mcpServer.start('http', port);
                this.logger.log(`TNF MCP Server started on port ${port}`);
            }
            catch (error) {
                this.logger.error('Failed to start remote MCP server:', error);
                throw error;
            }
        }
        async getServerStatus() {
            return {
                status: 'running',
                initialized: !!this.mcpServer,
                services: {
                    agent: !!this.agentService,
                    chat: !!this.chatService,
                    workflow: !!this.workflowService,
                    monitoring: !!this.monitoringService,
                    claudeDev: !!this.claudeDevService,
                },
                timestamp: new Date().toISOString(),
            };
        }
    };
    __setFunctionName(_classThis, "TNFMCPService");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        TNFMCPService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return TNFMCPService = _classThis;
})();
export { TNFMCPService };
