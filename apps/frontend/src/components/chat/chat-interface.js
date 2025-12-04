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
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatInterface = ChatInterface;
import react_1 from 'react';
import card_1 from './ui/card';
import input_1 from './ui/input';
import button_1 from './ui/button';
import scroll_area_1 from './ui/scroll-area';
import SocketContext_1 from '../services/SocketContext';
import theme_context_1 from '../contexts/theme-context';
import useMessages_1 from '../hooks/useMessages';
import useAgents_1 from '../hooks/useAgents';
import EnhancedChatBubble_1 from './chat/EnhancedChatBubble';
import typing_indicator_1 from './typing-indicator';
import agent_selector_1 from './agent-selector';
import message_utils_1 from '../utils/message-utils';
function ChatInterface() {
    var _this = this;
    var _a;
    var _b = (0, react_1.useState)(''), input = _b[0], setInput = _b[1];
    var scrollRef = (0, react_1.useRef)(null);
    var isConnected = (0, SocketContext_1.useSocket)().isConnected;
    var theme = (0, theme_context_1.useTheme)().theme;
    var _c = (0, useAgents_1.useAgents)(), agents = _c.agents, selectedAgent = _c.selectedAgent, conversationId = _c.conversationId, selectAgent = _c.selectAgent, resetConversation = _c.clearConversation;
    var _d = (0, useMessages_1.useMessages)(selectedAgent, conversationId), messages = _d.messages, isTyping = _d.isTyping, sendMessage = _d.sendMessage, resetMessages = _d.clearMessages, loadMessages = _d.loadMessages;
    (0, react_1.useEffect)(function () {
        if (conversationId) {
            loadMessages(conversationId);
        }
    }, [conversationId]);
    (0, react_1.useEffect)(function () {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);
    var handleSendMessage = function () { return __awaiter(_this, void 0, void 0, function () {
        var success;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!(0, message_utils_1.validateMessage)(input)) return [3 /*break*/, 2];
                    return [4 /*yield*/, sendMessage(input)];
                case 1:
                    success = _b.sent();
                    if (success) {
                        setInput('');
                    }
                    _b.label = 2;
                case 2: return [2 /*return*/];
            }
        });
    }); };
    var handleKeyPress = function (e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };
    var handleClearConversation = function () { return __awaiter(_this, void 0, void 0, function () {
        var success;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, resetMessages()];
                case 1:
                    success = _b.sent();
                    if (success) {
                        resetConversation();
                    }
                    return [2 /*return*/];
            }
        });
    }); };
    return (_jsxs(card_1.Card, { className: "w-full min-h-[600px] max-h-screen flex flex-col bg-white dark:bg-neutral-900 shadow-lg", children: [_jsx(card_1.CardHeader, { className: "border-b border-neutral-200 dark:border-neutral-800", children: _jsx("div", { className: "flex items-center justify-between", children: _jsxs("div", { className: "flex items-center gap-4", children: [_jsx(agent_selector_1.AgentSelector, { agents: agents, selectedAgent: selectedAgent, onSelect: selectAgent }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "w-2 h-2 rounded-full ".concat(isConnected ? 'bg-green-500' : 'bg-red-500') }), _jsx("span", { className: "text-sm text-neutral-600 dark:text-neutral-400", children: isConnected ? 'Connected' : 'Disconnected' })] }), _jsx(button_1.Button, { variant: "outline", size: "sm", onClick: handleClearConversation, disabled: !selectedAgent, children: "Clear Chat" })] }) }) }), _jsxs(card_1.CardContent, { className: "flex-grow flex flex-col p-4", children: [_jsx(scroll_area_1.ScrollArea, { className: "flex-grow pr-4", children: _jsxs("div", { className: "space-y-4", children: [messages.map(function (message) {
                                    var _a;
                                    return (_jsx(EnhancedChatBubble_1.EnhancedChatBubble, { message: {
                                            id: message.id,
                                            content: message.content,
                                            timestamp: message.timestamp,
                                            sender: {
                                                id: message.sender === 'User' ? 'user' : message.agentId || 'system',
                                                type: message.sender === 'User' ? 'user' : 'agent',
                                                name: message.sender === 'User' ? 'User' : (_a = agents.find(function (a) { return a.id === message.agentId; })) === null || _a === void 0 ? void 0 : _a.name,
                                            },
                                            metadata: {
                                                agentId: message.agentId,
                                                workspaceId: '',
                                                llmProvider: '',
                                            },
                                        }, agents: agents, workspace: null }, message.id));
                                }), isTyping && _jsx(typing_indicator_1.TypingIndicator, {}), _jsx("div", { ref: scrollRef })] }) }), _jsxs("div", { className: "flex items-center gap-2 mt-4", children: [_jsx(input_1.Input, { value: input, onChange: function (e) { return setInput(e.target.value); }, onKeyPress: handleKeyPress, placeholder: selectedAgent
                                    ? "Message ".concat((_a = agents.find(function (a) { return a.id === selectedAgent; })) === null || _a === void 0 ? void 0 : _a.name, "...")
                                    : "Select an agent to start chatting...", className: "flex-grow", disabled: !selectedAgent || !isConnected }), _jsx(button_1.Button, { onClick: handleSendMessage, disabled: !(0, message_utils_1.validateMessage)(input) || !isConnected || !selectedAgent, className: "px-6", children: "Send" })] })] })] }));
}
