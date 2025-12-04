/**
 * Workflow Execution Service - Real-time workflow execution monitoring
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
var WorkflowExecutionService = /** @class */ (function () {
    function WorkflowExecutionService() {
        this.subscriptions = new Map();
        this.websockets = new Map();
    }
    // Subscribe to real-time execution updates
    WorkflowExecutionService.prototype.subscribeToExecution = function (executionId, callback) {
        var _this = this;
        // Add subscription
        var subscriptions = this.subscriptions.get(executionId) || [];
        var subscription = {
            executionId: executionId,
            callback: callback,
            cleanup: function () { return _this.unsubscribe(executionId, subscription); }
        };
        subscriptions.push(subscription);
        this.subscriptions.set(executionId, subscriptions);
        // Create WebSocket connection if not exists
        if (!this.websockets.has(executionId)) {
            this.createWebSocketConnection(executionId);
        }
        // Return cleanup function
        return subscription.cleanup;
    };
    WorkflowExecutionService.prototype.createWebSocketConnection = function (executionId) {
        var _this = this;
        var protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        var wsUrl = "".concat(protocol, "//").concat(window.location.host, "/api/workflows/executions/").concat(executionId, "/stream");
        var ws = new WebSocket(wsUrl);
        ws.onopen = function () {
            console.log("WebSocket connected for execution ".concat(executionId));
        };
        ws.onmessage = function (event) {
            try {
                var update = __assign(__assign({}, JSON.parse(event.data)), { timestamp: new Date() });
                _this.notifySubscribers(executionId, update);
            }
            catch (error) {
                console.error('Failed to parse execution update:', error);
            }
        };
        ws.onerror = function (error) {
            console.error("WebSocket error for execution ".concat(executionId, ":"), error);
        };
        ws.onclose = function () {
            console.log("WebSocket closed for execution ".concat(executionId));
            _this.websockets.delete(executionId);
            // Attempt to reconnect after 5 seconds if there are still subscribers
            if (_this.subscriptions.has(executionId) && _this.subscriptions.get(executionId).length > 0) {
                setTimeout(function () {
                    _this.createWebSocketConnection(executionId);
                }, 5000);
            }
        };
        this.websockets.set(executionId, ws);
    };
    WorkflowExecutionService.prototype.notifySubscribers = function (executionId, update) {
        var subscriptions = this.subscriptions.get(executionId) || [];
        subscriptions.forEach(function (subscription) {
            try {
                subscription.callback(update);
            }
            catch (error) {
                console.error('Error in execution update callback:', error);
            }
        });
    };
    WorkflowExecutionService.prototype.unsubscribe = function (executionId, subscription) {
        var subscriptions = this.subscriptions.get(executionId) || [];
        var index = subscriptions.indexOf(subscription);
        if (index > -1) {
            subscriptions.splice(index, 1);
            if (subscriptions.length === 0) {
                // No more subscribers, close WebSocket
                var ws = this.websockets.get(executionId);
                if (ws) {
                    ws.close();
                    this.websockets.delete(executionId);
                }
                this.subscriptions.delete(executionId);
            }
            else {
                this.subscriptions.set(executionId, subscriptions);
            }
        }
    };
    // Get execution status with polling fallback
    WorkflowExecutionService.prototype.getExecutionStatus = function (executionId) {
        return __awaiter(this, void 0, void 0, function () {
            var response, execution;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0: return [4 /*yield*/, fetch("/api/workflows/executions/".concat(executionId))];
                    case 1:
                        response = _c.sent();
                        if (!response.ok) {
                            throw new Error("Failed to get execution status: ".concat(response.statusText));
                        }
                        return [4 /*yield*/, response.json()];
                    case 2:
                        execution = _c.sent();
                        return [2 /*return*/, __assign(__assign({}, execution), { startTime: new Date(execution.startTime), endTime: execution.endTime ? new Date(execution.endTime) : undefined, logs: ((_a = execution.logs) === null || _a === void 0 ? void 0 : _a.map(function (log) { return (__assign(__assign({}, log), { timestamp: new Date(log.timestamp) })); })) || [], nodeExecutions: ((_b = execution.nodeExecutions) === null || _b === void 0 ? void 0 : _b.map(function (nodeExec) { return (__assign(__assign({}, nodeExec), { startTime: nodeExec.startTime ? new Date(nodeExec.startTime) : undefined, endTime: nodeExec.endTime ? new Date(nodeExec.endTime) : undefined })); })) || [] })];
                }
            });
        });
    };
    // Control execution
    WorkflowExecutionService.prototype.pauseExecution = function (executionId) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, fetch("/api/workflows/executions/".concat(executionId, "/pause"), {
                            method: 'POST',
                        })];
                    case 1:
                        response = _a.sent();
                        if (!response.ok) {
                            throw new Error("Failed to pause execution: ".concat(response.statusText));
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    WorkflowExecutionService.prototype.resumeExecution = function (executionId) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, fetch("/api/workflows/executions/".concat(executionId, "/resume"), {
                            method: 'POST',
                        })];
                    case 1:
                        response = _a.sent();
                        if (!response.ok) {
                            throw new Error("Failed to resume execution: ".concat(response.statusText));
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    WorkflowExecutionService.prototype.cancelExecution = function (executionId) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, fetch("/api/workflows/executions/".concat(executionId, "/cancel"), {
                            method: 'POST',
                        })];
                    case 1:
                        response = _a.sent();
                        if (!response.ok) {
                            throw new Error("Failed to cancel execution: ".concat(response.statusText));
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    // Cleanup all connections
    WorkflowExecutionService.prototype.cleanup = function () {
        this.websockets.forEach(function (ws) { return ws.close(); });
        this.websockets.clear();
        this.subscriptions.clear();
    };
    return WorkflowExecutionService;
}());
// Export singleton instance
export var workflowExecutionService = new WorkflowExecutionService();
export default WorkflowExecutionService;
