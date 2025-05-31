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
import { Controller, Get, Post, Put, UseGuards, HttpStatus, HttpException, Sse, } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { map } from 'rxjs';
import { AuthGuard } from '../../../guards/auth.guard';
import { RolesGuard } from '../../../guards/roles.guard';
import { Roles } from '../../../decorators/roles.decorator';
import { EnhancedUserRole } from '@prisma/client';
let SwarmController = (() => {
    let _classDecorators = [ApiTags('swarm'), Controller('api/swarm'), UseGuards(AuthGuard), ApiBearerAuth()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _createExecution_decorators;
    let _getExecutions_decorators;
    let _getExecution_decorators;
    let _updateExecutionStatus_decorators;
    let _updateExecutionStep_decorators;
    let _sendMessage_decorators;
    let _getMessages_decorators;
    let _streamExecutionProgress_decorators;
    let _performHealthCheck_decorators;
    let _getMetrics_decorators;
    var SwarmController = _classThis = class {
        constructor(swarmOrchestrationService) {
            this.swarmOrchestrationService = (__runInitializers(this, _instanceExtraInitializers), swarmOrchestrationService);
        }
        async createExecution(agencyId, executionDto) {
            try {
                return await this.swarmOrchestrationService.createExecution(agencyId, executionDto.serviceRequestId, executionDto.executionPlan, executionDto.configuration);
            }
            catch (error) {
                throw new HttpException(error.message || 'Failed to create execution', HttpStatus.BAD_REQUEST);
            }
        }
        async getExecutions(agencyId, status, limit = 50, offset = 0) {
            try {
                return await this.swarmOrchestrationService.getExecutions(agencyId, {
                    status,
                    limit,
                    offset
                });
            }
            catch (error) {
                throw new HttpException(error.message || 'Failed to get executions', HttpStatus.NOT_FOUND);
            }
        }
        async getExecution(executionId) {
            try {
                return await this.swarmOrchestrationService.getExecutionDetails(executionId);
            }
            catch (error) {
                throw new HttpException(error.message || 'Execution not found', HttpStatus.NOT_FOUND);
            }
        }
        async updateExecutionStatus(executionId, statusDto) {
            try {
                return await this.swarmOrchestrationService.updateExecutionStatus(executionId, statusDto.status, statusDto.reason);
            }
            catch (error) {
                throw new HttpException(error.message || 'Failed to update status', HttpStatus.BAD_REQUEST);
            }
        }
        async updateExecutionStep(executionId, stepId, stepUpdateDto) {
            try {
                return await this.swarmOrchestrationService.updateExecutionStep(executionId, stepId, stepUpdateDto);
            }
            catch (error) {
                throw new HttpException(error.message || 'Failed to update step', HttpStatus.BAD_REQUEST);
            }
        }
        async sendMessage(executionId, messageDto) {
            try {
                return await this.swarmOrchestrationService.sendMessage(executionId, messageDto.fromAgentId, messageDto.toAgentId, messageDto.type, messageDto.content, messageDto.priority);
            }
            catch (error) {
                throw new HttpException(error.message || 'Failed to send message', HttpStatus.BAD_REQUEST);
            }
        }
        async getMessages(executionId, agentId, limit = 100) {
            try {
                return await this.swarmOrchestrationService.getMessages(executionId, {
                    agentId,
                    limit
                });
            }
            catch (error) {
                throw new HttpException(error.message || 'Failed to get messages', HttpStatus.NOT_FOUND);
            }
        }
        streamExecutionProgress(executionId) {
            return this.swarmOrchestrationService.streamExecutionProgress(executionId)
                .pipe(map(data => ({
                data: JSON.stringify(data),
                type: 'execution-progress'
            })));
        }
        async performHealthCheck(agencyId) {
            try {
                return await this.swarmOrchestrationService.performHealthCheck(agencyId);
            }
            catch (error) {
                throw new HttpException(error.message || 'Health check failed', HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        async getMetrics(agencyId, timeframe = '24h') {
            try {
                return await this.swarmOrchestrationService.getPerformanceMetrics(agencyId, timeframe);
            }
            catch (error) {
                throw new HttpException(error.message || 'Failed to get metrics', HttpStatus.NOT_FOUND);
            }
        }
    };
    __setFunctionName(_classThis, "SwarmController");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _createExecution_decorators = [Post(':agencyId/executions'), UseGuards(RolesGuard), Roles(EnhancedUserRole.AGENCY_ADMIN, EnhancedUserRole.AGENCY_MANAGER, EnhancedUserRole.AGENT_OPERATOR), ApiOperation({ summary: 'Create new swarm execution' }), ApiResponse({ status: 201, description: 'Swarm execution created' })];
        _getExecutions_decorators = [Get(':agencyId/executions'), ApiOperation({ summary: 'Get agency swarm executions' }), ApiResponse({ status: 200, description: 'Executions retrieved' })];
        _getExecution_decorators = [Get('executions/:executionId'), ApiOperation({ summary: 'Get specific execution details' }), ApiResponse({ status: 200, description: 'Execution details retrieved' })];
        _updateExecutionStatus_decorators = [Put('executions/:executionId/status'), UseGuards(RolesGuard), Roles(EnhancedUserRole.AGENCY_ADMIN, EnhancedUserRole.AGENT_OPERATOR), ApiOperation({ summary: 'Update execution status' }), ApiResponse({ status: 200, description: 'Status updated successfully' })];
        _updateExecutionStep_decorators = [Post('executions/:executionId/steps/:stepId/update'), UseGuards(RolesGuard), Roles(EnhancedUserRole.AGENT_OPERATOR), ApiOperation({ summary: 'Update execution step progress' }), ApiResponse({ status: 200, description: 'Step updated successfully' })];
        _sendMessage_decorators = [Post('executions/:executionId/messages'), UseGuards(RolesGuard), Roles(EnhancedUserRole.AGENT_OPERATOR), ApiOperation({ summary: 'Send message in swarm execution' }), ApiResponse({ status: 201, description: 'Message sent successfully' })];
        _getMessages_decorators = [Get('executions/:executionId/messages'), ApiOperation({ summary: 'Get execution messages' }), ApiResponse({ status: 200, description: 'Messages retrieved' })];
        _streamExecutionProgress_decorators = [Sse('executions/:executionId/progress'), ApiOperation({ summary: 'Stream execution progress' }), ApiResponse({ status: 200, description: 'Progress stream established' })];
        _performHealthCheck_decorators = [Post(':agencyId/health-check'), UseGuards(RolesGuard), Roles(EnhancedUserRole.AGENCY_ADMIN), ApiOperation({ summary: 'Perform swarm health check' }), ApiResponse({ status: 200, description: 'Health check completed' })];
        _getMetrics_decorators = [Get(':agencyId/metrics'), ApiOperation({ summary: 'Get swarm performance metrics' }), ApiResponse({ status: 200, description: 'Metrics retrieved' })];
        __esDecorate(_classThis, null, _createExecution_decorators, { kind: "method", name: "createExecution", static: false, private: false, access: { has: obj => "createExecution" in obj, get: obj => obj.createExecution }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getExecutions_decorators, { kind: "method", name: "getExecutions", static: false, private: false, access: { has: obj => "getExecutions" in obj, get: obj => obj.getExecutions }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getExecution_decorators, { kind: "method", name: "getExecution", static: false, private: false, access: { has: obj => "getExecution" in obj, get: obj => obj.getExecution }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _updateExecutionStatus_decorators, { kind: "method", name: "updateExecutionStatus", static: false, private: false, access: { has: obj => "updateExecutionStatus" in obj, get: obj => obj.updateExecutionStatus }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _updateExecutionStep_decorators, { kind: "method", name: "updateExecutionStep", static: false, private: false, access: { has: obj => "updateExecutionStep" in obj, get: obj => obj.updateExecutionStep }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _sendMessage_decorators, { kind: "method", name: "sendMessage", static: false, private: false, access: { has: obj => "sendMessage" in obj, get: obj => obj.sendMessage }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getMessages_decorators, { kind: "method", name: "getMessages", static: false, private: false, access: { has: obj => "getMessages" in obj, get: obj => obj.getMessages }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _streamExecutionProgress_decorators, { kind: "method", name: "streamExecutionProgress", static: false, private: false, access: { has: obj => "streamExecutionProgress" in obj, get: obj => obj.streamExecutionProgress }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _performHealthCheck_decorators, { kind: "method", name: "performHealthCheck", static: false, private: false, access: { has: obj => "performHealthCheck" in obj, get: obj => obj.performHealthCheck }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getMetrics_decorators, { kind: "method", name: "getMetrics", static: false, private: false, access: { has: obj => "getMetrics" in obj, get: obj => obj.getMetrics }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        SwarmController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return SwarmController = _classThis;
})();
export { SwarmController };
