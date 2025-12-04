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
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkspaceManager = WorkspaceManager;
import react_1 from 'react';
import EnhancedChatBubble_1 from '../chat/EnhancedChatBubble';
import ui_1 from '../ui';
import agent_llm_1 from '../../services/llm/agent-llm';
function WorkspaceManager(_a) {
    var _this = this;
    var workspace = _a.workspace, user = _a.user;
    var _b = (0, react_1.useState)(null), activeThread = _b[0], setActiveThread = _b[1];
    var _c = (0, react_1.useState)(''), message = _c[0], setMessage = _c[1];
    var handleSendMessage = (0, react_1.useCallback)(function () { return __awaiter(_this, void 0, void 0, function () {
        var newMessage, updatedMessages, activeAgent, agentLLM, response, agentMessage_1, error_1, errorMessage_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!message.trim() || !activeThread)
                        return [2 /*return*/];
                    newMessage = {
                        id: crypto.randomUUID(),
                        content: message.trim(),
                        timestamp: new Date(),
                        sender: {
                            id: user.id,
                            type: 'user',
                            name: user.name,
                        },
                        metadata: {
                            workspaceId: workspace.id,
                            threadId: activeThread.id,
                            llmProvider: workspace.llmConfig.defaultProvider,
                        },
                    };
                    updatedMessages = __spreadArray(__spreadArray([], activeThread.messages, true), [newMessage], false);
                    setActiveThread(function (prev) { return (Object.assign(Object.assign({}, prev), { messages: updatedMessages })); });
                    setMessage('');
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    activeAgent = workspace.agents[0];
                    agentLLM = agent_llm_1.AgentLLMService.getInstance();
                    return [4 /*yield*/, agentLLM.processAgentMessage(activeAgent, newMessage, updatedMessages)];
                case 2:
                    response = _a.sent();
                    agentMessage_1 = {
                        id: crypto.randomUUID(),
                        content: response.content,
                        timestamp: new Date(),
                        sender: {
                            id: activeAgent.id,
                            type: 'agent',
                            name: activeAgent.name,
                        },
                        metadata: Object.assign({ workspaceId: workspace.id, threadId: activeThread.id, llmProvider: activeAgent.llmConfig.provider }, response.metadata),
                    };
                    setActiveThread(function (prev) { return (Object.assign(Object.assign({}, prev), { messages: __spreadArray(__spreadArray([], prev.messages, true), [agentMessage_1], false) })); });
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _a.sent();
                    console.error('Error processing message:', error_1);
                    errorMessage_1 = {
                        id: crypto.randomUUID(),
                        content: 'Sorry, I encountered an error processing your message.',
                        timestamp: new Date(),
                        sender: {
                            id: 'system',
                            type: 'system',
                            name: 'System',
                        },
                        metadata: {
                            workspaceId: workspace.id,
                            threadId: activeThread.id,
                            llmProvider: workspace.llmConfig.defaultProvider,
                            error: true,
                        },
                    };
                    setActiveThread(function (prev) { return (Object.assign(Object.assign({}, prev), { messages: __spreadArray(__spreadArray([], prev.messages, true), [errorMessage_1], false) })); });
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); }, [message, activeThread, user, workspace]);
    return (_jsxs("div", { className: "flex h-full", children: [_jsxs("div", { className: "w-64 border-r border-gray-200 dark:border-gray-700 p-4", children: [_jsx("h2", { className: "text-lg font-semibold mb-4", children: "Threads" }), workspace.threads.map(function (thread) { return (_jsx(ui_1.Button, { variant: (activeThread === null || activeThread === void 0 ? void 0 : activeThread.id) === thread.id ? 'primary' : 'secondary', onClick: function () { return setActiveThread(thread); }, className: "w-full mb-2", children: thread.name }, thread.id)); })] }), _jsx("div", { className: "flex-1 flex flex-col", children: activeThread ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "flex-1 overflow-y-auto p-4", children: activeThread.messages.map(function (message) { return (_jsx(EnhancedChatBubble_1.EnhancedChatBubble, { message: message, agents: workspace.agents, workspace: workspace }, message.id)); }) }), _jsx("div", { className: "p-4 border-t border-gray-200 dark:border-gray-700", children: _jsxs("div", { className: "flex gap-2", children: [_jsx("input", { type: "text", value: message, onChange: function (e) { return setMessage(e.target.value); }, className: "flex-1 rounded-lg border border-gray-300 dark:border-gray-600 p-2", placeholder: "Type your message..." }), _jsx(ui_1.Button, { onClick: handleSendMessage, children: "Send" })] }) })] })) : (_jsx("div", { className: "flex-1 flex items-center justify-center", children: _jsxs(ui_1.Card, { className: "p-6", children: [_jsx("h3", { className: "text-lg font-semibold mb-2", children: "Select a Thread" }), _jsx("p", { className: "text-gray-600 dark:text-gray-400", children: "Choose a thread from the sidebar to start chatting" })] }) })) })] }));
}
