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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { useState, useCallback } from 'react';
import { workflowService } from '@/services/WorkflowService';
export var useWorkflow = function () {
    var _a = useState([]), workflows = _a[0], setWorkflows = _a[1];
    var _b = useState(null), currentWorkflow = _b[0], setCurrentWorkflow = _b[1];
    var _c = useState(false), loading = _c[0], setLoading = _c[1];
    var _d = useState(null), error = _d[0], setError = _d[1];
    var _e = useState([]), executions = _e[0], setExecutions = _e[1];
    // Create a new workflow
    var createWorkflow = useCallback(function (name, description) { return __awaiter(void 0, void 0, void 0, function () {
        var newWorkflow_1, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setLoading(true);
                    setError(null);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, workflowService.createWorkflow({
                            name: name,
                            description: description,
                            nodes: [
                                {
                                    id: 'input-1',
                                    type: 'input',
                                    position: { x: 100, y: 100 },
                                    data: {
                                        name: 'Workflow Input',
                                        type: 'input',
                                        config: {
                                            inputMapping: {}
                                        }
                                    }
                                }
                            ],
                            edges: [],
                            status: 'draft',
                            version: 1,
                            createdBy: 'current-user', // TODO: Get from auth context
                            tags: [],
                        })];
                case 2:
                    newWorkflow_1 = _a.sent();
                    setWorkflows(function (prev) { return __spreadArray(__spreadArray([], prev, true), [newWorkflow_1], false); });
                    setCurrentWorkflow(newWorkflow_1);
                    return [2 /*return*/, newWorkflow_1];
                case 3:
                    err_1 = _a.sent();
                    setError(err_1 instanceof Error ? err_1 : new Error('Failed to create workflow'));
                    throw err_1;
                case 4:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); }, []);
    // Load workflows from API
    var loadWorkflows = useCallback(function () { return __awaiter(void 0, void 0, void 0, function () {
        var fetchedWorkflows, err_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setLoading(true);
                    setError(null);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, workflowService.getWorkflows()];
                case 2:
                    fetchedWorkflows = _a.sent();
                    setWorkflows(fetchedWorkflows);
                    return [3 /*break*/, 5];
                case 3:
                    err_2 = _a.sent();
                    setError(err_2 instanceof Error ? err_2 : new Error('Failed to load workflows'));
                    return [3 /*break*/, 5];
                case 4:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); }, []);
    // Save a workflow
    var saveWorkflow = useCallback(function (workflow) { return __awaiter(void 0, void 0, void 0, function () {
        var updatedWorkflow_1, err_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setLoading(true);
                    setError(null);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, workflowService.updateWorkflow(workflow.id, workflow)];
                case 2:
                    updatedWorkflow_1 = _a.sent();
                    setWorkflows(function (prev) {
                        return prev.map(function (w) { return w.id === workflow.id ? updatedWorkflow_1 : w; });
                    });
                    if ((currentWorkflow === null || currentWorkflow === void 0 ? void 0 : currentWorkflow.id) === workflow.id) {
                        setCurrentWorkflow(updatedWorkflow_1);
                    }
                    return [2 /*return*/, updatedWorkflow_1];
                case 3:
                    err_3 = _a.sent();
                    setError(err_3 instanceof Error ? err_3 : new Error('Failed to save workflow'));
                    throw err_3;
                case 4:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); }, [currentWorkflow]);
    // Delete a workflow
    var deleteWorkflow = useCallback(function (id) { return __awaiter(void 0, void 0, void 0, function () {
        var err_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setLoading(true);
                    setError(null);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, workflowService.deleteWorkflow(id)];
                case 2:
                    _a.sent();
                    setWorkflows(function (prev) { return prev.filter(function (w) { return w.id !== id; }); });
                    if ((currentWorkflow === null || currentWorkflow === void 0 ? void 0 : currentWorkflow.id) === id) {
                        setCurrentWorkflow(null);
                    }
                    return [3 /*break*/, 5];
                case 3:
                    err_4 = _a.sent();
                    setError(err_4 instanceof Error ? err_4 : new Error('Failed to delete workflow'));
                    throw err_4;
                case 4:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); }, [currentWorkflow]);
    // Execute a workflow
    var executeWorkflow = useCallback(function (workflowId, input) { return __awaiter(void 0, void 0, void 0, function () {
        var execution_1, err_5;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setLoading(true);
                    setError(null);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, workflowService.executeWorkflow(workflowId, input)];
                case 2:
                    execution_1 = _a.sent();
                    setExecutions(function (prev) { return __spreadArray(__spreadArray([], prev, true), [execution_1], false); });
                    return [2 /*return*/, execution_1];
                case 3:
                    err_5 = _a.sent();
                    setError(err_5 instanceof Error ? err_5 : new Error('Failed to execute workflow'));
                    throw err_5;
                case 4:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); }, []);
    // Load executions
    var loadExecutions = useCallback(function (workflowId) { return __awaiter(void 0, void 0, void 0, function () {
        var fetchedExecutions, err_6;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setLoading(true);
                    setError(null);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, workflowService.getExecutions(workflowId)];
                case 2:
                    fetchedExecutions = _a.sent();
                    setExecutions(fetchedExecutions);
                    return [3 /*break*/, 5];
                case 3:
                    err_6 = _a.sent();
                    setError(err_6 instanceof Error ? err_6 : new Error('Failed to load executions'));
                    return [3 /*break*/, 5];
                case 4:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); }, []);
    // Get workflow by ID
    var getWorkflow = useCallback(function (id) { return __awaiter(void 0, void 0, void 0, function () {
        var workflow, err_7;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setLoading(true);
                    setError(null);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, workflowService.getWorkflow(id)];
                case 2:
                    workflow = _a.sent();
                    setCurrentWorkflow(workflow);
                    return [2 /*return*/, workflow];
                case 3:
                    err_7 = _a.sent();
                    setError(err_7 instanceof Error ? err_7 : new Error('Failed to get workflow'));
                    throw err_7;
                case 4:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); }, []);
    return {
        workflows: workflows,
        currentWorkflow: currentWorkflow,
        executions: executions,
        loading: loading,
        error: error,
        setCurrentWorkflow: setCurrentWorkflow,
        createWorkflow: createWorkflow,
        loadWorkflows: loadWorkflows,
        saveWorkflow: saveWorkflow,
        deleteWorkflow: deleteWorkflow,
        executeWorkflow: executeWorkflow,
        loadExecutions: loadExecutions,
        getWorkflow: getWorkflow
    };
};
export default useWorkflow;
