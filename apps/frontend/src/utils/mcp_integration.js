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
exports.MCPWorkflowAdapter = void 0;
import logger_1 from './logger';
import messages_1 from './messages';
import output_formatter_1 from './output_formatter';
import workflow_manager_1 from './workflow_manager';
import enhanced_communication_1 from './enhanced_communication';
var logger = new logger_1.Logger('MCPWorkflowAdapter');
var MCPWorkflowAdapter = /** @class */ (function () {
    function MCPWorkflowAdapter() {
        this.commBus = new enhanced_communication_1.EnhancedCommunicationBus();
        this.workflowManager = new workflow_manager_1.WorkflowManager(this.commBus);
        this.messageThread = new messages_1.MessageThread();
        this.outputFormatter = new output_formatter_1.OutputFormatter();
        this.activeAgents = new Map();
        this.tools = new Map();
        this.registerMcpTools();
    }
    MCPWorkflowAdapter.prototype.registerMcpTools = function () {
        var createWorkflowTool = (0, messages_1.createTool)({
            name: "create_workflow",
            description: "Create a new workflow from a template",
            properties: {
                template_name: {
                    type: "string",
                    description: "Name of the workflow template to use"
                },
                parameters: {
                    type: "object",
                    description: "Parameters for the workflow"
                }
            },
            required: ["template_name"]
        });
        var cancelWorkflowTool = (0, messages_1.createTool)({
            name: "cancel_workflow",
            description: "Cancel a running workflow",
            properties: {
                workflow_id: {
                    type: "string",
                    description: "ID of the workflow to cancel"
                }
            },
            required: ["workflow_id"]
        });
        var getStatusTool = (0, messages_1.createTool)({
            name: "get_workflow_status",
            description: "Get the current status of a workflow",
            properties: {
                workflow_id: {
                    type: "string",
                    description: "ID of the workflow to check"
                }
            },
            required: ["workflow_id"]
        });
        this.tools.set("create_workflow", createWorkflowTool);
        this.tools.set("cancel_workflow", cancelWorkflowTool);
        this.tools.set("get_workflow_status", getStatusTool);
    };
    MCPWorkflowAdapter.prototype.registerAgent = function (agent) {
        return __awaiter(this, void 0, void 0, function () {
            var _i, _a, capability, tool;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        this.activeAgents.set(agent.name, agent);
                        return [4 /*yield*/, agent.start()];
                    case 1:
                        _b.sent();
                        for (_i = 0, _a = agent.capabilities; _i < _a.length; _i++) {
                            capability = _a[_i];
                            tool = (0, messages_1.createTool)({
                                name: "use_".concat(capability),
                                description: "Use the ".concat(capability, " capability"),
                                properties: {
                                    parameters: {
                                        type: "object",
                                        description: "Parameters for ".concat(capability)
                                    }
                                }
                            });
                            this.tools.set("use_".concat(capability), tool);
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    MCPWorkflowAdapter.prototype.handleToolUse = function (toolUse) {
        return __awaiter(this, void 0, void 0, function () {
            var toolName, toolInput, workflowId, success, status_1, capability_1, agent, result, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        toolName = toolUse.name;
                        toolInput = toolUse.input;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 9, , 10]);
                        if (!(toolName === "create_workflow")) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.workflowManager.createWorkflow(toolInput.template_name, toolInput.parameters || {})];
                    case 2:
                        workflowId = _a.sent();
                        return [2 /*return*/, {
                                tool_use_id: toolUse.id,
                                content: this.outputFormatter.formatJson({
                                    workflow_id: workflowId,
                                    status: "created"
                                })
                            }];
                    case 3:
                        if (!(toolName === "cancel_workflow")) return [3 /*break*/, 5];
                        return [4 /*yield*/, this.workflowManager.cancelWorkflow(toolInput.workflow_id)];
                    case 4:
                        success = _a.sent();
                        return [2 /*return*/, {
                                tool_use_id: toolUse.id,
                                content: this.outputFormatter.formatJson({
                                    success: success
                                })
                            }];
                    case 5:
                        if (toolName === "get_workflow_status") {
                            status_1 = this.workflowManager.getWorkflowStatus(toolInput.workflow_id);
                            return [2 /*return*/, {
                                    tool_use_id: toolUse.id,
                                    content: this.outputFormatter.formatJson(status_1)
                                }];
                        }
                        if (!toolName.startsWith("use_")) return [3 /*break*/, 8];
                        capability_1 = toolName.slice(4);
                        agent = Array.from(this.activeAgents.values())
                            .find(function (a) { return a.capabilities.includes(capability_1); });
                        if (!agent) return [3 /*break*/, 7];
                        return [4 /*yield*/, agent.executeTask(capability_1, toolInput.parameters || {})];
                    case 6:
                        result = _a.sent();
                        return [2 /*return*/, {
                                tool_use_id: toolUse.id,
                                content: this.outputFormatter.formatJson(result)
                            }];
                    case 7: throw new Error("No agent found with capability: ".concat(capability_1));
                    case 8: throw new Error("Unknown tool: ".concat(toolName));
                    case 9:
                        error_1 = _a.sent();
                        logger.error("Error handling tool use: ".concat(error_1.message));
                        return [2 /*return*/, {
                                tool_use_id: toolUse.id,
                                content: this.outputFormatter.formatJson({
                                    error: error_1.message
                                })
                            }];
                    case 10: return [2 /*return*/];
                }
            });
        });
    };
    MCPWorkflowAdapter.prototype.processMessage = function (message) {
        return __awaiter(this, void 0, void 0, function () {
            var builder, response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.messageThread.addUserMessage({ text: message });
                        builder = new messages_1.MessageBuilder();
                        return [4 /*yield*/, this.generateResponse(message)];
                    case 1:
                        response = _a.sent();
                        this.messageThread.addAssistantMessage({
                            text: response.text,
                            toolUses: response.toolUses || []
                        });
                        return [2 /*return*/, response.text || ""];
                }
            });
        });
    };
    MCPWorkflowAdapter.prototype.generateResponse = function (message) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, {
                        text: "I understand your request. Let me help you with that.",
                        toolUses: []
                    }];
            });
        });
    };
    MCPWorkflowAdapter.prototype.cleanup = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Promise.all(Array.from(this.activeAgents.values())
                            .map(function (agent) { return agent.stop(); }))];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    return MCPWorkflowAdapter;
}());
exports.MCPWorkflowAdapter = MCPWorkflowAdapter;
