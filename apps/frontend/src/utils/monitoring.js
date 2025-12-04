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
var SystemMonitor = /** @class */ (function () {
    function SystemMonitor(redis) {
        this.redis = redis;
        this.logger = new Logger('SystemMonitor');
        this.metricPrefixes = {
            agent_response_time: 'monitor:response_time',
            message_count: 'monitor:msg_count',
            tool_usage: 'monitor:tool_usage',
            error_rate: 'monitor:errors',
            agent_load: 'monitor:agent_load'
        };
    }
    SystemMonitor.prototype.recordResponseTime = function (agentId, responseTimeMs) {
        return __awaiter(this, void 0, void 0, function () {
            var key;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        key = "".concat(this.metricPrefixes.agent_response_time, ":").concat(agentId);
                        return [4 /*yield*/, this.recordMetric(key, responseTimeMs)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    SystemMonitor.prototype.recordMessage = function (roomId, messageType) {
        return __awaiter(this, void 0, void 0, function () {
            var key;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        key = "".concat(this.metricPrefixes.message_count, ":").concat(roomId, ":").concat(messageType);
                        return [4 /*yield*/, this.recordMetric(key, 1, true)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    SystemMonitor.prototype.recordToolUsage = function (toolName, success) {
        return __awaiter(this, void 0, void 0, function () {
            var status, key;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        status = success ? 'success' : 'failure';
                        key = "".concat(this.metricPrefixes.tool_usage, ":").concat(toolName, ":").concat(status);
                        return [4 /*yield*/, this.recordMetric(key, 1, true)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    SystemMonitor.prototype.recordError = function (errorType) {
        return __awaiter(this, void 0, void 0, function () {
            var key;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        key = "".concat(this.metricPrefixes.error_rate, ":").concat(errorType);
                        return [4 /*yield*/, this.recordMetric(key, 1, true)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    SystemMonitor.prototype.updateAgentLoad = function (agentId, activeConnectionCount) {
        return __awaiter(this, void 0, void 0, function () {
            var key;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        key = "".concat(this.metricPrefixes.agent_load, ":").concat(agentId);
                        return [4 /*yield*/, this.recordMetric(key, activeConnectionCount)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    SystemMonitor.prototype.recordMetric = function (key_1, value_1) {
        return __awaiter(this, arguments, void 0, function (key, value, increment) {
            var timestamp, error_1;
            if (increment === void 0) { increment = false; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        timestamp = Math.floor(Date.now() / 1000);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 7, , 8]);
                        if (!increment) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.redis.zadd(key, timestamp.toString(), value.toString())];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 5];
                    case 3: return [4 /*yield*/, this.redis.hset(key, timestamp.toString(), value.toString())];
                    case 4:
                        _a.sent();
                        _a.label = 5;
                    case 5: return [4 /*yield*/, this.redis.expire(key, 24 * 60 * 60)];
                    case 6:
                        _a.sent();
                        return [3 /*break*/, 8];
                    case 7:
                        error_1 = _a.sent();
                        this.logger.error("Failed to record metric: ".concat(error_1 instanceof Error ? error_1.message : String(error_1)));
                        return [3 /*break*/, 8];
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    SystemMonitor.prototype.getMetricHistory = function (metricType_1, sourceId_1) {
        return __awaiter(this, arguments, void 0, function (metricType, sourceId, timeRange) {
            var key, minTime, history, data, _i, _a, _b, timestamp, value, ts, error_2;
            if (timeRange === void 0) { timeRange = 3600; }
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        key = "".concat(this.metricPrefixes[metricType], ":").concat(sourceId);
                        minTime = Math.floor((Date.now() - timeRange) / 1000);
                        history = [];
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.redis.hgetall(key)];
                    case 2:
                        data = _c.sent();
                        for (_i = 0, _a = Object.entries(data); _i < _a.length; _i++) {
                            _b = _a[_i], timestamp = _b[0], value = _b[1];
                            ts = parseInt(timestamp, 10);
                            if (ts >= minTime) {
                                history.push({
                                    timestamp: new Date(ts * 1000),
                                    value: parseFloat(value),
                                    source: { type: metricType, id: sourceId }
                                });
                            }
                        }
                        return [3 /*break*/, 4];
                    case 3:
                        error_2 = _c.sent();
                        this.logger.error("Failed to get metric history: ".concat(error_2 instanceof Error ? error_2.message : String(error_2)));
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/, history.sort(function (a, b) { return a.timestamp.getTime() - b.timestamp.getTime(); })];
                }
            });
        });
    };
    SystemMonitor.prototype.getSystemMetrics = function () {
        return __awaiter(this, void 0, void 0, function () {
            var endTime, _a, responseTimes, messageStats, toolStats, errorStats, loadStats, error_3;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        endTime = Date.now() / 1000;
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, Promise.all([
                                this.getMetricAggregation('agent_response_time', endTime),
                                this.getMetricAggregation('message_count', endTime),
                                this.getMetricAggregation('tool_usage', endTime),
                                this.getMetricAggregation('error_rate', endTime),
                                this.getMetricAggregation('agent_load', endTime)
                            ])];
                    case 2:
                        _a = _b.sent(), responseTimes = _a[0], messageStats = _a[1], toolStats = _a[2], errorStats = _a[3], loadStats = _a[4];
                        return [2 /*return*/, {
                                responseTime: {
                                    avg: responseTimes.avg,
                                    max: responseTimes.max,
                                    p95: responseTimes.p95
                                },
                                messageCount: {
                                    total: messageStats.total,
                                    perMinute: messageStats.rate
                                },
                                toolUsage: {
                                    total: toolStats.total,
                                    distribution: toolStats.distribution
                                },
                                errorRate: {
                                    total: errorStats.total,
                                    perMinute: errorStats.rate
                                },
                                agentLoad: {
                                    active: loadStats.current,
                                    total: loadStats.total
                                }
                            }];
                    case 3:
                        error_3 = _b.sent();
                        this.logger.error("Failed to get system metrics: ".concat(error_3 instanceof Error ? error_3.message : String(error_3)));
                        throw error_3;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    SystemMonitor.prototype.getMetricAggregation = function (metricType, endTime) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, {
                        avg: 0,
                        max: 0,
                        p95: 0,
                        total: 0,
                        rate: 0,
                        current: 0,
                        distribution: {}
                    }];
            });
        });
    };
    return SystemMonitor;
}());
export { SystemMonitor };
