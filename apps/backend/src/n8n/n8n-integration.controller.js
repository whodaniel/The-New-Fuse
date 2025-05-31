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
import { Controller, Post, Get, HttpException, HttpStatus } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { Logger } from '@the-new-fuse/utils';
import { WorkflowValidator } from './workflow.validator.js';
let N8nIntegrationController = (() => {
    let _classDecorators = [Controller('n8n')];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _createWorkflow_decorators;
    let _getNodeTypes_decorators;
    let _getNodeTypeDescription_decorators;
    let _getCredentials_decorators;
    let _testWorkflow_decorators;
    var N8nIntegrationController = _classThis = class {
        constructor(httpService, configService, metadataService) {
            this.httpService = (__runInitializers(this, _instanceExtraInitializers), httpService);
            this.configService = configService;
            this.metadataService = metadataService;
            this.logger = new Logger({ prefix: 'N8nIntegrationController' });
            this.validator = new WorkflowValidator();
        }
        async createWorkflow(workflowData) {
            try {
                // Validate workflow structure
                const nodeTypes = await this.metadataService.getAllNodeTypes();
                const validationErrors = this.validator.validate(workflowData.nodes, workflowData.edges, nodeTypes);
                if (validationErrors.length > 0) {
                    throw new HttpException({
                        status: HttpStatus.BAD_REQUEST,
                        error: 'Invalid workflow',
                        details: validationErrors,
                    }, HttpStatus.BAD_REQUEST);
                }
                const n8nUrl = this.configService.get('N8N_URL');
                const n8nApiKey = this.configService.get('N8N_API_KEY');
                if (!n8nUrl || !n8nApiKey) {
                    throw new Error('N8N configuration missing');
                }
                const response = await firstValueFrom(this.httpService.post(`${n8nUrl}/api/v1/workflows`, {
                    name: workflowData.name || 'New Workflow',
                    active: false,
                    nodes: workflowData.nodes,
                    connections: workflowData.connections,
                    settings: {
                        saveDataErrorExecution: 'all',
                        saveDataSuccessExecution: 'all',
                        saveManualExecutions: true,
                        timezone: 'UTC',
                    },
                }, {
                    headers: {
                        'X-N8N-API-KEY': n8nApiKey,
                    },
                }));
                return response.data;
            }
            catch (error) {
                this.logger.error('Failed to create workflow', error);
                throw error;
            }
        }
        async getNodeTypes() {
            try {
                return await this.metadataService.getAllNodeTypes();
            }
            catch (error) {
                this.logger.error('Failed to fetch node types', error);
                throw error;
            }
        }
        async getNodeTypeDescription(type) {
            try {
                return await this.metadataService.getNodeTypeDescription(type);
            }
            catch (error) {
                this.logger.error(`Failed to fetch node type description for ${type}`, error);
                throw error;
            }
        }
        async getCredentials(type) {
            try {
                const n8nUrl = this.configService.get('N8N_URL');
                const n8nApiKey = this.configService.get('N8N_API_KEY');
                if (!n8nUrl || !n8nApiKey) {
                    throw new Error('N8N configuration missing');
                }
                const response = await firstValueFrom(this.httpService.get(`${n8nUrl}/api/v1/credentials?type=${type}`, {
                    headers: {
                        'X-N8N-API-KEY': n8nApiKey,
                    },
                }));
                return response.data;
            }
            catch (error) {
                this.logger.error(`Failed to fetch credentials for type ${type}`, error);
                throw error;
            }
        }
        async testWorkflow(workflowData) {
            try {
                const n8nUrl = this.configService.get('N8N_URL');
                const n8nApiKey = this.configService.get('N8N_API_KEY');
                if (!n8nUrl || !n8nApiKey) {
                    throw new Error('N8N configuration missing');
                }
                const response = await firstValueFrom(this.httpService.post(`${n8nUrl}/api/v1/workflows/test`, {
                    workflowData: {
                        nodes: workflowData.nodes,
                        connections: workflowData.connections,
                    },
                }, {
                    headers: {
                        'X-N8N-API-KEY': n8nApiKey,
                    },
                }));
                return response.data;
            }
            catch (error) {
                this.logger.error('Failed to test workflow', error);
                throw error;
            }
        }
    };
    __setFunctionName(_classThis, "N8nIntegrationController");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _createWorkflow_decorators = [Post('workflow')];
        _getNodeTypes_decorators = [Get('node-types')];
        _getNodeTypeDescription_decorators = [Get('node-types/:type')];
        _getCredentials_decorators = [Get('credentials/:type')];
        _testWorkflow_decorators = [Post('test-workflow')];
        __esDecorate(_classThis, null, _createWorkflow_decorators, { kind: "method", name: "createWorkflow", static: false, private: false, access: { has: obj => "createWorkflow" in obj, get: obj => obj.createWorkflow }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getNodeTypes_decorators, { kind: "method", name: "getNodeTypes", static: false, private: false, access: { has: obj => "getNodeTypes" in obj, get: obj => obj.getNodeTypes }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getNodeTypeDescription_decorators, { kind: "method", name: "getNodeTypeDescription", static: false, private: false, access: { has: obj => "getNodeTypeDescription" in obj, get: obj => obj.getNodeTypeDescription }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getCredentials_decorators, { kind: "method", name: "getCredentials", static: false, private: false, access: { has: obj => "getCredentials" in obj, get: obj => obj.getCredentials }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _testWorkflow_decorators, { kind: "method", name: "testWorkflow", static: false, private: false, access: { has: obj => "testWorkflow" in obj, get: obj => obj.testWorkflow }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        N8nIntegrationController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return N8nIntegrationController = _classThis;
})();
export { N8nIntegrationController };
