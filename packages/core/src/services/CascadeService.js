"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var CascadeService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CascadeService = exports.CascadeState = exports.CascadeMode = void 0;
const common_1 = require("@nestjs/common");
const events_1 = require("events");
var CascadeMode;
(function (CascadeMode) {
    CascadeMode["SEQUENTIAL"] = "sequential";
    CascadeMode["PARALLEL"] = "parallel";
    CascadeMode["WATERFALL"] = "waterfall";
    CascadeMode["PIPELINE"] = "pipeline";
})(CascadeMode || (exports.CascadeMode = CascadeMode = {}));
var CascadeState;
(function (CascadeState) {
    CascadeState["IDLE"] = "idle";
    CascadeState["RUNNING"] = "running";
    CascadeState["PAUSED"] = "paused";
    CascadeState["COMPLETED"] = "completed";
    CascadeState["FAILED"] = "failed";
    CascadeState["CANCELLED"] = "cancelled";
})(CascadeState || (exports.CascadeState = CascadeState = {}));
let CascadeService = CascadeService_1 = class CascadeService extends events_1.EventEmitter {
    constructor() {
        super();
        this.logger = new common_1.Logger(CascadeService_1.name);
        this.controllers = new Map();
        this.steps = new Map();
        this.activeExecutions = new Map();
        this.logger.log('CascadeService initialized');
    }
    createController(name, mode, options) {
        const id = this.generateId();
        const controller = {
            id,
            name,
            mode,
            state: CascadeState.IDLE,
            options: {
                maxDepth: 10,
                timeout: 30000,
                retries: 3,
                failOnError: true,
                ...options,
            },
            metadata: {},
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        this.controllers.set(id, controller);
        this.steps.set(id, []);
        this.logger.debug(`Created cascade controller: ${name} (${id})`);
        this.emit('controllerCreated', controller);
        return controller;
    }
    addStep(controllerId, step) {
        const controller = this.controllers.get(controllerId);
        if (!controller) {
            throw new Error(`Controller not found: ${controllerId}`);
        }
        const stepId = this.generateId();
        const fullStep = {
            ...step,
            id: stepId,
        };
        const steps = this.steps.get(controllerId) || [];
        steps.push(fullStep);
        this.steps.set(controllerId, steps);
        controller.updatedAt = new Date();
        this.controllers.set(controllerId, controller);
        this.logger.debug(`Added step to controller ${controllerId}: ${step.name} (${stepId})`);
        this.emit('stepAdded', controllerId, fullStep);
        return fullStep;
    }
    async executeController(controllerId, input) {
        const controller = this.controllers.get(controllerId);
        if (!controller) {
            throw new Error(`Controller not found: ${controllerId}`);
        }
        if (this.activeExecutions.has(controllerId)) {
            throw new Error(`Controller already executing: ${controllerId}`);
        }
        const steps = this.steps.get(controllerId) || [];
        if (steps.length === 0) {
            throw new Error(`No steps defined for controller: ${controllerId}`);
        }
        this.updateControllerState(controllerId, CascadeState.RUNNING);
        const execution = this.executeSteps(controllerId, steps, input);
        this.activeExecutions.set(controllerId, execution);
        try {
            const result = await execution;
            this.updateControllerState(controllerId, CascadeState.COMPLETED);
            this.activeExecutions.delete(controllerId);
            this.logger.debug(`Controller execution completed: ${controllerId}`);
            this.emit('executionCompleted', controllerId, result);
            return result;
        }
        catch (error) {
            this.updateControllerState(controllerId, CascadeState.FAILED);
            this.activeExecutions.delete(controllerId);
            this.logger.error(`Controller execution failed: ${controllerId}`, error);
            this.emit('executionFailed', controllerId, error);
            throw error;
        }
    }
    async cancelExecution(controllerId) {
        const controller = this.controllers.get(controllerId);
        if (!controller) {
            throw new Error(`Controller not found: ${controllerId}`);
        }
        this.updateControllerState(controllerId, CascadeState.CANCELLED);
        this.activeExecutions.delete(controllerId);
        this.logger.debug(`Cancelled controller execution: ${controllerId}`);
        this.emit('executionCancelled', controllerId);
    }
    getController(controllerId) {
        return this.controllers.get(controllerId);
    }
    getSteps(controllerId) {
        return this.steps.get(controllerId) || [];
    }
    getAllControllers() {
        return Array.from(this.controllers.values());
    }
    deleteController(controllerId) {
        const controller = this.controllers.get(controllerId);
        if (!controller) {
            return false;
        }
        // Cancel execution if running
        if (this.activeExecutions.has(controllerId)) {
            this.cancelExecution(controllerId);
        }
        this.controllers.delete(controllerId);
        this.steps.delete(controllerId);
        this.logger.debug(`Deleted controller: ${controllerId}`);
        this.emit('controllerDeleted', controllerId);
        return true;
    }
    async executeSteps(controllerId, steps, input) {
        const controller = this.controllers.get(controllerId);
        switch (controller.mode) {
            case CascadeMode.SEQUENTIAL:
                return this.executeSequential(controllerId, steps, input);
            case CascadeMode.PARALLEL:
                return this.executeParallel(controllerId, steps, input);
            case CascadeMode.WATERFALL:
                return this.executeWaterfall(controllerId, steps, input);
            case CascadeMode.PIPELINE:
                return this.executePipeline(controllerId, steps, input);
            default:
                throw new Error(`Unsupported cascade mode: ${controller.mode}`);
        }
    }
    async executeSequential(controllerId, steps, input) {
        const results = [];
        const controller = this.controllers.get(controllerId);
        for (const step of steps) {
            const context = {
                controllerId,
                stepId: step.id,
                input,
                metadata: {},
                startTime: new Date(),
            };
            try {
                const result = await this.executeStep(step, input, context);
                results.push(result);
                this.emit('stepCompleted', controllerId, step.id, result);
            }
            catch (error) {
                context.error = error;
                context.endTime = new Date();
                this.emit('stepFailed', controllerId, step.id, error);
                if (controller.options.failOnError && !step.optional) {
                    throw error;
                }
            }
        }
        return results;
    }
    async executeParallel(controllerId, steps, input) {
        const controller = this.controllers.get(controllerId);
        const promises = steps.map(async (step) => {
            const context = {
                controllerId,
                stepId: step.id,
                input,
                metadata: {},
                startTime: new Date(),
            };
            try {
                const result = await this.executeStep(step, input, context);
                this.emit('stepCompleted', controllerId, step.id, result);
                return result;
            }
            catch (error) {
                context.error = error;
                context.endTime = new Date();
                this.emit('stepFailed', controllerId, step.id, error);
                if (controller.options.failOnError && !step.optional) {
                    throw error;
                }
                return null;
            }
        });
        return Promise.all(promises);
    }
    async executeWaterfall(controllerId, steps, input) {
        let currentInput = input;
        const controller = this.controllers.get(controllerId);
        for (const step of steps) {
            const context = {
                controllerId,
                stepId: step.id,
                input: currentInput,
                metadata: {},
                startTime: new Date(),
            };
            try {
                const result = await this.executeStep(step, currentInput, context);
                currentInput = result;
                this.emit('stepCompleted', controllerId, step.id, result);
            }
            catch (error) {
                context.error = error;
                context.endTime = new Date();
                this.emit('stepFailed', controllerId, step.id, error);
                if (controller.options.failOnError && !step.optional) {
                    throw error;
                }
            }
        }
        return currentInput;
    }
    async executePipeline(controllerId, steps, input) {
        const controller = this.controllers.get(controllerId);
        const executed = new Set();
        const results = new Map();
        const executeWithDependencies = async (step) => {
            if (executed.has(step.id)) {
                return results.get(step.id);
            }
            // Execute dependencies first
            if (step.dependencies && step.dependencies.length > 0) {
                for (const depId of step.dependencies) {
                    const depStep = steps.find(s => s.id === depId);
                    if (!depStep) {
                        throw new Error(`Dependency not found: ${depId}`);
                    }
                    await executeWithDependencies(depStep);
                }
            }
            const context = {
                controllerId,
                stepId: step.id,
                input,
                metadata: {},
                startTime: new Date(),
            };
            try {
                const result = await this.executeStep(step, input, context);
                executed.add(step.id);
                results.set(step.id, result);
                this.emit('stepCompleted', controllerId, step.id, result);
                return result;
            }
            catch (error) {
                context.error = error;
                context.endTime = new Date();
                this.emit('stepFailed', controllerId, step.id, error);
                if (controller.options.failOnError && !step.optional) {
                    throw error;
                }
                executed.add(step.id);
                results.set(step.id, null);
                return null;
            }
        };
        // Execute all steps with dependency resolution
        for (const step of steps) {
            await executeWithDependencies(step);
        }
        return Array.from(results.values());
    }
    async executeStep(step, input, context) {
        const timeout = step.timeout || 30000;
        const retries = step.retries || 3;
        for (let attempt = 0; attempt < retries; attempt++) {
            try {
                const promise = step.handler(input, context);
                const result = await Promise.race([
                    promise,
                    new Promise((_, reject) => setTimeout(() => reject(new Error(`Step ${step.id} timed out after ${timeout}ms`)), timeout))
                ]);
                return result;
            }
            catch (error) {
                if (attempt === retries - 1) {
                    throw error;
                }
                this.logger.debug(`Step ${step.id} attempt ${attempt + 1} failed, retrying...`);
                await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            }
        }
    }
    updateControllerState(controllerId, state) {
        const controller = this.controllers.get(controllerId);
        if (controller) {
            controller.state = state;
            controller.updatedAt = new Date();
            this.controllers.set(controllerId, controller);
            this.emit('stateChanged', controllerId, state);
        }
    }
    generateId() {
        return Math.random().toString(36).substring(2, 15);
    }
};
exports.CascadeService = CascadeService;
exports.CascadeService = CascadeService = CascadeService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], CascadeService);
//# sourceMappingURL=CascadeService.js.map