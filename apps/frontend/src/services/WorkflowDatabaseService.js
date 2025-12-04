var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
/**
 * Service for interacting with the workflow database
 */
var WorkflowDatabaseService = /** @class */ (function () {
    function WorkflowDatabaseService() {
        this.apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
    }
    /**
     * Fetches all workflows
     * @returns A list of workflows
     */
    WorkflowDatabaseService.prototype.getWorkflows = function () {
        return __awaiter(this, void 0, void 0, function () {
            var response, data, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, fetch("".concat(this.apiBaseUrl, "/workflows"))];
                    case 1:
                        response = _a.sent();
                        if (!response.ok) {
                            throw new Error("Failed to fetch workflows: ".concat(response.statusText));
                        }
                        return [4 /*yield*/, response.json()];
                    case 2:
                        data = _a.sent();
                        return [2 /*return*/, data.map(function (workflow) { return (__assign(__assign({}, workflow), { createdAt: workflow.createdAt ? new Date(workflow.createdAt) : undefined, updatedAt: workflow.updatedAt ? new Date(workflow.updatedAt) : undefined })); })];
                    case 3:
                        error_1 = _a.sent();
                        console.error('Error fetching workflows:', error_1);
                        throw error_1;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Fetches a workflow by ID
     * @param id The workflow ID
     * @returns The workflow
     */
    WorkflowDatabaseService.prototype.getWorkflow = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var response, data, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, fetch("".concat(this.apiBaseUrl, "/workflows/").concat(id))];
                    case 1:
                        response = _a.sent();
                        if (!response.ok) {
                            throw new Error("Failed to fetch workflow: ".concat(response.statusText));
                        }
                        return [4 /*yield*/, response.json()];
                    case 2:
                        data = _a.sent();
                        return [2 /*return*/, __assign(__assign({}, data), { createdAt: data.createdAt ? new Date(data.createdAt) : undefined, updatedAt: data.updatedAt ? new Date(data.updatedAt) : undefined })];
                    case 3:
                        error_2 = _a.sent();
                        console.error("Error fetching workflow ".concat(id, ":"), error_2);
                        throw error_2;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Creates a new workflow
     * @param workflow The workflow to create
     * @returns The created workflow
     */
    WorkflowDatabaseService.prototype.createWorkflow = function (workflow) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, id, workflowData, response, data, error_3;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 3, , 4]);
                        _a = workflow, id = _a.id, workflowData = __rest(_a, ["id"]);
                        return [4 /*yield*/, fetch("".concat(this.apiBaseUrl, "/workflows"), {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify(workflowData)
                            })];
                    case 1:
                        response = _b.sent();
                        if (!response.ok) {
                            throw new Error("Failed to create workflow: ".concat(response.statusText));
                        }
                        return [4 /*yield*/, response.json()];
                    case 2:
                        data = _b.sent();
                        return [2 /*return*/, __assign(__assign({}, data), { createdAt: data.createdAt ? new Date(data.createdAt) : undefined, updatedAt: data.updatedAt ? new Date(data.updatedAt) : undefined })];
                    case 3:
                        error_3 = _b.sent();
                        console.error('Error creating workflow:', error_3);
                        throw error_3;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Updates a workflow
     * @param id The workflow ID
     * @param workflow The workflow data to update
     * @returns The updated workflow
     */
    WorkflowDatabaseService.prototype.updateWorkflow = function (id, workflow) {
        return __awaiter(this, void 0, void 0, function () {
            var _1, workflowData, response, data, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        _1 = workflow.id, workflowData = __rest(workflow, ["id"]);
                        return [4 /*yield*/, fetch("".concat(this.apiBaseUrl, "/workflows/").concat(id), {
                                method: 'PATCH',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify(workflowData)
                            })];
                    case 1:
                        response = _a.sent();
                        if (!response.ok) {
                            throw new Error("Failed to update workflow: ".concat(response.statusText));
                        }
                        return [4 /*yield*/, response.json()];
                    case 2:
                        data = _a.sent();
                        return [2 /*return*/, __assign(__assign({}, data), { createdAt: data.createdAt ? new Date(data.createdAt) : undefined, updatedAt: data.updatedAt ? new Date(data.updatedAt) : undefined })];
                    case 3:
                        error_4 = _a.sent();
                        console.error("Error updating workflow ".concat(id, ":"), error_4);
                        throw error_4;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Deletes a workflow
     * @param id The workflow ID
     */
    WorkflowDatabaseService.prototype.deleteWorkflow = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var response, error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, fetch("".concat(this.apiBaseUrl, "/workflows/").concat(id), {
                                method: 'DELETE'
                            })];
                    case 1:
                        response = _a.sent();
                        if (!response.ok) {
                            throw new Error("Failed to delete workflow: ".concat(response.statusText));
                        }
                        return [3 /*break*/, 3];
                    case 2:
                        error_5 = _a.sent();
                        console.error("Error deleting workflow ".concat(id, ":"), error_5);
                        throw error_5;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Fetches workflow executions
     * @param workflowId The workflow ID
     * @returns A list of workflow executions
     */
    WorkflowDatabaseService.prototype.getWorkflowExecutions = function (workflowId) {
        return __awaiter(this, void 0, void 0, function () {
            var response, error_6;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, fetch("".concat(this.apiBaseUrl, "/workflows/").concat(workflowId, "/executions"))];
                    case 1:
                        response = _a.sent();
                        if (!response.ok) {
                            throw new Error("Failed to fetch workflow executions: ".concat(response.statusText));
                        }
                        return [4 /*yield*/, response.json()];
                    case 2: return [2 /*return*/, _a.sent()];
                    case 3:
                        error_6 = _a.sent();
                        console.error("Error fetching executions for workflow ".concat(workflowId, ":"), error_6);
                        throw error_6;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Fetches a workflow execution
     * @param workflowId The workflow ID
     * @param executionId The execution ID
     * @returns The workflow execution
     */
    WorkflowDatabaseService.prototype.getWorkflowExecution = function (workflowId, executionId) {
        return __awaiter(this, void 0, void 0, function () {
            var response, error_7;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, fetch("".concat(this.apiBaseUrl, "/workflows/").concat(workflowId, "/executions/").concat(executionId))];
                    case 1:
                        response = _a.sent();
                        if (!response.ok) {
                            throw new Error("Failed to fetch workflow execution: ".concat(response.statusText));
                        }
                        return [4 /*yield*/, response.json()];
                    case 2: return [2 /*return*/, _a.sent()];
                    case 3:
                        error_7 = _a.sent();
                        console.error("Error fetching execution ".concat(executionId, " for workflow ").concat(workflowId, ":"), error_7);
                        throw error_7;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Creates a workflow execution
     * @param workflowId The workflow ID
     * @param input The input data for the execution
     * @returns The created workflow execution
     */
    WorkflowDatabaseService.prototype.createWorkflowExecution = function (workflowId_1) {
        return __awaiter(this, arguments, void 0, function (workflowId, input) {
            var response, error_8;
            if (input === void 0) { input = {}; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, fetch("".concat(this.apiBaseUrl, "/workflows/").concat(workflowId, "/executions"), {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({ input: input })
                            })];
                    case 1:
                        response = _a.sent();
                        if (!response.ok) {
                            throw new Error("Failed to create workflow execution: ".concat(response.statusText));
                        }
                        return [4 /*yield*/, response.json()];
                    case 2: return [2 /*return*/, _a.sent()];
                    case 3:
                        error_8 = _a.sent();
                        console.error("Error creating execution for workflow ".concat(workflowId, ":"), error_8);
                        throw error_8;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Aborts a workflow execution
     * @param workflowId The workflow ID
     * @param executionId The execution ID
     */
    WorkflowDatabaseService.prototype.abortWorkflowExecution = function (workflowId, executionId) {
        return __awaiter(this, void 0, void 0, function () {
            var response, error_9;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, fetch("".concat(this.apiBaseUrl, "/workflows/").concat(workflowId, "/executions/").concat(executionId, "/abort"), {
                                method: 'POST'
                            })];
                    case 1:
                        response = _a.sent();
                        if (!response.ok) {
                            throw new Error("Failed to abort workflow execution: ".concat(response.statusText));
                        }
                        return [3 /*break*/, 3];
                    case 2:
                        error_9 = _a.sent();
                        console.error("Error aborting execution ".concat(executionId, " for workflow ").concat(workflowId, ":"), error_9);
                        throw error_9;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    return WorkflowDatabaseService;
}());
export { WorkflowDatabaseService };
// Create singleton instance
export var workflowDatabaseService = new WorkflowDatabaseService();
