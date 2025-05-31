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
import { Controller, Get, Post, Put, Delete, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { Workflow } from '@the-new-fuse/types';
let WorkflowController = (() => {
    let _classDecorators = [ApiTags('Workflows'), Controller('workflows'), UseGuards(JwtAuthGuard)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _createWorkflow_decorators;
    let _executeWorkflow_decorators;
    let _getWorkflowStatus_decorators;
    let _getWorkflowResults_decorators;
    let _updateWorkflow_decorators;
    let _deleteWorkflow_decorators;
    var WorkflowController = _classThis = class {
        constructor(workflowService) {
            this.workflowService = (__runInitializers(this, _instanceExtraInitializers), workflowService);
        }
        async createWorkflow(data, user) {
            try {
                return await this.workflowService.createWorkflow(data, user.id);
            }
            catch (error) {
                throw new HttpException(error.message || 'Failed to create workflow', HttpStatus.BAD_REQUEST);
            }
        }
        async executeWorkflow(id, user) {
            try {
                await this.workflowService.executeWorkflow(id, user.id);
            }
            catch (error) {
                throw new HttpException(error.message || 'Failed to execute workflow', HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        async getWorkflowStatus(id, user) {
            try {
                return await this.workflowService.getWorkflowStatus(id, user.id);
            }
            catch (error) {
                throw new HttpException(error.message || 'Failed to get workflow status', HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        async getWorkflowResults(id, user) {
            try {
                return await this.workflowService.getWorkflowResults(id, user.id);
            }
            catch (error) {
                throw new HttpException(error.message || 'Failed to get workflow results', HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        async updateWorkflow(id, updates, user) {
            try {
                return await this.workflowService.updateWorkflow(id, updates, user.id);
            }
            catch (error) {
                throw new HttpException(error.message || 'Failed to update workflow', HttpStatus.BAD_REQUEST);
            }
        }
        async deleteWorkflow(id, user) {
            try {
                await this.workflowService.deleteWorkflow(id, user.id);
            }
            catch (error) {
                throw new HttpException(error.message || 'Failed to delete workflow', HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
    };
    __setFunctionName(_classThis, "WorkflowController");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _createWorkflow_decorators = [Post(), ApiOperation({ summary: 'Create a new workflow' }), ApiResponse({ status: HttpStatus.CREATED, type: Workflow })];
        _executeWorkflow_decorators = [Post(':id/execute'), ApiOperation({ summary: 'Execute a workflow' }), ApiResponse({ status: HttpStatus.OK })];
        _getWorkflowStatus_decorators = [Get(':id/status'), ApiOperation({ summary: 'Get workflow execution status' }), ApiResponse({ status: HttpStatus.OK, type: String })];
        _getWorkflowResults_decorators = [Get(':id/results'), ApiOperation({ summary: 'Get workflow execution results' }), ApiResponse({ status: HttpStatus.OK })];
        _updateWorkflow_decorators = [Put(':id'), ApiOperation({ summary: 'Update workflow' }), ApiResponse({ status: HttpStatus.OK, type: Workflow })];
        _deleteWorkflow_decorators = [Delete(':id'), ApiOperation({ summary: 'Delete workflow' }), ApiResponse({ status: HttpStatus.NO_CONTENT })];
        __esDecorate(_classThis, null, _createWorkflow_decorators, { kind: "method", name: "createWorkflow", static: false, private: false, access: { has: obj => "createWorkflow" in obj, get: obj => obj.createWorkflow }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _executeWorkflow_decorators, { kind: "method", name: "executeWorkflow", static: false, private: false, access: { has: obj => "executeWorkflow" in obj, get: obj => obj.executeWorkflow }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getWorkflowStatus_decorators, { kind: "method", name: "getWorkflowStatus", static: false, private: false, access: { has: obj => "getWorkflowStatus" in obj, get: obj => obj.getWorkflowStatus }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getWorkflowResults_decorators, { kind: "method", name: "getWorkflowResults", static: false, private: false, access: { has: obj => "getWorkflowResults" in obj, get: obj => obj.getWorkflowResults }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _updateWorkflow_decorators, { kind: "method", name: "updateWorkflow", static: false, private: false, access: { has: obj => "updateWorkflow" in obj, get: obj => obj.updateWorkflow }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _deleteWorkflow_decorators, { kind: "method", name: "deleteWorkflow", static: false, private: false, access: { has: obj => "deleteWorkflow" in obj, get: obj => obj.deleteWorkflow }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        WorkflowController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return WorkflowController = _classThis;
})();
export { WorkflowController };
