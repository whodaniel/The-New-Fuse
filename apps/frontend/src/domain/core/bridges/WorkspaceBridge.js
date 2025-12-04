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
var WorkspaceBridge = /** @class */ (function () {
    function WorkspaceBridge() {
        this.communicationManager = CommunicationManager.getInstance();
        this.eventBus = EventBus.getInstance();
        this.stateManager = StateManager.getInstance();
        this.logger = LoggingService.getInstance();
        this.setupEventListeners();
    }
    WorkspaceBridge.getInstance = function () {
        if (!WorkspaceBridge.instance) {
            WorkspaceBridge.instance = new WorkspaceBridge();
        }
        return WorkspaceBridge.instance;
    };
    WorkspaceBridge.prototype.setupEventListeners = function () {
        var _this = this;
        this.eventBus.on('workspace_update', function (event) {
            _this.handleWorkspaceUpdate(event.payload);
        });
        this.eventBus.on('workspace_member_update', function (event) {
            _this.handleMemberUpdate(event.payload);
        });
    };
    WorkspaceBridge.prototype.handleWorkspaceUpdate = function (event) {
        var workspaceId = event.workspaceId, changes = event.changes;
        var currentConfig = this.stateManager.getState(['workspaces', workspaceId]);
        if (currentConfig) {
            this.stateManager.setState(['workspaces', workspaceId], Object.assign(Object.assign({}, currentConfig), changes));
        }
    };
    WorkspaceBridge.prototype.handleMemberUpdate = function (event) {
        var workspaceId = event.workspaceId, userId = event.userId, role = event.role;
        var path = ['workspaces', workspaceId, 'members', userId];
        this.stateManager.setState(path, Object.assign(Object.assign({}, this.stateManager.getState(path)), { role: role }));
    };
    WorkspaceBridge.prototype.createWorkspace = function (config) {
        return __awaiter(this, void 0, void 0, function () {
            var response, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.communicationManager.send({
                                type: 'create_workspace',
                                payload: config
                            })];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, { success: true, data: response }];
                    case 2:
                        error_1 = _a.sent();
                        this.logger.error('Failed to create workspace', error_1);
                        return [2 /*return*/, {
                                success: false,
                                error: {
                                    code: 'WORKSPACE_CREATION_FAILED',
                                    message: 'Failed to create workspace',
                                    details: error_1
                                }
                            }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    WorkspaceBridge.prototype.getWorkspaceConfig = function (workspaceId) {
        return __awaiter(this, void 0, void 0, function () {
            var config, response, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        config = this.stateManager.getState(['workspaces', workspaceId]);
                        if (!!config) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.communicationManager.send({
                                type: 'get_workspace',
                                payload: { workspaceId: workspaceId }
                            })];
                    case 1:
                        response = _a.sent();
                        this.stateManager.setState(['workspaces', workspaceId], response);
                        return [2 /*return*/, { success: true, data: response }];
                    case 2: return [2 /*return*/, { success: true, data: config }];
                    case 3:
                        error_2 = _a.sent();
                        this.logger.error('Failed to get workspace config', error_2);
                        return [2 /*return*/, {
                                success: false,
                                error: {
                                    code: 'WORKSPACE_NOT_FOUND',
                                    message: 'Failed to get workspace configuration',
                                    details: error_2
                                }
                            }];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    WorkspaceBridge.prototype.updateWorkspace = function (workspaceId, changes) {
        return __awaiter(this, void 0, void 0, function () {
            var error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.communicationManager.send({
                                type: 'update_workspace',
                                payload: { workspaceId: workspaceId, changes: changes }
                            })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, { success: true, data: undefined }];
                    case 2:
                        error_3 = _a.sent();
                        this.logger.error('Failed to update workspace', error_3);
                        return [2 /*return*/, {
                                success: false,
                                error: {
                                    code: 'WORKSPACE_UPDATE_FAILED',
                                    message: 'Failed to update workspace',
                                    details: error_3
                                }
                            }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    WorkspaceBridge.prototype.addMember = function (workspaceId, userId, role) {
        return __awaiter(this, void 0, void 0, function () {
            var error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.communicationManager.send({
                                type: 'add_workspace_member',
                                payload: { workspaceId: workspaceId, userId: userId, role: role }
                            })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, { success: true, data: undefined }];
                    case 2:
                        error_4 = _a.sent();
                        this.logger.error('Failed to add workspace member', error_4);
                        return [2 /*return*/, {
                                success: false,
                                error: {
                                    code: 'MEMBER_ADD_FAILED',
                                    message: 'Failed to add member to workspace',
                                    details: error_4
                                }
                            }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    WorkspaceBridge.prototype.removeMember = function (workspaceId, userId) {
        return __awaiter(this, void 0, void 0, function () {
            var error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.communicationManager.send({
                                type: 'remove_workspace_member',
                                payload: { workspaceId: workspaceId, userId: userId }
                            })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, { success: true, data: undefined }];
                    case 2:
                        error_5 = _a.sent();
                        this.logger.error('Failed to remove workspace member', error_5);
                        return [2 /*return*/, {
                                success: false,
                                error: {
                                    code: 'MEMBER_REMOVE_FAILED',
                                    message: 'Failed to remove member from workspace',
                                    details: error_5
                                }
                            }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    WorkspaceBridge.prototype.subscribeToWorkspaceUpdates = function (workspaceId, callback) {
        return this.stateManager.subscribe(['workspaces', workspaceId], callback);
    };
    WorkspaceBridge.prototype.subscribeTomemberUpdates = function (workspaceId, callback) {
        return this.stateManager.subscribe(['workspaces', workspaceId, 'members'], callback);
    };
    return WorkspaceBridge;
}());
export { WorkspaceBridge };
