/**
 * Agent Service - Production ready service for agent management
 */
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
var AgentService = /** @class */ (function () {
    function AgentService(baseUrl, apiKey) {
        if (baseUrl === void 0) { baseUrl = '/api'; }
        this.baseUrl = baseUrl;
        this.apiKey = apiKey;
    }
    AgentService.prototype.request = function (endpoint_1) {
        return __awaiter(this, arguments, void 0, function (endpoint, options) {
            var url, headers, response;
            if (options === void 0) { options = {}; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        url = "".concat(this.baseUrl).concat(endpoint);
                        headers = __assign({ 'Content-Type': 'application/json' }, options.headers);
                        if (this.apiKey) {
                            headers['Authorization'] = "Bearer ".concat(this.apiKey);
                        }
                        return [4 /*yield*/, fetch(url, __assign(__assign({}, options), { headers: headers }))];
                    case 1:
                        response = _a.sent();
                        if (!response.ok) {
                            throw new Error("Agent API Error: ".concat(response.status, " ").concat(response.statusText));
                        }
                        return [2 /*return*/, response.json()];
                }
            });
        });
    };
    // Agent CRUD operations
    AgentService.prototype.getAgents = function () {
        return __awaiter(this, void 0, void 0, function () {
            var agents, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.request('/agents')];
                    case 1:
                        agents = _a.sent();
                        return [2 /*return*/, agents.map(this.transformAgent)];
                    case 2:
                        error_1 = _a.sent();
                        console.error('Failed to fetch agents:', error_1);
                        throw error_1;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    AgentService.prototype.getAgent = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var agent, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.request("/agents/".concat(id))];
                    case 1:
                        agent = _a.sent();
                        return [2 /*return*/, this.transformAgent(agent)];
                    case 2:
                        error_2 = _a.sent();
                        console.error("Failed to fetch agent ".concat(id, ":"), error_2);
                        throw error_2;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    AgentService.prototype.createAgent = function (agent) {
        return __awaiter(this, void 0, void 0, function () {
            var created, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.request('/agents', {
                                method: 'POST',
                                body: JSON.stringify(agent),
                            })];
                    case 1:
                        created = _a.sent();
                        return [2 /*return*/, this.transformAgent(created)];
                    case 2:
                        error_3 = _a.sent();
                        console.error('Failed to create agent:', error_3);
                        throw error_3;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    AgentService.prototype.updateAgent = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () {
            var updated, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.request("/agents/".concat(id), {
                                method: 'PATCH',
                                body: JSON.stringify(updates),
                            })];
                    case 1:
                        updated = _a.sent();
                        return [2 /*return*/, this.transformAgent(updated)];
                    case 2:
                        error_4 = _a.sent();
                        console.error("Failed to update agent ".concat(id, ":"), error_4);
                        throw error_4;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    AgentService.prototype.deleteAgent = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.request("/agents/".concat(id), {
                                method: 'DELETE',
                            })];
                    case 1:
                        _a.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        error_5 = _a.sent();
                        console.error("Failed to delete agent ".concat(id, ":"), error_5);
                        throw error_5;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // Agent execution
    AgentService.prototype.executeAgent = function (agentId, task, parameters) {
        return __awaiter(this, void 0, void 0, function () {
            var execution, error_6;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.request('/agents/execute', {
                                method: 'POST',
                                body: JSON.stringify({
                                    agentId: agentId,
                                    task: task,
                                    parameters: parameters,
                                }),
                            })];
                    case 1:
                        execution = _a.sent();
                        return [2 /*return*/, this.transformExecution(execution)];
                    case 2:
                        error_6 = _a.sent();
                        console.error("Failed to execute agent ".concat(agentId, ":"), error_6);
                        throw error_6;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    AgentService.prototype.getExecution = function (executionId) {
        return __awaiter(this, void 0, void 0, function () {
            var execution, error_7;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.request("/agents/executions/".concat(executionId))];
                    case 1:
                        execution = _a.sent();
                        return [2 /*return*/, this.transformExecution(execution)];
                    case 2:
                        error_7 = _a.sent();
                        console.error("Failed to fetch execution ".concat(executionId, ":"), error_7);
                        throw error_7;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    AgentService.prototype.getExecutions = function (agentId) {
        return __awaiter(this, void 0, void 0, function () {
            var endpoint, executions, error_8;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        endpoint = agentId
                            ? "/agents/".concat(agentId, "/executions")
                            : '/agents/executions';
                        return [4 /*yield*/, this.request(endpoint)];
                    case 1:
                        executions = _a.sent();
                        return [2 /*return*/, executions.map(this.transformExecution)];
                    case 2:
                        error_8 = _a.sent();
                        console.error('Failed to fetch executions:', error_8);
                        throw error_8;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // Agent capabilities
    AgentService.prototype.getCapabilities = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_9;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.request('/agents/capabilities')];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2:
                        error_9 = _a.sent();
                        console.error('Failed to fetch agent capabilities:', error_9);
                        throw error_9;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    AgentService.prototype.getAgentCapabilities = function (agentId) {
        return __awaiter(this, void 0, void 0, function () {
            var error_10;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.request("/agents/".concat(agentId, "/capabilities"))];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2:
                        error_10 = _a.sent();
                        console.error("Failed to fetch capabilities for agent ".concat(agentId, ":"), error_10);
                        throw error_10;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // Agent health and status
    AgentService.prototype.getAgentStatus = function (agentId) {
        return __awaiter(this, void 0, void 0, function () {
            var error_11;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.request("/agents/".concat(agentId, "/status"))];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2:
                        error_11 = _a.sent();
                        console.error("Failed to fetch status for agent ".concat(agentId, ":"), error_11);
                        throw error_11;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    AgentService.prototype.pingAgent = function (agentId) {
        return __awaiter(this, void 0, void 0, function () {
            var error_12;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.request("/agents/".concat(agentId, "/ping"))];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, true];
                    case 2:
                        error_12 = _a.sent();
                        console.error("Failed to ping agent ".concat(agentId, ":"), error_12);
                        return [2 /*return*/, false];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // Agent configuration
    AgentService.prototype.getAgentConfig = function (agentId) {
        return __awaiter(this, void 0, void 0, function () {
            var error_13;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.request("/agents/".concat(agentId, "/config"))];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2:
                        error_13 = _a.sent();
                        console.error("Failed to fetch config for agent ".concat(agentId, ":"), error_13);
                        throw error_13;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    AgentService.prototype.updateAgentConfig = function (agentId, config) {
        return __awaiter(this, void 0, void 0, function () {
            var error_14;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.request("/agents/".concat(agentId, "/config"), {
                                method: 'PATCH',
                                body: JSON.stringify(config),
                            })];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2:
                        error_14 = _a.sent();
                        console.error("Failed to update config for agent ".concat(agentId, ":"), error_14);
                        throw error_14;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // Transform API responses to frontend types
    AgentService.prototype.transformAgent = function (apiAgent) {
        return __assign(__assign({}, apiAgent), { createdAt: new Date(apiAgent.createdAt), updatedAt: new Date(apiAgent.updatedAt) });
    };
    AgentService.prototype.transformExecution = function (apiExecution) {
        return __assign(__assign({}, apiExecution), { startTime: new Date(apiExecution.startTime), endTime: apiExecution.endTime ? new Date(apiExecution.endTime) : undefined });
    };
    return AgentService;
}());
// Export singleton instance
export var agentService = new AgentService();
export default AgentService;
