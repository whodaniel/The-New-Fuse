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
import { Controller, Get, Post, Put, Delete, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
let AgentController = (() => {
    let _classDecorators = [Controller('agents'), UseGuards(JwtAuthGuard)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _createAgent_decorators;
    let _getAgents_decorators;
    let _getActiveAgents_decorators;
    let _getAgentById_decorators;
    let _updateAgent_decorators;
    let _updateAgentStatus_decorators;
    let _deleteAgent_decorators;
    var AgentController = _classThis = class {
        constructor(agentService) {
            this.agentService = (__runInitializers(this, _instanceExtraInitializers), agentService);
        }
        async createAgent(data, user) {
            return this.agentService.createAgent(data, user.id);
        }
        async getAgents(user, capability) {
            if (capability) {
                return this.agentService.getAgentsByCapability(capability, user.id);
            }
            return this.agentService.getAgents(user.id);
        }
        async getActiveAgents(user) {
            return this.agentService.getActiveAgents(user.id);
        }
        async getAgentById(id, user) {
            return this.agentService.getAgentById(id, user.id);
        }
        async updateAgent(id, updates, user) {
            return this.agentService.updateAgent(id, updates, user.id);
        }
        async updateAgentStatus(id, status, user) {
            return this.agentService.updateAgentStatus(id, status, user.id);
        }
        async deleteAgent(id, user) {
            return this.agentService.deleteAgent(id, user.id);
        }
    };
    __setFunctionName(_classThis, "AgentController");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _createAgent_decorators = [Post()];
        _getAgents_decorators = [Get()];
        _getActiveAgents_decorators = [Get('active')];
        _getAgentById_decorators = [Get(':id')];
        _updateAgent_decorators = [Put(':id')];
        _updateAgentStatus_decorators = [Put(':id/status')];
        _deleteAgent_decorators = [Delete(':id')];
        __esDecorate(_classThis, null, _createAgent_decorators, { kind: "method", name: "createAgent", static: false, private: false, access: { has: obj => "createAgent" in obj, get: obj => obj.createAgent }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getAgents_decorators, { kind: "method", name: "getAgents", static: false, private: false, access: { has: obj => "getAgents" in obj, get: obj => obj.getAgents }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getActiveAgents_decorators, { kind: "method", name: "getActiveAgents", static: false, private: false, access: { has: obj => "getActiveAgents" in obj, get: obj => obj.getActiveAgents }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getAgentById_decorators, { kind: "method", name: "getAgentById", static: false, private: false, access: { has: obj => "getAgentById" in obj, get: obj => obj.getAgentById }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _updateAgent_decorators, { kind: "method", name: "updateAgent", static: false, private: false, access: { has: obj => "updateAgent" in obj, get: obj => obj.updateAgent }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _updateAgentStatus_decorators, { kind: "method", name: "updateAgentStatus", static: false, private: false, access: { has: obj => "updateAgentStatus" in obj, get: obj => obj.updateAgentStatus }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _deleteAgent_decorators, { kind: "method", name: "deleteAgent", static: false, private: false, access: { has: obj => "deleteAgent" in obj, get: obj => obj.deleteAgent }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        AgentController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return AgentController = _classThis;
})();
export { AgentController };
