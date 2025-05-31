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
import { Controller, Get, Post, Put, Delete } from '@nestjs/common';
import { Logger } from '@the-new-fuse/utils';
let WorkflowController = (() => {
    let _classDecorators = [Controller('workflows')];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _getWorkflows_decorators;
    let _getWorkflowById_decorators;
    let _createWorkflow_decorators;
    let _updateWorkflow_decorators;
    let _deleteWorkflow_decorators;
    let _executeWorkflow_decorators;
    let _getWorkflowExecutions_decorators;
    var WorkflowController = _classThis = class {
        constructor() {
            this.logger = (__runInitializers(this, _instanceExtraInitializers), new Logger('WorkflowController'));
            this.logger.log('WorkflowController initialized');
        }
        async getWorkflows(req) {
            this.logger.log(`Getting workflows for user ${req.user?.id}`);
            // Implementation would go here
            return [];
        }
        async getWorkflowById(id, req) {
            this.logger.log(`Getting workflow ${id} for user ${req.user?.id}`);
            // Implementation would go here
            return { id };
        }
        async createWorkflow(workflowData, req) {
            this.logger.log(`Creating workflow for user ${req.user?.id}`);
            // Implementation would go here
            return { id: 'new-workflow-id', ...workflowData };
        }
        async updateWorkflow(id, workflowData, req) {
            this.logger.log(`Updating workflow ${id} for user ${req.user?.id}`);
            // Implementation would go here
            return { id, ...workflowData };
        }
        async deleteWorkflow(id, req) {
            this.logger.log(`Deleting workflow ${id} for user ${req.user?.id}`);
            // Implementation would go here
            return { success: true };
        }
        async executeWorkflow(id, executionData, req) {
            this.logger.log(`Executing workflow ${id} for user ${req.user?.id}`);
            // Implementation would go here
            return {
                executionId: 'execution-id',
                workflowId: id,
                status: 'RUNNING'
            };
        }
        async getWorkflowExecutions(id, req) {
            this.logger.log(`Getting executions for workflow ${id} user ${req.user?.id}`);
            // Implementation would go here
            return [];
        }
    };
    __setFunctionName(_classThis, "WorkflowController");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _getWorkflows_decorators = [Get()];
        _getWorkflowById_decorators = [Get(':id')];
        _createWorkflow_decorators = [Post()];
        _updateWorkflow_decorators = [Put(':id')];
        _deleteWorkflow_decorators = [Delete(':id')];
        _executeWorkflow_decorators = [Post(':id/execute')];
        _getWorkflowExecutions_decorators = [Get(':id/executions')];
        __esDecorate(_classThis, null, _getWorkflows_decorators, { kind: "method", name: "getWorkflows", static: false, private: false, access: { has: obj => "getWorkflows" in obj, get: obj => obj.getWorkflows }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getWorkflowById_decorators, { kind: "method", name: "getWorkflowById", static: false, private: false, access: { has: obj => "getWorkflowById" in obj, get: obj => obj.getWorkflowById }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _createWorkflow_decorators, { kind: "method", name: "createWorkflow", static: false, private: false, access: { has: obj => "createWorkflow" in obj, get: obj => obj.createWorkflow }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _updateWorkflow_decorators, { kind: "method", name: "updateWorkflow", static: false, private: false, access: { has: obj => "updateWorkflow" in obj, get: obj => obj.updateWorkflow }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _deleteWorkflow_decorators, { kind: "method", name: "deleteWorkflow", static: false, private: false, access: { has: obj => "deleteWorkflow" in obj, get: obj => obj.deleteWorkflow }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _executeWorkflow_decorators, { kind: "method", name: "executeWorkflow", static: false, private: false, access: { has: obj => "executeWorkflow" in obj, get: obj => obj.executeWorkflow }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getWorkflowExecutions_decorators, { kind: "method", name: "getWorkflowExecutions", static: false, private: false, access: { has: obj => "getWorkflowExecutions" in obj, get: obj => obj.getWorkflowExecutions }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        WorkflowController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return WorkflowController = _classThis;
})();
export { WorkflowController };
