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
import { MessageFactory } from '../messageTypes';
import { AgentStatus } from '../../../models/enums';
var AgentBridge = /** @class */ (function () {
    function AgentBridge() {
        this.communicationManager = CommunicationManager.getInstance();
        this.eventBus = EventBus.getInstance();
        this.stateManager = StateManager.getInstance();
        this.logger = LoggingService.getInstance();
        this.setupEventListeners();
    }
    AgentBridge.getInstance = function () {
        if (!AgentBridge.instance) {
            AgentBridge.instance = new AgentBridge();
        }
        return AgentBridge.instance;
    };
    AgentBridge.prototype.setupEventListeners = function () {
        var _this = this;
        this.eventBus.on('agent_message', function (event) {
            _this.handleAgentMessage(event.payload);
        });
        this.eventBus.on('agent_status_change', function (event) {
            _this.handleAgentStatusChange(event.payload);
        });
    };
    AgentBridge.prototype.handleAgentMessage = function (message) {
        var _a;
        var agentId = (_a = message.metadata) === null || _a === void 0 ? void 0 : _a.agentId;
        if (!agentId) {
            this.logger.warn('Received agent message without agentId', { message: message });
            return;
        }
        this.stateManager.setState(['agents', agentId, 'lastMessage'], message);
        this.eventBus.emit('agent_message_processed', message, 'AgentBridge');
    };
    AgentBridge.prototype.handleAgentStatusChange = function (payload) {
        var agentId = payload.agentId, status = payload.status;
        this.stateManager.setState(['agents', agentId, 'status'], status);
        this.eventBus.emit('agent_status_processed', payload, 'AgentBridge');
    };
    AgentBridge.prototype.sendMessageToAgent = function (agentId, content) {
        return __awaiter(this, void 0, void 0, function () {
            var message, error_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        message = MessageFactory.createTextMessage(content, { agentId: agentId });
                        return [4 /*yield*/, this.communicationManager.sendMessage(message)];
                    case 1:
                        _b.sent();
                        return [2 /*return*/, { success: true, data: undefined }];
                    case 2:
                        error_1 = _b.sent();
                        this.logger.error('Failed to send message to agent', error_1);
                        return [2 /*return*/, {
                                success: false,
                                error: {
                                    code: 'AGENT_MESSAGE_FAILED',
                                    message: 'Failed to send message to agent',
                                    details: error_1
                                }
                            }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    AgentBridge.prototype.getAgentConfig = function (agentId) {
        return __awaiter(this, void 0, void 0, function () {
            var config;
            return __generator(this, function (_b) {
                try {
                    config = this.stateManager.getState(['agents', agentId, 'config']);
                    if (!config) {
                        throw new Error('Agent config not found');
                    }
                    return [2 /*return*/, { success: true, data: config }];
                }
                catch (error) {
                    this.logger.error('Failed to get agent config', error);
                    return [2 /*return*/, {
                            success: false,
                            error: {
                                code: 'AGENT_CONFIG_NOT_FOUND',
                                message: 'Failed to get agent configuration',
                                details: error
                            }
                        }];
                }
                return [2 /*return*/];
            });
        });
    };
    AgentBridge.prototype.updateAgentStatus = function (agentId, status) {
        return __awaiter(this, void 0, void 0, function () {
            var error_2;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.communicationManager.send({
                                type: 'update_agent_status',
                                payload: { agentId: agentId, status: status }
                            })];
                    case 1:
                        _b.sent();
                        return [2 /*return*/, { success: true, data: undefined }];
                    case 2:
                        error_2 = _b.sent();
                        this.logger.error('Failed to update agent status', error_2);
                        return [2 /*return*/, {
                                success: false,
                                error: {
                                    code: 'AGENT_STATUS_UPDATE_FAILED',
                                    message: 'Failed to update agent status',
                                    details: error_2
                                }
                            }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    AgentBridge.prototype.getAgentStatus = function (agentId) {
        return this.stateManager.getState(['agents', agentId, 'status']) || AgentStatus.OFFLINE;
    };
    AgentBridge.prototype.subscribeToAgentMessages = function (agentId, callback) {
        return this.eventBus.on('agent_message', function (event) {
            var _a;
            if (((_a = event.payload.metadata) === null || _a === void 0 ? void 0 : _a.agentId) === agentId) {
                callback(event.payload);
            }
        });
    };
    AgentBridge.prototype.subscribeToAgentStatus = function (agentId, callback) {
        return this.stateManager.subscribe(['agents', agentId, 'status'], callback);
    };
    return AgentBridge;
}());
export { AgentBridge };
