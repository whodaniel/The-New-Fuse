var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var logger = new Logger('WorkflowManager');
var WorkflowManager = /** @class */ (function () {
    function WorkflowManager(commBus) {
        this.workflows = new Map();
        this.templates = new Map();
        this.commBus = commBus;
    }
    WorkflowManager.prototype.createWorkflow = function (templateName, parameters) {
        return __awaiter(this, void 0, void 0, function () {
            var template, workflowId, status, error_1, errorMessage;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        template = this.templates.get(templateName);
                        if (!template) {
                            throw new Error("Template not found: ".concat(templateName));
                        }
                        workflowId = this.generateWorkflowId();
                        status = {
                            id: workflowId,
                            templateName: templateName,
                            status: 'pending',
                            progress: 0,
                            startTime: new Date().toISOString(),
                            metadata: {
                                parameters: parameters,
                                template: template.name
                            }
                        };
                        this.workflows.set(workflowId, status);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.startWorkflow(workflowId, template, parameters)];
                    case 2:
                        _a.sent();
                        return [2 /*return*/, workflowId];
                    case 3:
                        error_1 = _a.sent();
                        errorMessage = error_1 instanceof Error ? error_1.message : String(error_1);
                        logger.error("Failed to start workflow ".concat(workflowId, ": ").concat(errorMessage));
                        status.status = 'failed';
                        status.error = errorMessage;
                        status.endTime = new Date().toISOString();
                        throw error_1;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    WorkflowManager.prototype.cancelWorkflow = function (workflowId) {
        return __awaiter(this, void 0, void 0, function () {
            var workflow, event;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        workflow = this.workflows.get(workflowId);
                        if (!workflow) {
                            throw new Error("Workflow not found: ".concat(workflowId));
                        }
                        if (workflow.status === 'completed' || workflow.status === 'failed') {
                            return [2 /*return*/, false];
                        }
                        workflow.status = 'cancelled';
                        workflow.endTime = new Date().toISOString();
                        event = {
                            workflowId: workflowId,
                            timestamp: workflow.endTime
                        };
                        return [4 /*yield*/, this.commBus.publish('workflow.cancelled', event)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, true];
                }
            });
        });
    };
    WorkflowManager.prototype.getWorkflowStatus = function (workflowId) {
        var workflow = this.workflows.get(workflowId);
        if (!workflow) {
            throw new Error("Workflow not found: ".concat(workflowId));
        }
        return Object.assign({}, workflow);
    };
    WorkflowManager.prototype.registerTemplate = function (template) {
        this.templates.set(template.name, template);
    };
    WorkflowManager.prototype.generateWorkflowId = function () {
        return "wf_".concat(Math.random().toString(36).slice(2), "_").concat(Date.now());
    };
    WorkflowManager.prototype.startWorkflow = function (workflowId, template, parameters) {
        return __awaiter(this, void 0, void 0, function () {
            var workflow, _i, _a, step, completedEvent, error_2, errorMessage, failedEvent;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        workflow = this.workflows.get(workflowId);
                        if (!workflow) {
                            throw new Error("Workflow not found: ".concat(workflowId));
                        }
                        workflow.status = 'running';
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 7, , 9]);
                        _i = 0, _a = template.steps;
                        _b.label = 2;
                    case 2:
                        if (!(_i < _a.length)) return [3 /*break*/, 5];
                        step = _a[_i];
                        workflow.currentStep = step.name;
                        return [4 /*yield*/, this.executeStep(step, parameters)];
                    case 3:
                        _b.sent();
                        workflow.progress = (template.steps.indexOf(step) + 1) / template.steps.length * 100;
                        _b.label = 4;
                    case 4:
                        _i++;
                        return [3 /*break*/, 2];
                    case 5:
                        workflow.status = 'completed';
                        workflow.endTime = new Date().toISOString();
                        completedEvent = {
                            workflowId: workflowId,
                            timestamp: workflow.endTime
                        };
                        return [4 /*yield*/, this.commBus.publish('workflow.completed', completedEvent)];
                    case 6:
                        _b.sent();
                        return [3 /*break*/, 9];
                    case 7:
                        error_2 = _b.sent();
                        errorMessage = error_2 instanceof Error ? error_2.message : String(error_2);
                        workflow.status = 'failed';
                        workflow.error = errorMessage;
                        workflow.endTime = new Date().toISOString();
                        failedEvent = {
                            workflowId: workflowId,
                            error: errorMessage,
                            timestamp: workflow.endTime
                        };
                        return [4 /*yield*/, this.commBus.publish('workflow.failed', failedEvent)];
                    case 8:
                        _b.sent();
                        throw error_2;
                    case 9: return [2 /*return*/];
                }
            });
        });
    };
    WorkflowManager.prototype.executeStep = function (step, parameters) {
        return __awaiter(this, void 0, void 0, function () {
            var execute;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        execute = function (attempt) { return __awaiter(_this, void 0, void 0, function () {
                            var startEvent, completeEvent, error_3, errorMessage, failEvent, delay_1;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        _a.trys.push([0, 4, , 8]);
                                        startEvent = {
                                            step: step.name,
                                            attempt: attempt,
                                            parameters: parameters
                                        };
                                        return [4 /*yield*/, this.commBus.publish('workflow.step.started', startEvent)];
                                    case 1:
                                        _a.sent();
                                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 1000); })];
                                    case 2:
                                        _a.sent();
                                        completeEvent = {
                                            step: step.name,
                                            attempt: attempt
                                        };
                                        return [4 /*yield*/, this.commBus.publish('workflow.step.completed', completeEvent)];
                                    case 3:
                                        _a.sent();
                                        return [3 /*break*/, 8];
                                    case 4:
                                        error_3 = _a.sent();
                                        errorMessage = error_3 instanceof Error ? error_3.message : String(error_3);
                                        failEvent = {
                                            step: step.name,
                                            attempt: attempt,
                                            error: errorMessage
                                        };
                                        return [4 /*yield*/, this.commBus.publish('workflow.step.failed', failEvent)];
                                    case 5:
                                        _a.sent();
                                        if (!(step.retryPolicy && attempt < step.retryPolicy.maxAttempts)) return [3 /*break*/, 7];
                                        delay_1 = step.retryPolicy.initialDelay *
                                            Math.pow(step.retryPolicy.backoffMultiplier, attempt - 1);
                                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, delay_1); })];
                                    case 6:
                                        _a.sent();
                                        return [2 /*return*/, execute(attempt + 1)];
                                    case 7: throw error_3;
                                    case 8: return [2 /*return*/];
                                }
                            });
                        }); };
                        return [4 /*yield*/, execute(1)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    return WorkflowManager;
}());
export { WorkflowManager };
