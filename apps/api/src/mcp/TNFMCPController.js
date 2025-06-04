var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
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
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
import { Controller, Get, Post, Logger } from '@nestjs/common';
let TNFMCPController = (() => {
    let _classDecorators = [Controller('mcp')];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _getStatus_decorators;
    let _startRemoteServer_decorators;
    let _getHealth_decorators;
    var TNFMCPController = _classThis = class {
        constructor(mcpService) {
            this.mcpService = (__runInitializers(this, _instanceExtraInitializers), mcpService);
            this.logger = new Logger(TNFMCPController.name);
        }
        async getStatus() {
            return this.mcpService.getServerStatus();
        }
        async startRemoteServer(body) {
            const port = body.port || 3001;
            try {
                await this.mcpService.startRemoteServer(port);
                return {
                    success: true,
                    message: `MCP Server started on port ${port}`,
                    port,
                };
            }
            catch (error) {
                this.logger.error('Failed to start remote server:', error);
                return {
                    success: false,
                    message: error.message,
                };
            }
        }
        async getHealth() {
            const status = await this.mcpService.getServerStatus();
            return {
                status: status.initialized ? 'healthy' : 'unhealthy',
                details: status,
                timestamp: new Date().toISOString(),
            };
        }
    };
    __setFunctionName(_classThis, "TNFMCPController");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _getStatus_decorators = [Get('status')];
        _startRemoteServer_decorators = [Post('start-remote')];
        _getHealth_decorators = [Get('health')];
        __esDecorate(_classThis, null, _getStatus_decorators, { kind: "method", name: "getStatus", static: false, private: false, access: { has: obj => "getStatus" in obj, get: obj => obj.getStatus }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _startRemoteServer_decorators, { kind: "method", name: "startRemoteServer", static: false, private: false, access: { has: obj => "startRemoteServer" in obj, get: obj => obj.startRemoteServer }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getHealth_decorators, { kind: "method", name: "getHealth", static: false, private: false, access: { has: obj => "getHealth" in obj, get: obj => obj.getHealth }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        TNFMCPController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return TNFMCPController = _classThis;
})();
export { TNFMCPController };
