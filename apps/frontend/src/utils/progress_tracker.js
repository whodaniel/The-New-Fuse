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
exports.ProgressTracker = void 0;
import logging_config_1 from './logging_config';
var ProgressTracker = /** @class */ (function () {
    function ProgressTracker() {
        this.tasks = {};
        this.metrics = {};
        this.logger = (0, logging_config_1.getLogger)('progress_tracker');
    }
    ProgressTracker.prototype.monitorTask = function (taskId) {
        return __awaiter(this, void 0, void 0, function () {
            var status_1, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.logger.info("Starting to monitor task: ".concat(taskId));
                        _a.label = 1;
                    case 1:
                        if (!(taskId in this.tasks)) return [3 /*break*/, 9];
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 7, , 8]);
                        return [4 /*yield*/, this.getTaskStatus(taskId)];
                    case 3:
                        status_1 = _a.sent();
                        this.updateMetrics(taskId, status_1);
                        if (!this.shouldAdjustStrategy(taskId)) return [3 /*break*/, 5];
                        return [4 /*yield*/, this.optimizeExecution(taskId)];
                    case 4:
                        _a.sent();
                        _a.label = 5;
                    case 5: return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 1000); })];
                    case 6:
                        _a.sent();
                        return [3 /*break*/, 8];
                    case 7:
                        error_1 = _a.sent();
                        this.logger.error("Error monitoring task ".concat(taskId, ": ").concat(error_1 instanceof Error ? error_1.message : String(error_1)));
                        return [3 /*break*/, 9];
                    case 8: return [3 /*break*/, 1];
                    case 9:
                        this.logger.info("Stopped monitoring task: ".concat(taskId));
                        return [2 /*return*/];
                }
            });
        });
    };
    ProgressTracker.prototype.updateMetrics = function (taskId, status) {
        if (!(taskId in this.metrics)) {
            this.metrics[taskId] = {
                progress: [],
                timestamps: [],
                performance_metrics: {
                    cpu_usage: [],
                    memory_usage: [],
                    response_time: []
                }
            };
        }
        var currentMetrics = this.metrics[taskId];
        currentMetrics.progress.push(status.progress);
        currentMetrics.timestamps.push(Date.now());
        if (status.metrics && currentMetrics.performance_metrics) {
            if (status.metrics.cpu_usage !== undefined) {
                currentMetrics.performance_metrics.cpu_usage.push(status.metrics.cpu_usage);
            }
            if (status.metrics.memory_usage !== undefined) {
                currentMetrics.performance_metrics.memory_usage.push(status.metrics.memory_usage);
            }
            if (status.metrics.response_time !== undefined) {
                currentMetrics.performance_metrics.response_time.push(status.metrics.response_time);
            }
        }
        this.logger.debug("Updated metrics for task ".concat(taskId), {
            progress: status.progress,
            metrics: status.metrics
        });
    };
    ProgressTracker.prototype.optimizeExecution = function (taskId) {
        return __awaiter(this, void 0, void 0, function () {
            var task;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        task = this.tasks[taskId];
                        if (!task) {
                            this.logger.warn("Cannot optimize execution: Task ".concat(taskId, " not found"));
                            return [2 /*return*/];
                        }
                        if (!task.performance_below_threshold()) return [3 /*break*/, 2];
                        this.logger.info("Performance below threshold for task ".concat(taskId, ", rebalancing resources"));
                        return [4 /*yield*/, this.rebalanceResources(task)];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [2 /*return*/];
                }
            });
        });
    };
    ProgressTracker.prototype.getTaskStatus = function (taskId) {
        return __awaiter(this, void 0, void 0, function () {
            var task;
            return __generator(this, function (_a) {
                task = this.tasks[taskId];
                if (!task) {
                    throw new Error("Task ".concat(taskId, " not found"));
                }
                try {
                    return [2 /*return*/, {
                            progress: task.progress,
                            performance_below_threshold: task.performance_below_threshold,
                            metrics: {
                                cpu_usage: Math.random() * 100,
                                memory_usage: Math.random() * 100,
                                response_time: Math.random() * 1000
                            }
                        }];
                }
                catch (error) {
                    this.logger.error("Error getting status for task ".concat(taskId, ": ").concat(error instanceof Error ? error.message : String(error)));
                    throw error;
                }
                return [2 /*return*/];
            });
        });
    };
    ProgressTracker.prototype.shouldAdjustStrategy = function (taskId) {
        var metrics = this.metrics[taskId];
        if (!metrics || metrics.progress.length < 2) {
            return false;
        }
        var recentProgress = metrics.progress.slice(-5);
        var progressRate = (recentProgress[recentProgress.length - 1] - recentProgress[0]) /
            (metrics.timestamps[metrics.timestamps.length - 1] - metrics.timestamps[metrics.timestamps.length - 5]);
        var MIN_PROGRESS_RATE = 0.01;
        return progressRate < MIN_PROGRESS_RATE;
    };
    ProgressTracker.prototype.rebalanceResources = function (task) {
        return __awaiter(this, void 0, void 0, function () {
            var error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        this.logger.info('Rebalancing resources for task', {
                            current_metrics: task.metrics
                        });
                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 500); })];
                    case 1:
                        _a.sent();
                        this.logger.info('Resources rebalanced successfully');
                        return [3 /*break*/, 3];
                    case 2:
                        error_2 = _a.sent();
                        this.logger.error("Error rebalancing resources: ".concat(error_2 instanceof Error ? error_2.message : String(error_2)));
                        throw error_2;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    ProgressTracker.prototype.addTask = function (taskId, initialProgress) {
        var _this = this;
        if (initialProgress === void 0) { initialProgress = 0; }
        this.tasks[taskId] = {
            progress: initialProgress,
            performance_below_threshold: function () { return _this.shouldAdjustStrategy(taskId); }
        };
        this.logger.info("Added new task: ".concat(taskId));
    };
    ProgressTracker.prototype.removeTask = function (taskId) {
        delete this.tasks[taskId];
        this.logger.info("Removed task: ".concat(taskId));
    };
    ProgressTracker.prototype.getProgress = function (taskId) {
        var task = this.tasks[taskId];
        return task ? task.progress : null;
    };
    ProgressTracker.prototype.getTaskMetrics = function (taskId) {
        return this.metrics[taskId] || null;
    };
    return ProgressTracker;
}());
exports.ProgressTracker = ProgressTracker;
