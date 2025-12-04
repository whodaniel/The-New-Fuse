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
import { useState, useEffect, useRef, useCallback } from 'react';
import { A2AProvider, useA2AContext, useA2AAgents, useA2AMessages, useA2AConversations } from '@the-new-fuse/a2a-react';
import { v4 as uuidv4 } from 'uuid';
import { AlertCircle, Send } from 'lucide-react';
// Icons (same as before)
var SystemIcon = function () { return _jsx(AlertCircle, { className: "h-4 w-4" }); };
var cn = function () {
    var classes = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        classes[_i] = arguments[_i];
    }
    return classes.filter(Boolean).join(' ');
};
// A2A Configuration
var A2A_CONFIG = {
    url: process.env.REACT_APP_A2A_WEBSOCKET_URL || 'ws://localhost:3001',
    agentId: uuidv4(), // Generate unique agent ID for this session
};
// Enhanced MultiAgentChat with A2A integration
export default function MultiAgentChat() {
    return (_jsx(A2AProvider, { config: A2A_CONFIG, autoConnect: true, autoRegister: true, agentRegistration: {
            name: 'Web Interface Agent',
            type: 'COMMUNICATOR',
            version: '1.0.0',
            description: 'Web interface for multi-agent communication',
            capabilities: [
                {
                    id: 'ui-interaction',
                    name: 'UI Interaction',
                    description: 'Handle user interface interactions',
                    version: '1.0.0'
                },
                {
                    id: 'message-display',
                    name: 'Message Display',
                    description: 'Display messages and conversations',
                    version: '1.0.0'
                }
            ]
        }, children: _jsx(EnhancedMultiAgentChatUI, {}) }));
}
function EnhancedMultiAgentChatUI() {
    var _this = this;
    var _a;
    var _b = useA2AContext(), connectionState = _b.connectionState, connect = _b.connect, disconnect = _b.disconnect;
    var _c = useA2AAgents(), agents = _c.agents, refreshAgents = _c.refreshAgents;
    var _d = useA2AMessages(), messages = _d.messages, sendMessage = _d.sendMessage, broadcast = _d.broadcast;
    var _e = useA2AConversations(), conversations = _e.conversations, joinConversation = _e.joinConversation;
    var _f = useState(''), inputValue = _f[0], setInputValue = _f[1];
    var _g = useState(null), selectedAgent = _g[0], setSelectedAgent = _g[1];
    var _h = useState(null), currentConversation = _h[0], setCurrentConversation = _h[1];
    var _j = useState('direct'), mode = _j[0], setMode = _j[1];
    var _k = useState(false), isAutomating = _k[0], setIsAutomating = _k[1];
    var messagesEndRef = useRef(null);
    useEffect(function () {
        var _a;
        (_a = messagesEndRef.current) === null || _a === void 0 ? void 0 : _a.scrollIntoView({ behavior: "smooth" });
    }, [messages]);
    // Auto-refresh agents periodically
    useEffect(function () {
        if (connectionState.authenticated) {
            var interval_1 = setInterval(refreshAgents, 30000); // Refresh every 30 seconds
            return function () { return clearInterval(interval_1); };
        }
    }, [connectionState.authenticated, refreshAgents]);
    var handleSendMessage = useCallback(function () { return __awaiter(_this, void 0, void 0, function () {
        var messagePayload, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!inputValue.trim() || !connectionState.authenticated)
                        return [2 /*return*/];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 8, , 9]);
                    messagePayload = {
                        text: inputValue,
                        sender: 'User',
                        timestamp: new Date().toISOString()
                    };
                    if (!(mode === 'direct' && selectedAgent)) return [3 /*break*/, 3];
                    // Send direct message to selected agent
                    return [4 /*yield*/, sendMessage({
                            toAgent: selectedAgent,
                            type: A2AMessageType.REQUEST,
                            priority: A2APriority.MEDIUM,
                            conversationId: currentConversation || undefined,
                            payload: messagePayload
                        })];
                case 2:
                    // Send direct message to selected agent
                    _a.sent();
                    return [3 /*break*/, 7];
                case 3:
                    if (!(mode === 'broadcast')) return [3 /*break*/, 5];
                    // Broadcast to all agents
                    return [4 /*yield*/, broadcast(messagePayload, {
                            topic: 'user-broadcast'
                        })];
                case 4:
                    // Broadcast to all agents
                    _a.sent();
                    return [3 /*break*/, 7];
                case 5:
                    if (!(mode === 'conversation' && currentConversation)) return [3 /*break*/, 7];
                    // Send to conversation
                    return [4 /*yield*/, sendMessage({
                            type: A2AMessageType.NOTIFICATION,
                            priority: A2APriority.MEDIUM,
                            conversationId: currentConversation,
                            payload: messagePayload
                        })];
                case 6:
                    // Send to conversation
                    _a.sent();
                    _a.label = 7;
                case 7:
                    setInputValue('');
                    return [3 /*break*/, 9];
                case 8:
                    error_1 = _a.sent();
                    // Handle error - could use a state variable to show error in UI
                    setInputValue(function (prev) { return "".concat(prev, " (Failed to send)"); });
                    return [3 /*break*/, 9];
                case 9: return [2 /*return*/];
            }
        });
    }); }, [inputValue, mode, selectedAgent, currentConversation, connectionState.authenticated, sendMessage, broadcast]);
    var handleAutomateAgentCreation = useCallback(function () { return __awaiter(_this, void 0, void 0, function () {
        var apiUrl, agents_2, _i, agents_1, agent, response, conversationId, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setIsAutomating(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 10, 11, 12]);
                    apiUrl = A2A_CONFIG.url.replace('ws://', 'http://').replace(':3001', ':3000');
                    agents_2 = [
                        {
                            agentId: uuidv4(),
                            name: 'Alice Assistant',
                            type: 'ASSISTANT',
                            version: '1.0.0',
                            description: 'Helpful assistant agent',
                            capabilities: [
                                {
                                    id: 'general-assistance',
                                    name: 'General Assistance',
                                    description: 'Provide general help and support',
                                    version: '1.0.0'
                                }
                            ]
                        },
                        {
                            agentId: uuidv4(),
                            name: 'Bob Analyzer',
                            type: 'ANALYZER',
                            version: '1.0.0',
                            description: 'Data analysis agent',
                            capabilities: [
                                {
                                    id: 'data-analysis',
                                    name: 'Data Analysis',
                                    description: 'Analyze data and generate insights',
                                    version: '1.0.0'
                                }
                            ]
                        }
                    ];
                    _i = 0, agents_1 = agents_2;
                    _a.label = 2;
                case 2:
                    if (!(_i < agents_1.length)) return [3 /*break*/, 5];
                    agent = agents_1[_i];
                    return [4 /*yield*/, fetch("".concat(apiUrl, "/a2a/agents/register"), {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(agent)
                        })];
                case 3:
                    _a.sent();
                    _a.label = 4;
                case 4:
                    _i++;
                    return [3 /*break*/, 2];
                case 5: return [4 /*yield*/, fetch("".concat(apiUrl, "/a2a/conversations"), {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            initiator: agents_2[0].agentId,
                            participants: [agents_2[1].agentId],
                            topic: 'Automated Agent Collaboration'
                        })
                    })];
                case 6:
                    response = _a.sent();
                    return [4 /*yield*/, response.json()];
                case 7:
                    conversationId = (_a.sent()).conversationId;
                    setCurrentConversation(conversationId);
                    setMode('conversation');
                    // Refresh agents list
                    return [4 /*yield*/, refreshAgents()];
                case 8:
                    // Refresh agents list
                    _a.sent();
                    // Send welcome message
                    return [4 /*yield*/, broadcast({
                            type: 'automation_complete',
                            message: 'Automated agent setup completed! Two agents are ready for collaboration.',
                            conversationId: conversationId
                        }, {
                            topic: 'system-announcement'
                        })];
                case 9:
                    // Send welcome message
                    _a.sent();
                    return [3 /*break*/, 12];
                case 10:
                    error_2 = _a.sent();
                    console.error('Automation failed:', error_2);
                    return [3 /*break*/, 12];
                case 11:
                    setIsAutomating(false);
                    return [7 /*endfinally*/];
                case 12: return [2 /*return*/];
            }
        });
    }); }, [broadcast, refreshAgents]);
    var handleCreateConversation = useCallback(function () { return __awaiter(_this, void 0, void 0, function () {
        var apiUrl, response, conversationId, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (agents.length < 2)
                        return [2 /*return*/];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 5, , 6]);
                    apiUrl = A2A_CONFIG.url.replace('ws://', 'http://').replace(':3001', ':3000');
                    return [4 /*yield*/, fetch("".concat(apiUrl, "/a2a/conversations"), {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                initiator: A2A_CONFIG.agentId,
                                participants: agents.slice(0, 3).map(function (a) { return a.agentId; }), // Include up to 3 agents
                                topic: 'Multi-Agent Discussion'
                            })
                        })];
                case 2:
                    response = _a.sent();
                    return [4 /*yield*/, response.json()];
                case 3:
                    conversationId = (_a.sent()).conversationId;
                    setCurrentConversation(conversationId);
                    setMode('conversation');
                    // Join the conversation
                    return [4 /*yield*/, joinConversation(conversationId)];
                case 4:
                    // Join the conversation
                    _a.sent();
                    return [3 /*break*/, 6];
                case 5:
                    error_3 = _a.sent();
                    console.error('Failed to create conversation:', error_3);
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/];
            }
        });
    }); }, [agents, joinConversation]);
    // Connection status component
    var ConnectionStatus = function () { return (_jsxs("div", { className: cn('flex items-center gap-2 px-3 py-1 rounded-full text-sm', connectionState.connected
            ? connectionState.authenticated
                ? 'bg-green-100 text-green-800'
                : 'bg-yellow-100 text-yellow-800'
            : 'bg-red-100 text-red-800'), children: [_jsx("div", { className: cn('w-2 h-2 rounded-full', connectionState.connected
                    ? connectionState.authenticated
                        ? 'bg-green-500'
                        : 'bg-yellow-500'
                    : 'bg-red-500') }), connectionState.connected
                ? connectionState.authenticated
                    ? 'Connected & Authenticated'
                    : 'Connected (Authenticating...)'
                : connectionState.connecting
                    ? 'Connecting...'
                    : 'Disconnected'] })); };
    // Enhanced message bubble
    var MessageBubble = function (_a) {
        var _b, _c, _d, _e;
        var msg = _a.msg;
        var isUser = ((_b = msg.payload) === null || _b === void 0 ? void 0 : _b.sender) === 'User';
        var isSystem = msg.type === A2AMessageType.NOTIFICATION && ((_c = msg.payload) === null || _c === void 0 ? void 0 : _c.type) === 'system';
        var bubbleClass = cn('p-4 rounded-xl shadow-md max-w-lg', isUser && 'bg-blue-500 text-white ml-auto', isSystem && 'bg-gray-500 text-white text-center text-xs italic mx-auto', !isUser && !isSystem && 'bg-white dark:bg-gray-700 mr-auto');
        var senderName = isUser ? 'You' :
            ((_d = agents.find(function (a) { return a.agentId === msg.fromAgent; })) === null || _d === void 0 ? void 0 : _d.name) || msg.fromAgent;
        return (_jsx("div", { className: cn('flex w-full', isUser ? 'justify-end' : 'justify-start'), children: _jsxs("div", { className: bubbleClass, children: [!isUser && !isSystem && (_jsx("div", { className: "font-bold mb-1 text-sm opacity-75", children: senderName })), _jsx("p", { className: "whitespace-pre-wrap break-words", children: ((_e = msg.payload) === null || _e === void 0 ? void 0 : _e.text) || JSON.stringify(msg.payload, null, 2) }), _jsx("div", { className: "text-xs opacity-50 mt-1", children: new Date(msg.timestamp).toLocaleTimeString() })] }) }));
    };
    if (!connectionState.connected && !connectionState.connecting) {
        return (_jsxs("div", { className: "flex h-screen w-full flex-col items-center justify-center bg-gray-900 text-white", children: [_jsx("div", { className: "w-20 h-20 border-8 border-dashed rounded-full animate-spin border-blue-500 mb-6" }), _jsx("h1", { className: "text-3xl font-bold mb-2", children: "A2A Multi-Agent Chat" }), _jsx("p", { className: "text-gray-400 mb-4", children: "Connecting to A2A protocol..." }), _jsx("button", { onClick: connect, className: "px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600", children: "Retry Connection" })] }));
    }
    return (_jsxs("div", { className: "grid grid-rows-[auto_1fr_auto] h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans", children: [isAutomating && (_jsxs("div", { className: "fixed inset-0 bg-black bg-opacity-75 flex flex-col justify-center items-center z-[100]", children: [_jsx("div", { className: "w-16 h-16 border-8 border-dashed rounded-full animate-spin border-blue-500" }), _jsx("p", { className: "text-white text-xl mt-4", children: "Setting up A2A Agents..." })] })), _jsxs("header", { className: "bg-white dark:bg-gray-800 shadow-sm p-3 z-10", children: [_jsxs("div", { className: "flex items-center gap-4 pb-2 flex-wrap", children: [_jsx(ConnectionStatus, {}), _jsx("button", { onClick: handleAutomateAgentCreation, disabled: isAutomating || !connectionState.authenticated, className: "px-3 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 disabled:bg-purple-400", children: "\uD83D\uDE80 Auto-Setup A2A" }), _jsx("button", { onClick: handleCreateConversation, disabled: agents.length < 2, className: "px-3 py-2 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 disabled:bg-green-400", children: "Start Conversation" }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-sm font-medium", children: "Mode:" }), _jsxs("select", { value: mode, onChange: function (e) { return setMode(e.target.value); }, "aria-label": "Select Mode", className: "px-2 py-1 border rounded dark:bg-gray-700 dark:border-gray-600 text-sm", children: [_jsx("option", { value: "direct", children: "Direct Message" }), _jsx("option", { value: "broadcast", children: "Broadcast" }), _jsx("option", { value: "conversation", children: "Conversation" })] })] }), mode === 'direct' && (_jsxs("select", { value: selectedAgent || '', onChange: function (e) { return setSelectedAgent(e.target.value); }, "aria-label": "Select Agent", className: "px-2 py-1 border rounded dark:bg-gray-700 dark:border-gray-600 text-sm", children: [_jsx("option", { value: "", children: "Select Agent" }), agents.map(function (agent) { return (_jsxs("option", { value: agent.agentId, children: [agent.name, " (", agent.type, ")"] }, agent.agentId)); })] })), _jsxs("div", { className: "text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded", children: [agents.length, " agent(s) connected"] })] }), _jsx("div", { className: "flex items-center gap-2 mt-2 flex-wrap", children: agents.map(function (agent) { return (_jsxs("div", { className: "flex items-center gap-2 bg-gray-200 dark:bg-gray-700 rounded-lg px-2 py-1", children: [_jsx("span", { className: "text-sm", children: agent.name }), _jsxs("span", { className: "text-xs opacity-75", children: ["(", agent.type, ")"] }), _jsx("div", { className: cn('w-2 h-2 rounded-full', 'bg-green-500' // Assume online for now
                                    ) })] }, agent.agentId)); }) }), conversations.length > 0 && (_jsxs("div", { className: "mt-2", children: [_jsx("div", { className: "text-sm font-medium mb-1", children: "Active Conversations:" }), _jsx("div", { className: "flex gap-2 flex-wrap", children: conversations.map(function (conv) { return (_jsxs("button", { onClick: function () {
                                        setCurrentConversation(conv.id);
                                        setMode('conversation');
                                    }, className: cn('px-2 py-1 text-xs rounded border', currentConversation === conv.id
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-gray-100 dark:bg-gray-700'), children: ["Conv ", conv.id.slice(-6), " (", conv.participantCount, " agents)"] }, conv.id)); }) })] }))] }), _jsxs("main", { className: "p-4 overflow-y-auto flex flex-col space-y-4", children: [messages.map(function (msg) { return (_jsx(MessageBubble, { msg: msg }, msg.id)); }), messages.length === 0 && connectionState.authenticated && (_jsxs("div", { className: "text-center text-gray-500 mt-8", children: [_jsx(SystemIcon, {}), _jsx("p", { className: "mt-2", children: "Welcome to A2A Multi-Agent Chat!" }), _jsx("p", { className: "text-sm", children: "Connect agents and start communicating." })] })), _jsx("div", { ref: messagesEndRef })] }), _jsx("footer", { className: "bg-white dark:bg-gray-800 shadow-inner p-2", children: _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("div", { className: "flex-1 relative", children: _jsx("input", { type: "text", value: inputValue, onChange: function (e) { return setInputValue(e.target.value); }, onKeyPress: function (e) { return e.key === 'Enter' && handleSendMessage(); }, placeholder: mode === 'direct'
                                    ? selectedAgent
                                        ? "Message ".concat((_a = agents.find(function (a) { return a.agentId === selectedAgent; })) === null || _a === void 0 ? void 0 : _a.name, "...")
                                        : "Select an agent first..."
                                    : mode === 'broadcast'
                                        ? "Broadcast to all agents..."
                                        : currentConversation
                                            ? "Message conversation..."
                                            : "Start or join a conversation...", disabled: !connectionState.authenticated || (mode === 'direct' && !selectedAgent) || (mode === 'conversation' && !currentConversation), className: "w-full p-2 border bg-transparent border-gray-300 dark:border-gray-600 rounded-full focus:outline-none focus:border-blue-500 disabled:opacity-50" }) }), _jsx("button", { onClick: handleSendMessage, disabled: !inputValue.trim() || !connectionState.authenticated || (mode === 'direct' && !selectedAgent) || (mode === 'conversation' && !currentConversation), "aria-label": "Send message", className: "p-3 bg-blue-500 text-white rounded-full disabled:bg-gray-400 hover:bg-blue-600", children: _jsx(Send, { className: "h-6 w-6" }) })] }) })] }));
}
