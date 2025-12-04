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
import { EventBus } from '../eventBus';
import { StateManager } from '../stateManager';
import { LoggingService } from '../../../services/logging';
var TaskBridge = /** @class */ (function () {
    function TaskBridge() {
        this.communicationManager = CommunicationManager.getInstance();
        this.eventBus = EventBus.getInstance();
        this.stateManager = StateManager.getInstance();
        this.logger = LoggingService.getInstance();
        this.setupEventListeners();
    }
    TaskBridge.getInstance = function () {
        if (!TaskBridge.instance) {
            TaskBridge.instance = new TaskBridge();
        }
        return TaskBridge.instance;
    };
    TaskBridge.prototype.setupEventListeners = function () {
        var _this = this;
        this.eventBus.on('task_update', function (event) {
            _this.handleTaskUpdate(event.payload);
        });
        this.eventBus.on('task_status_change', function (event) {
            _this.handleStatusChange(event.payload);
        });
    };
    TaskBridge.prototype.handleTaskUpdate = function (event) {
        var taskId = event.taskId, changes = event.changes;
        var currentTask = this.stateManager.getState(['tasks', taskId]);
        if (currentTask) {
            this.stateManager.setState(['tasks', taskId], Object.assign(Object.assign({}, currentTask), changes));
        }
    };
    TaskBridge.prototype.handleStatusChange = function (event) {
        var taskId = event.taskId, status = event.status;
        this.stateManager.setState(['tasks', taskId, 'status'], status);
    };
    TaskBridge.prototype.createTask = function (task) {
        return __awaiter(this, void 0, void 0, function () {
            var response, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.communicationManager.send({
                                type: 'create_task',
                                payload: task
                            })];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, { success: true, data: response }];
                    case 2:
                        error_1 = _a.sent();
                        this.logger.error('Failed to create task', error_1);
                        return [2 /*return*/, {
                                success: false,
                                error: {
                                    code: 'TASK_CREATION_FAILED',
                                    message: 'Failed to create task',
                                    details: error_1
                                }
                            }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    TaskBridge.prototype.getTask = function (taskId) {
        return __awaiter(this, void 0, void 0, function () {
            var task, response, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        task = this.stateManager.getState(['tasks', taskId]);
                        if (!!task) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.communicationManager.send({
                                type: 'get_task',
                                payload: { taskId: taskId }
                            })];
                    case 1:
                        response = _a.sent();
                        this.stateManager.setState(['tasks', taskId], response);
                        return [2 /*return*/, { success: true, data: response }];
                    case 2: return [2 /*return*/, { success: true, data: task }];
                    case 3:
                        error_2 = _a.sent();
                        this.logger.error('Failed to get task', error_2);
                        return [2 /*return*/, {
                                success: false,
                                error: {
                                    code: 'TASK_NOT_FOUND',
                                    message: 'Failed to get task',
                                    details: error_2
                                }
                            }];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    TaskBridge.prototype.updateTask = function (taskId, changes) {
        return __awaiter(this, void 0, void 0, function () {
            var error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.communicationManager.send({
                                type: 'update_task',
                                payload: { taskId: taskId, changes: changes }
                            })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, { success: true, data: undefined }];
                    case 2:
                        error_3 = _a.sent();
                        this.logger.error('Failed to update task', error_3);
                        return [2 /*return*/, {
                                success: false,
                                error: {
                                    code: 'TASK_UPDATE_FAILED',
                                    message: 'Failed to update task',
                                    details: error_3
                                }
                            }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    TaskBridge.prototype.updateStatus = function (taskId, status) {
        return __awaiter(this, void 0, void 0, function () {
            var error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.communicationManager.send({
                                type: 'update_task_status',
                                payload: { taskId: taskId, status: status }
                            })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, { success: true, data: undefined }];
                    case 2:
                        error_4 = _a.sent();
                        this.logger.error('Failed to update task status', error_4);
                        return [2 /*return*/, {
                                success: false,
                                error: {
                                    code: 'STATUS_UPDATE_FAILED',
                                    message: 'Failed to update task status',
                                    details: error_4
                                }
                            }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    TaskBridge.prototype.assignTask = function (taskId, userId) {
        return __awaiter(this, void 0, void 0, function () {
            var error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.communicationManager.send({
                                type: 'assign_task',
                                payload: { taskId: taskId, userId: userId }
                            })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, { success: true, data: undefined }];
                    case 2:
                        error_5 = _a.sent();
                        this.logger.error('Failed to assign task', error_5);
                        return [2 /*return*/, {
                                success: false,
                                error: {
                                    code: 'TASK_ASSIGNMENT_FAILED',
                                    message: 'Failed to assign task',
                                    details: error_5
                                }
                            }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    TaskBridge.prototype.updatePriority = function (taskId, priority) {
        return __awaiter(this, void 0, void 0, function () {
            var error_6;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.communicationManager.send({
                                type: 'update_task_priority',
                                payload: { taskId: taskId, priority: priority }
                            })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, { success: true, data: undefined }];
                    case 2:
                        error_6 = _a.sent();
                        this.logger.error('Failed to update task priority', error_6);
                        return [2 /*return*/, {
                                success: false,
                                error: {
                                    code: 'PRIORITY_UPDATE_FAILED',
                                    message: 'Failed to update task priority',
                                    details: error_6
                                }
                            }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    TaskBridge.prototype.subscribeToTaskUpdates = function (taskId, callback) {
        return this.stateManager.subscribe(['tasks', taskId], callback);
    };
    TaskBridge.prototype.subscribeToStatusUpdates = function (taskId, callback) {
        return this.stateManager.subscribe(['tasks', taskId, 'status'], callback);
    };
    return TaskBridge;
}());
export { TaskBridge };
