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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useRef } from 'react';
import { Send, Paperclip, Smile, MoreVertical, Users, Settings, Search, Hash, Lock, Globe, Bot, User, Clock, CheckCheck } from 'lucide-react';
var WorkspaceChat = function () {
    var _a, _b;
    var _c = useState([]), messages = _c[0], setMessages = _c[1];
    var _d = useState(''), newMessage = _d[0], setNewMessage = _d[1];
    var _e = useState(null), workspace = _e[0], setWorkspace = _e[1];
    var _f = useState(true), loading = _f[0], setLoading = _f[1];
    var _g = useState(false), isTyping = _g[0], setIsTyping = _g[1];
    var _h = useState(null), selectedAgent = _h[0], setSelectedAgent = _h[1];
    var messagesEndRef = useRef(null);
    var fileInputRef = useRef(null);
    useEffect(function () {
        fetchWorkspaceData();
        fetchMessages();
    }, []);
    useEffect(function () {
        scrollToBottom();
    }, [messages]);
    var fetchWorkspaceData = function () { return __awaiter(void 0, void 0, void 0, function () {
        var response, data, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 5, , 6]);
                    return [4 /*yield*/, fetch('/api/workspaces/current', {
                            headers: {
                                'Authorization': "Bearer ".concat(localStorage.getItem('token')),
                                'Content-Type': 'application/json'
                            }
                        })];
                case 1:
                    response = _a.sent();
                    if (!response.ok) return [3 /*break*/, 3];
                    return [4 /*yield*/, response.json()];
                case 2:
                    data = _a.sent();
                    setWorkspace(data);
                    return [3 /*break*/, 4];
                case 3:
                    // Mock data for development
                    setWorkspace({
                        id: '1',
                        name: 'Product Development',
                        description: 'Collaborative workspace for product development team',
                        type: 'private',
                        members: [
                            {
                                id: '1',
                                name: 'John Doe',
                                avatar: '/avatars/john.jpg',
                                role: 'owner',
                                status: 'online'
                            },
                            {
                                id: '2',
                                name: 'Jane Smith',
                                avatar: '/avatars/jane.jpg',
                                role: 'admin',
                                status: 'online'
                            },
                            {
                                id: '3',
                                name: 'Mike Johnson',
                                role: 'member',
                                status: 'away'
                            }
                        ],
                        agents: [
                            {
                                id: 'agent1',
                                name: 'Code Assistant',
                                type: 'Development',
                                status: 'active'
                            },
                            {
                                id: 'agent2',
                                name: 'Project Manager',
                                type: 'Management',
                                status: 'active'
                            }
                        ]
                    });
                    _a.label = 4;
                case 4: return [3 /*break*/, 6];
                case 5:
                    error_1 = _a.sent();
                    console.error('Error fetching workspace data:', error_1);
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/];
            }
        });
    }); };
    var fetchMessages = function () { return __awaiter(void 0, void 0, void 0, function () {
        var response, data, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 5, 6, 7]);
                    setLoading(true);
                    return [4 /*yield*/, fetch('/api/workspaces/1/messages', {
                            headers: {
                                'Authorization': "Bearer ".concat(localStorage.getItem('token')),
                                'Content-Type': 'application/json'
                            }
                        })];
                case 1:
                    response = _a.sent();
                    if (!response.ok) return [3 /*break*/, 3];
                    return [4 /*yield*/, response.json()];
                case 2:
                    data = _a.sent();
                    setMessages(data);
                    return [3 /*break*/, 4];
                case 3:
                    // Mock data for development
                    setMessages([
                        {
                            id: '1',
                            content: 'Welcome to the Product Development workspace! Let\'s collaborate on our latest project.',
                            sender: {
                                id: '1',
                                name: 'John Doe',
                                type: 'user'
                            },
                            timestamp: new Date(Date.now() - 3600000),
                            status: 'read'
                        },
                        {
                            id: '2',
                            content: 'I can help you with code reviews, documentation, and technical analysis. What would you like to work on?',
                            sender: {
                                id: 'agent1',
                                name: 'Code Assistant',
                                type: 'agent'
                            },
                            timestamp: new Date(Date.now() - 3000000),
                            status: 'read'
                        },
                        {
                            id: '3',
                            content: 'Great! I\'ve uploaded the latest design mockups for review.',
                            sender: {
                                id: '2',
                                name: 'Jane Smith',
                                type: 'user'
                            },
                            timestamp: new Date(Date.now() - 1800000),
                            status: 'read',
                            attachments: [
                                {
                                    id: 'att1',
                                    name: 'design-mockups.pdf',
                                    type: 'application/pdf',
                                    url: '/files/design-mockups.pdf'
                                }
                            ]
                        }
                    ]);
                    _a.label = 4;
                case 4: return [3 /*break*/, 7];
                case 5:
                    error_2 = _a.sent();
                    console.error('Error fetching messages:', error_2);
                    return [3 /*break*/, 7];
                case 6:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 7: return [2 /*return*/];
            }
        });
    }); };
    var sendMessage = function () { return __awaiter(void 0, void 0, void 0, function () {
        var message, response, sentMessage_1, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!newMessage.trim())
                        return [2 /*return*/];
                    message = {
                        id: Date.now().toString(),
                        content: newMessage,
                        sender: {
                            id: 'current-user',
                            name: 'You',
                            type: 'user'
                        },
                        timestamp: new Date(),
                        status: 'sending'
                    };
                    setMessages(function (prev) { return __spreadArray(__spreadArray([], prev, true), [message], false); });
                    setNewMessage('');
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 5, , 6]);
                    return [4 /*yield*/, fetch('/api/workspaces/1/messages', {
                            method: 'POST',
                            headers: {
                                'Authorization': "Bearer ".concat(localStorage.getItem('token')),
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                content: newMessage,
                                agentId: selectedAgent
                            })
                        })];
                case 2:
                    response = _a.sent();
                    if (!response.ok) return [3 /*break*/, 4];
                    return [4 /*yield*/, response.json()];
                case 3:
                    sentMessage_1 = _a.sent();
                    setMessages(function (prev) { return prev.map(function (msg) {
                        return msg.id === message.id ? __assign(__assign(__assign({}, msg), sentMessage_1), { status: 'sent' }) : msg;
                    }); });
                    // If agent is selected, simulate agent response
                    if (selectedAgent) {
                        setTimeout(function () {
                            setIsTyping(true);
                            setTimeout(function () {
                                var _a;
                                var agentResponse = {
                                    id: Date.now().toString() + '_agent',
                                    content: "I understand your message: \"".concat(newMessage, "\". How can I assist you further?"),
                                    sender: {
                                        id: selectedAgent,
                                        name: ((_a = workspace === null || workspace === void 0 ? void 0 : workspace.agents.find(function (a) { return a.id === selectedAgent; })) === null || _a === void 0 ? void 0 : _a.name) || 'Agent',
                                        type: 'agent'
                                    },
                                    timestamp: new Date(),
                                    status: 'sent'
                                };
                                setMessages(function (prev) { return __spreadArray(__spreadArray([], prev, true), [agentResponse], false); });
                                setIsTyping(false);
                            }, 2000);
                        }, 500);
                    }
                    _a.label = 4;
                case 4: return [3 /*break*/, 6];
                case 5:
                    error_3 = _a.sent();
                    console.error('Error sending message:', error_3);
                    setMessages(function (prev) { return prev.map(function (msg) {
                        return msg.id === message.id ? __assign(__assign({}, msg), { status: 'sent' }) : msg;
                    }); });
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/];
            }
        });
    }); };
    var handleKeyPress = function (e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };
    var handleFileUpload = function () {
        var _a;
        (_a = fileInputRef.current) === null || _a === void 0 ? void 0 : _a.click();
    };
    var scrollToBottom = function () {
        var _a;
        (_a = messagesEndRef.current) === null || _a === void 0 ? void 0 : _a.scrollIntoView({ behavior: 'smooth' });
    };
    var formatTime = function (date) {
        return new Intl.DateTimeFormat('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };
    var getStatusIcon = function (status) {
        switch (status) {
            case 'sending': return _jsx(Clock, { className: "w-3 h-3 text-gray-400" });
            case 'sent': return _jsx(CheckCheck, { className: "w-3 h-3 text-gray-400" });
            case 'delivered': return _jsx(CheckCheck, { className: "w-3 h-3 text-blue-500" });
            case 'read': return _jsx(CheckCheck, { className: "w-3 h-3 text-blue-500" });
            default: return null;
        }
    };
    if (loading) {
        return (_jsx("div", { className: "flex items-center justify-center min-h-screen", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" }), _jsx("p", { className: "text-gray-600 dark:text-gray-300", children: "Loading workspace..." })] }) }));
    }
    return (_jsxs("div", { className: "flex h-screen bg-gray-50 dark:bg-gray-900", children: [_jsxs("div", { className: "w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col", children: [_jsx("div", { className: "p-4 border-b border-gray-200 dark:border-gray-700", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center space-x-3", children: [_jsx("div", { className: "p-2 bg-blue-100 dark:bg-blue-900 rounded-lg", children: (workspace === null || workspace === void 0 ? void 0 : workspace.type) === 'private' ? (_jsx(Lock, { className: "w-5 h-5 text-blue-600 dark:text-blue-400" })) : (_jsx(Globe, { className: "w-5 h-5 text-blue-600 dark:text-blue-400" })) }), _jsxs("div", { children: [_jsx("h2", { className: "font-semibold text-gray-900 dark:text-white", children: workspace === null || workspace === void 0 ? void 0 : workspace.name }), _jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400", children: workspace === null || workspace === void 0 ? void 0 : workspace.description })] })] }), _jsx("button", { title: "Workspace Settings", className: "p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300", children: _jsx(Settings, { className: "w-4 h-4" }) })] }) }), _jsx("div", { className: "p-4 border-b border-gray-200 dark:border-gray-700", children: _jsxs("div", { className: "relative", children: [_jsx(Search, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" }), _jsx("input", { type: "text", placeholder: "Search messages...", className: "w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" })] }) }), _jsxs("div", { className: "flex-1 overflow-y-auto", children: [_jsxs("div", { className: "p-4", children: [_jsxs("h3", { className: "text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center", children: [_jsx(Users, { className: "w-4 h-4 mr-2" }), "Members (", workspace === null || workspace === void 0 ? void 0 : workspace.members.length, ")"] }), _jsx("div", { className: "space-y-2", children: workspace === null || workspace === void 0 ? void 0 : workspace.members.map(function (member) { return (_jsxs("div", { className: "flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700", children: [_jsxs("div", { className: "relative", children: [_jsx("div", { className: "w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center", children: _jsx(User, { className: "w-4 h-4 text-white" }) }), _jsx("div", { className: "absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 ".concat(member.status === 'online' ? 'bg-green-500' :
                                                                member.status === 'away' ? 'bg-yellow-500' : 'bg-gray-400') })] }), _jsxs("div", { className: "flex-1", children: [_jsx("p", { className: "text-sm font-medium text-gray-900 dark:text-white", children: member.name }), _jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400", children: member.role })] })] }, member.id)); }) })] }), _jsxs("div", { className: "p-4 border-t border-gray-200 dark:border-gray-700", children: [_jsxs("h3", { className: "text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center", children: [_jsx(Bot, { className: "w-4 h-4 mr-2" }), "AI Agents (", workspace === null || workspace === void 0 ? void 0 : workspace.agents.length, ")"] }), _jsx("div", { className: "space-y-2", children: workspace === null || workspace === void 0 ? void 0 : workspace.agents.map(function (agent) { return (_jsxs("div", { onClick: function () { return setSelectedAgent(selectedAgent === agent.id ? null : agent.id); }, className: "flex items-center space-x-3 p-2 rounded-lg cursor-pointer transition-colors ".concat(selectedAgent === agent.id
                                                ? 'bg-blue-100 dark:bg-blue-900'
                                                : 'hover:bg-gray-100 dark:hover:bg-gray-700'), children: [_jsxs("div", { className: "relative", children: [_jsx("div", { className: "w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center", children: _jsx(Bot, { className: "w-4 h-4 text-white" }) }), _jsx("div", { className: "absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 ".concat(agent.status === 'active' ? 'bg-green-500' : 'bg-gray-400') })] }), _jsxs("div", { className: "flex-1", children: [_jsx("p", { className: "text-sm font-medium text-gray-900 dark:text-white", children: agent.name }), _jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400", children: agent.type })] }), selectedAgent === agent.id && (_jsx("div", { className: "w-2 h-2 bg-blue-500 rounded-full" }))] }, agent.id)); }) })] })] })] }), _jsxs("div", { className: "flex-1 flex flex-col", children: [_jsx("div", { className: "bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center space-x-3", children: [_jsx(Hash, { className: "w-5 h-5 text-gray-400" }), _jsxs("div", { children: [_jsx("h3", { className: "font-semibold text-gray-900 dark:text-white", children: "General" }), _jsxs("p", { className: "text-sm text-gray-500 dark:text-gray-400", children: [workspace === null || workspace === void 0 ? void 0 : workspace.members.length, " members", selectedAgent && " \u2022 Chatting with ".concat((_a = workspace === null || workspace === void 0 ? void 0 : workspace.agents.find(function (a) { return a.id === selectedAgent; })) === null || _a === void 0 ? void 0 : _a.name)] })] })] }), _jsx("button", { title: "Chat Options", className: "p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300", children: _jsx(MoreVertical, { className: "w-4 h-4" }) })] }) }), _jsxs("div", { className: "flex-1 overflow-y-auto p-4 space-y-4", children: [messages.map(function (message) { return (_jsx("div", { className: "flex ".concat(message.sender.type === 'user' && message.sender.id === 'current-user' ? 'justify-end' : 'justify-start'), children: _jsxs("div", { className: "max-w-xs lg:max-w-md ".concat(message.sender.type === 'user' && message.sender.id === 'current-user'
                                        ? 'bg-blue-600 text-white'
                                        : message.sender.type === 'agent'
                                            ? 'bg-purple-100 dark:bg-purple-900 text-purple-900 dark:text-purple-100'
                                            : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white', " rounded-lg p-3 shadow-sm"), children: [message.sender.type !== 'user' || message.sender.id !== 'current-user' ? (_jsxs("div", { className: "flex items-center space-x-2 mb-2", children: [_jsx("div", { className: "w-6 h-6 rounded-full flex items-center justify-center ".concat(message.sender.type === 'agent' ? 'bg-purple-500' : 'bg-blue-500'), children: message.sender.type === 'agent' ? (_jsx(Bot, { className: "w-3 h-3 text-white" })) : (_jsx(User, { className: "w-3 h-3 text-white" })) }), _jsx("span", { className: "text-sm font-medium", children: message.sender.name })] })) : null, _jsx("p", { className: "text-sm", children: message.content }), message.attachments && message.attachments.length > 0 && (_jsx("div", { className: "mt-2 space-y-1", children: message.attachments.map(function (attachment) { return (_jsxs("div", { className: "flex items-center space-x-2 p-2 bg-gray-100 dark:bg-gray-600 rounded", children: [_jsx(Paperclip, { className: "w-4 h-4" }), _jsx("span", { className: "text-sm", children: attachment.name })] }, attachment.id)); }) })), _jsxs("div", { className: "flex items-center justify-between mt-2", children: [_jsx("span", { className: "text-xs opacity-70", children: formatTime(message.timestamp) }), message.sender.id === 'current-user' && getStatusIcon(message.status)] })] }) }, message.id)); }), isTyping && (_jsx("div", { className: "flex justify-start", children: _jsx("div", { className: "bg-gray-100 dark:bg-gray-700 rounded-lg p-3 shadow-sm", children: _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("div", { className: "w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center", children: _jsx(Bot, { className: "w-3 h-3 text-white" }) }), _jsxs("div", { className: "flex space-x-1", children: [_jsx("div", { className: "w-2 h-2 bg-gray-400 rounded-full animate-bounce" }), _jsx("div", { className: "w-2 h-2 bg-gray-400 rounded-full animate-bounce", style: { animationDelay: '0.1s' } }), _jsx("div", { className: "w-2 h-2 bg-gray-400 rounded-full animate-bounce", style: { animationDelay: '0.2s' } })] })] }) }) })), _jsx("div", { ref: messagesEndRef })] }), _jsxs("div", { className: "bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4", children: [selectedAgent && (_jsx("div", { className: "mb-2 p-2 bg-blue-50 dark:bg-blue-900 rounded-lg", children: _jsxs("p", { className: "text-sm text-blue-700 dark:text-blue-300", children: ["Chatting with ", (_b = workspace === null || workspace === void 0 ? void 0 : workspace.agents.find(function (a) { return a.id === selectedAgent; })) === null || _b === void 0 ? void 0 : _b.name, _jsx("button", { onClick: function () { return setSelectedAgent(null); }, className: "ml-2 text-blue-500 hover:text-blue-700", children: "\u2715" })] }) })), _jsxs("div", { className: "flex items-end space-x-2", children: [_jsxs("div", { className: "flex-1 relative", children: [_jsx("textarea", { value: newMessage, onChange: function (e) { return setNewMessage(e.target.value); }, onKeyPress: handleKeyPress, placeholder: "Type a message...", className: "w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none", rows: 1, style: { minHeight: '44px', maxHeight: '120px' } }), _jsxs("div", { className: "absolute right-2 bottom-2 flex items-center space-x-1", children: [_jsx("button", { onClick: handleFileUpload, title: "Attach File", className: "p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300", children: _jsx(Paperclip, { className: "w-4 h-4" }) }), _jsx("button", { title: "Add Emoji", className: "p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300", children: _jsx(Smile, { className: "w-4 h-4" }) })] })] }), _jsx("button", { onClick: sendMessage, disabled: !newMessage.trim(), title: "Send Message", className: "p-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors", children: _jsx(Send, { className: "w-4 h-4" }) })] }), _jsx("input", { ref: fileInputRef, type: "file", multiple: true, title: "Upload Files", "aria-label": "Upload Files", className: "hidden", onChange: function (e) {
                                    // Handle file upload
                                    console.log('Files selected:', e.target.files);
                                } })] })] })] }));
};
export default WorkspaceChat;
