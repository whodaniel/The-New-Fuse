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
export var useMassOptimization = function () {
    var _a = useState(false), loading = _a[0], setLoading = _a[1];
    var _b = useState(null), error = _b[0], setError = _b[1];
    var apiCall = useCallback(function (url_1) {
        var args_1 = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args_1[_i - 1] = arguments[_i];
        }
        return __awaiter(void 0, __spreadArray([url_1], args_1, true), void 0, function (url, options) {
            var response, errorData, err_1, message;
            if (options === void 0) { options = {}; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        setLoading(true);
                        setError(null);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 6, 7, 8]);
                        return [4 /*yield*/, fetch("/api/mass".concat(url), __assign({ headers: __assign({ 'Content-Type': 'application/json' }, options.headers) }, options))];
                    case 2:
                        response = _a.sent();
                        if (!!response.ok) return [3 /*break*/, 4];
                        return [4 /*yield*/, response.json().catch(function () { return ({ message: 'Unknown error' }); })];
                    case 3:
                        errorData = _a.sent();
                        throw new Error(errorData.message || "HTTP ".concat(response.status));
                    case 4: return [4 /*yield*/, response.json()];
                    case 5: return [2 /*return*/, _a.sent()];
                    case 6:
                        err_1 = _a.sent();
                        message = err_1 instanceof Error ? err_1.message : 'An unknown error occurred';
                        setError(message);
                        throw err_1;
                    case 7:
                        setLoading(false);
                        return [7 /*endfinally*/];
                    case 8: return [2 /*return*/];
                }
            });
        });
    }, []);
    var optimizeAgent = useCallback(function (agentId, config) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, apiCall("/optimize/agent/".concat(agentId), {
                    method: 'POST',
                    body: JSON.stringify(config),
                })];
        });
    }); }, [apiCall]);
    var optimizeTopology = useCallback(function (agentIds, config) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, apiCall('/optimize/topology', {
                    method: 'POST',
                    body: JSON.stringify({ agentIds: agentIds, config: config }),
                })];
        });
    }); }, [apiCall]);
    var optimizeWorkflow = useCallback(function (topologyId, config) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, apiCall("/optimize/workflow/".concat(topologyId), {
                    method: 'POST',
                    body: JSON.stringify(config),
                })];
        });
    }); }, [apiCall]);
    var runFullOptimization = useCallback(function (agentIds, config) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, apiCall('/optimize/full', {
                    method: 'POST',
                    body: JSON.stringify({ agentIds: agentIds, config: config }),
                })];
        });
    }); }, [apiCall]);
    var createOptimizedAgent = useCallback(function (agentId, config) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, apiCall("/agents/".concat(agentId, "/create-optimized"), {
                    method: 'POST',
                    body: JSON.stringify(config),
                })];
        });
    }); }, [apiCall]);
    var getOptimizationJob = useCallback(function (jobId) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, apiCall("/jobs/".concat(jobId))];
        });
    }); }, [apiCall]);
    var getUserOptimizationJobs = useCallback(function (status, type) { return __awaiter(void 0, void 0, void 0, function () {
        var params, result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    params = new URLSearchParams();
                    if (status)
                        params.append('status', status);
                    if (type)
                        params.append('type', type);
                    return [4 /*yield*/, apiCall("/jobs?".concat(params.toString()))];
                case 1:
                    result = _a.sent();
                    return [2 /*return*/, result.jobs];
            }
        });
    }); }, [apiCall]);
    var getAgentOptimizationHistory = useCallback(function (agentId) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, apiCall("/agents/".concat(agentId, "/history"))];
        });
    }); }, [apiCall]);
    var createValidationDataset = useCallback(function (datasetData) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, apiCall('/validate/dataset', {
                    method: 'POST',
                    body: JSON.stringify(datasetData),
                })];
        });
    }); }, [apiCall]);
    var getUserValidationDatasets = useCallback(function () { return __awaiter(void 0, void 0, void 0, function () {
        var result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, apiCall('/validate/datasets')];
                case 1:
                    result = _a.sent();
                    return [2 /*return*/, result.datasets];
            }
        });
    }); }, [apiCall]);
    var getAgentPerformanceAnalytics = useCallback(function (agentId, timeRange) { return __awaiter(void 0, void 0, void 0, function () {
        var params;
        return __generator(this, function (_a) {
            params = new URLSearchParams();
            if (timeRange)
                params.append('timeRange', timeRange);
            return [2 /*return*/, apiCall("/analytics/performance/".concat(agentId, "?").concat(params.toString()))];
        });
    }); }, [apiCall]);
    var getTopologyPerformanceAnalytics = useCallback(function (topologyId) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, apiCall("/analytics/topology/".concat(topologyId))];
        });
    }); }, [apiCall]);
    var exportOptimizedAgent = useCallback(function (agentId) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, apiCall("/export/agent/".concat(agentId))];
        });
    }); }, [apiCall]);
    var importOptimizedAgent = useCallback(function (importData) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, apiCall('/import/agent', {
                    method: 'POST',
                    body: JSON.stringify(importData),
                })];
        });
    }); }, [apiCall]);
    var exportOptimizedTopology = useCallback(function (topologyId) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, apiCall("/export/topology/".concat(topologyId))];
        });
    }); }, [apiCall]);
    var importOptimizedTopology = useCallback(function (importData) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, apiCall('/import/topology', {
                    method: 'POST',
                    body: JSON.stringify(importData),
                })];
        });
    }); }, [apiCall]);
    return {
        // Core optimization functions
        optimizeAgent: optimizeAgent,
        optimizeTopology: optimizeTopology,
        optimizeWorkflow: optimizeWorkflow,
        runFullOptimization: runFullOptimization,
        createOptimizedAgent: createOptimizedAgent,
        // Job management
        getOptimizationJob: getOptimizationJob,
        getUserOptimizationJobs: getUserOptimizationJobs,
        getAgentOptimizationHistory: getAgentOptimizationHistory,
        // Validation datasets
        createValidationDataset: createValidationDataset,
        getUserValidationDatasets: getUserValidationDatasets,
        // Analytics
        getAgentPerformanceAnalytics: getAgentPerformanceAnalytics,
        getTopologyPerformanceAnalytics: getTopologyPerformanceAnalytics,
        // Import/Export
        exportOptimizedAgent: exportOptimizedAgent,
        importOptimizedAgent: importOptimizedAgent,
        exportOptimizedTopology: exportOptimizedTopology,
        importOptimizedTopology: importOptimizedTopology,
        // State
        loading: loading,
        error: error,
    };
};
