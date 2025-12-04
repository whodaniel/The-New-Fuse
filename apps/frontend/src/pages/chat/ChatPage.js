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
import { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react';
import { Link } from 'react-router-dom';
import { Play, Pause, Sparkles, Copy, Lightbulb, Users } from 'lucide-react';
import { chatApiService } from '../../services/chatApi';
// Context for shared state
var ChatContext = createContext(null);
// Enhanced Chat Provider Component
var EnhancedChatProvider = function (_a) {
    var children = _a.children;
    var _b = useState([]), agents = _b[0], setAgents = _b[1];
    var _c = useState([]), messages = _c[0], setMessages = _c[1];
    var _d = useState([]), rules = _d[0], setRules = _d[1];
    var _e = useState([]), synthesisJobs = _e[0], setSynthesisJobs = _e[1];
    var _f = useState(''), conversationGoal = _f[0], setConversationGoal = _f[1];
    var _g = useState(false), isGenerating = _g[0], setIsGenerating = _g[1];
    var _h = useState(false), isAutomating = _h[0], setIsAutomating = _h[1];
    var _j = useState(false), isSynthesizing = _j[0], setIsSynthesizing = _j[1];
    var _k = useState('manual'), mode = _k[0], setMode = _k[1];
    var _l = useState(true), isPaused = _l[0], setIsPaused = _l[1];
    var _m = useState(false), isTtsEnabled = _m[0], setIsTtsEnabled = _m[1];
    var _o = useState([]), voices = _o[0], setVoices = _o[1];
    var _p = useState(null), currentChatId = _p[0], setCurrentChatId = _p[1];
    // Load voices for TTS
    useEffect(function () {
        var loadVoices = function () {
            var _a;
            var availableVoices = ((_a = window.speechSynthesis) === null || _a === void 0 ? void 0 : _a.getVoices()) || [];
            setVoices(availableVoices.map(function (v) { return ({
                name: v.name,
                lang: v.lang,
                voice: v
            }); }));
        };
        if (window.speechSynthesis) {
            window.speechSynthesis.onvoiceschanged = loadVoices;
            setTimeout(loadVoices, 100);
        }
    }, []);
    // Text-to-speech function
    var speak = useCallback(function (text, voiceName) {
        return new Promise(function (resolve) {
            var _a;
            if (!isTtsEnabled || !text || typeof text !== 'string' || text.trim() === '') {
                resolve();
                return;
            }
            var allVoices = ((_a = window.speechSynthesis) === null || _a === void 0 ? void 0 : _a.getVoices()) || [];
            if (allVoices.length === 0) {
                resolve();
                return;
            }
            if (window.speechSynthesis.speaking) {
                window.speechSynthesis.cancel();
            }
            var utterance = new SpeechSynthesisUtterance(text.replace(/\*/g, ''));
            utterance.voice = allVoices.find(function (v) { return v.name === voiceName; }) ||
                allVoices.find(function (v) { return v.lang.startsWith('en') && v.default; }) ||
                allVoices[0];
            utterance.onend = function () { return resolve(); };
            utterance.onerror = function () { return resolve(); };
            setTimeout(function () {
                try {
                    window.speechSynthesis.speak(utterance);
                }
                catch (error) {
                    console.warn('TTS failed:', error);
                    resolve();
                }
            }, 100);
        });
    }, [isTtsEnabled]);
    // API call functions using the backend service
    var callTextApi = useCallback(function (prompt_1) {
        var args_1 = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args_1[_i - 1] = arguments[_i];
        }
        return __awaiter(void 0, __spreadArray([prompt_1], args_1, true), void 0, function (prompt, systemPrompt) {
            var error_1;
            if (systemPrompt === void 0) { systemPrompt = "You are a helpful assistant."; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, chatApiService.callTextApi(prompt, systemPrompt)];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2:
                        error_1 = _a.sent();
                        console.error('Text API error:', error_1);
                        return [2 /*return*/, 'I apologize, but I encountered an error while processing your request.'];
                    case 3: return [2 /*return*/];
                }
            });
        });
    }, []);
    var addMessage = useCallback(function (message) { return __awaiter(void 0, void 0, void 0, function () {
        var newMessage_1, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    newMessage_1 = __assign(__assign({}, message), { id: Date.now().toString() });
                    setMessages(function (prev) { return __spreadArray(__spreadArray([], prev, true), [newMessage_1], false); });
                    if (!currentChatId) return [3 /*break*/, 2];
                    return [4 /*yield*/, chatApiService.addMessage(currentChatId, message)];
                case 1:
                    _a.sent();
                    _a.label = 2;
                case 2: return [2 /*return*/, newMessage_1];
                case 3:
                    error_2 = _a.sent();
                    console.error('Error adding message:', error_2);
                    return [2 /*return*/, __assign(__assign({}, message), { id: Date.now().toString() })];
                case 4: return [2 /*return*/];
            }
        });
    }); }, [currentChatId, setMessages]);
    var getAgentById = useCallback(function (id) {
        return agents.find(function (a) { return a.id === id; });
    }, [agents]);
    var contextValue = {
        agents: agents,
        setAgents: setAgents,
        messages: messages,
        setMessages: setMessages,
        rules: rules,
        setRules: setRules,
        synthesisJobs: synthesisJobs,
        setSynthesisJobs: setSynthesisJobs,
        conversationGoal: conversationGoal,
        setConversationGoal: setConversationGoal,
        isGenerating: isGenerating,
        setIsGenerating: setIsGenerating,
        isAutomating: isAutomating,
        setIsAutomating: setIsAutomating,
        isSynthesizing: isSynthesizing,
        setIsSynthesizing: setIsSynthesizing,
        mode: mode,
        setMode: setMode,
        isPaused: isPaused,
        setIsPaused: setIsPaused,
        isTtsEnabled: isTtsEnabled,
        setIsTtsEnabled: setIsTtsEnabled,
        voices: voices,
        speak: speak,
        callTextApi: callTextApi,
        addMessage: addMessage,
        getAgentById: getAgentById,
        currentChatId: currentChatId,
        setCurrentChatId: setCurrentChatId
    };
    return (_jsx(ChatContext.Provider, { value: contextValue, children: children }));
};
function ChatPage() {
    var _this = this;
    var _a, _b, _c, _d, _e;
    var _f = useState(''), newMessage = _f[0], setNewMessage = _f[1];
    var _g = useState('general'), selectedAgent = _g[0], setSelectedAgent = _g[1];
    var _h = useState(true), loading = _h[0], setLoading = _h[1];
    var _j = useState('You'), senderId = _j[0], setSenderId = _j[1];
    var _k = useState(''), recipientAgentId = _k[0], setRecipientAgentId = _k[1];
    var _l = useState(false), isAgentModalOpen = _l[0], setIsAgentModalOpen = _l[1];
    var _m = useState(false), isGoalModalOpen = _m[0], setIsGoalModalOpen = _m[1];
    var _o = useState(false), isRuleModalOpen = _o[0], setIsRuleModalOpen = _o[1];
    var _p = useState(false), isGalleryOpen = _p[0], setIsGalleryOpen = _p[1];
    var messagesEndRef = useRef(null);
    var _q = useContext(ChatContext) || {}, agents = _q.agents, setAgents = _q.setAgents, messages = _q.messages, setMessages = _q.setMessages, rules = _q.rules, conversationGoal = _q.conversationGoal, setConversationGoal = _q.setConversationGoal, isGenerating = _q.isGenerating, setIsGenerating = _q.setIsGenerating, isAutomating = _q.isAutomating, setIsAutomating = _q.setIsAutomating, isSynthesizing = _q.isSynthesizing, mode = _q.mode, setMode = _q.setMode, isPaused = _q.isPaused, setIsPaused = _q.setIsPaused, isTtsEnabled = _q.isTtsEnabled, setIsTtsEnabled = _q.setIsTtsEnabled, voices = _q.voices, speak = _q.speak, callTextApi = _q.callTextApi, addMessage = _q.addMessage, getAgentById = _q.getAgentById, currentChatId = _q.currentChatId, setCurrentChatId = _q.setCurrentChatId;
    // Initialize default agents if none exist
    useEffect(function () {
        var _a, _b, _c, _d;
        if (agents && agents.length === 0) {
            var defaultAgents = [
                {
                    id: 'general',
                    name: 'General Assistant',
                    avatar: '🤖',
                    status: 'online',
                    type: 'assistant',
                    systemPrompt: 'You are a helpful general assistant.',
                    model: 'GPT-4',
                    voice: ((_a = voices[0]) === null || _a === void 0 ? void 0 : _a.name) || ''
                },
                {
                    id: 'codehelper',
                    name: 'Code Helper',
                    avatar: '👨‍💻',
                    status: 'online',
                    type: 'specialist',
                    systemPrompt: 'You are a coding specialist who helps with programming questions.',
                    model: 'GPT-4',
                    voice: ((_b = voices[0]) === null || _b === void 0 ? void 0 : _b.name) || ''
                },
                {
                    id: 'dataanalyst',
                    name: 'Data Analyst',
                    avatar: '📊',
                    status: 'online',
                    type: 'specialist',
                    systemPrompt: 'You are a data analysis expert.',
                    model: 'Claude-3',
                    voice: ((_c = voices[0]) === null || _c === void 0 ? void 0 : _c.name) || ''
                },
                {
                    id: 'support',
                    name: 'Support Agent',
                    avatar: '🛠️',
                    status: 'busy',
                    type: 'admin',
                    systemPrompt: 'You provide technical support and help resolve issues.',
                    model: 'GPT-3.5',
                    voice: ((_d = voices[0]) === null || _d === void 0 ? void 0 : _d.name) || ''
                }
            ];
            setAgents(defaultAgents);
        }
    }, [agents, setAgents, voices]);
    // Initialize with welcome messages if messages are empty
    useEffect(function () {
        if (messages && messages.length === 0) {
            setTimeout(function () {
                addMessage({
                    content: 'Hello! I\'m your General Assistant. How can I help you today?',
                    sender: 'agent',
                    timestamp: new Date(Date.now() - 300000).toISOString(),
                    agentId: 'general',
                    agentName: 'General Assistant',
                    agentAvatar: '🤖',
                    type: 'text'
                });
                addMessage({
                    content: 'Welcome to The New Fuse Enhanced Chat! You can now interact with multiple AI agents simultaneously, set conversation goals, and use automation features.',
                    sender: 'system',
                    timestamp: new Date(Date.now() - 240000).toISOString(),
                    type: 'text'
                });
                setLoading(false);
            }, 1000);
        }
        else if (messages) {
            setLoading(false);
        }
    }, [messages, addMessage]);
    // Auto-scroll to bottom when new messages arrive
    useEffect(function () {
        var _a;
        (_a = messagesEndRef.current) === null || _a === void 0 ? void 0 : _a.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);
    // Auto-response logic for multi-agent conversations
    useEffect(function () {
        if (mode !== 'auto' || isGenerating || !messages || messages.length === 0 || isPaused) {
            return;
        }
        var lastMessage = messages[messages.length - 1];
        if (lastMessage.sender === 'You' || lastMessage.sender === 'system' || !lastMessage.agentId) {
            return;
        }
        var nextRule = rules === null || rules === void 0 ? void 0 : rules.find(function (rule) { return rule.sourceId === lastMessage.agentId; });
        if (!(nextRule === null || nextRule === void 0 ? void 0 : nextRule.targetId))
            return;
        var nextAgent = getAgentById(nextRule.targetId);
        if (!nextAgent)
            return;
        var timeoutId = setTimeout(function () { return __awaiter(_this, void 0, void 0, function () {
            var history_1, goalPrompt, finalPrompt, botText, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, 5, 6]);
                        setIsGenerating(true);
                        history_1 = messages.slice(-10).map(function (m) { return "".concat(m.sender, ": ").concat(m.content); }).join('\n');
                        goalPrompt = conversationGoal ? "The current conversation goal is: \"".concat(conversationGoal, "\".") : '';
                        finalPrompt = "".concat(goalPrompt, "\n\nPrevious conversation:\n").concat(history_1, "\n\nYour turn, ").concat(nextAgent.name, ". What is your response? Keep it conversational and concise.");
                        return [4 /*yield*/, callTextApi(finalPrompt, nextAgent.systemPrompt)];
                    case 1:
                        botText = _a.sent();
                        return [4 /*yield*/, addMessage({
                                content: botText,
                                sender: 'agent',
                                timestamp: new Date().toISOString(),
                                agentId: nextAgent.id,
                                agentName: nextAgent.name,
                                agentAvatar: nextAgent.avatar,
                                type: 'text'
                            })];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, speak(botText, nextAgent.voice)];
                    case 3:
                        _a.sent();
                        return [3 /*break*/, 6];
                    case 4:
                        error_3 = _a.sent();
                        console.error('Auto-response error:', error_3);
                        return [3 /*break*/, 6];
                    case 5:
                        setIsGenerating(false);
                        return [7 /*endfinally*/];
                    case 6: return [2 /*return*/];
                }
            });
        }); }, 1500);
        return function () { return clearTimeout(timeoutId); };
    }, [mode, messages, rules, isGenerating, isPaused, conversationGoal, getAgentById, callTextApi, addMessage, speak]);
    var handleSendMessage = function () { return __awaiter(_this, void 0, void 0, function () {
        var respondingAgent, userMessage, history_2, goalPrompt, finalPrompt, botText, error_4;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!newMessage.trim() || !recipientAgentId)
                        return [2 /*return*/];
                    respondingAgent = getAgentById(recipientAgentId);
                    if (!respondingAgent)
                        return [2 /*return*/];
                    userMessage = {
                        content: newMessage,
                        sender: senderId === 'You' ? 'You' : ((_a = getAgentById(senderId)) === null || _a === void 0 ? void 0 : _a.name) || 'You',
                        timestamp: new Date().toISOString(),
                        type: 'text'
                    };
                    setNewMessage('');
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 6, 7, 8]);
                    return [4 /*yield*/, addMessage(userMessage)];
                case 2:
                    _b.sent();
                    setIsGenerating(true);
                    history_2 = __spreadArray(__spreadArray([], messages, true), [userMessage], false).slice(-10)
                        .map(function (m) { return "".concat(m.sender, ": ").concat(m.content); })
                        .join('\n');
                    goalPrompt = conversationGoal ? "The current conversation goal is: \"".concat(conversationGoal, "\".") : '';
                    finalPrompt = "".concat(goalPrompt, "\n\nPrevious conversation:\n").concat(history_2, "\n\nYour turn, ").concat(respondingAgent.name, ". What is your response?");
                    return [4 /*yield*/, callTextApi(finalPrompt, respondingAgent.systemPrompt)];
                case 3:
                    botText = _b.sent();
                    return [4 /*yield*/, addMessage({
                            content: botText,
                            sender: 'agent',
                            timestamp: new Date().toISOString(),
                            agentId: respondingAgent.id,
                            agentName: respondingAgent.name,
                            agentAvatar: respondingAgent.avatar,
                            type: 'text'
                        })];
                case 4:
                    _b.sent();
                    return [4 /*yield*/, speak(botText, respondingAgent.voice)];
                case 5:
                    _b.sent();
                    return [3 /*break*/, 8];
                case 6:
                    error_4 = _b.sent();
                    console.error('Error sending message:', error_4);
                    return [3 /*break*/, 8];
                case 7:
                    setIsGenerating(false);
                    return [7 /*endfinally*/];
                case 8: return [2 /*return*/];
            }
        });
    }); };
    var generateAgentResponse = function (userInput, agentId) {
        var input = userInput.toLowerCase();
        switch (agentId) {
            case 'codehelper':
                if (input.includes('code') || input.includes('programming') || input.includes('bug')) {
                    return "I can help you with coding! Here are some suggestions:\n\n```javascript\n// Example code structure\nfunction solveProblem() {\n  // Your solution here\n  return result;\n}\n```\n\nWould you like me to help with a specific programming language or framework?";
                }
                return 'I\'m the Code Helper! I can assist with programming, debugging, code reviews, and technical implementation. What coding challenge are you working on?';
            case 'dataanalyst':
                if (input.includes('data') || input.includes('analytics') || input.includes('chart')) {
                    return 'I can help you analyze data and create insights! I can assist with:\n\n• Data visualization\n• Statistical analysis\n• Report generation\n• KPI tracking\n• Trend analysis\n\nWhat kind of data analysis do you need?';
                }
                return 'Hello! I\'m the Data Analyst agent. I specialize in data analysis, visualization, and generating actionable insights from your data. How can I help you today?';
            case 'support':
                return 'Hi! I\'m here to provide technical support and help resolve any issues you might be experiencing. Please describe the problem you\'re facing, and I\'ll do my best to assist you.';
            default:
                if (input.includes('hello') || input.includes('hi')) {
                    return 'Hello! I\'m happy to help you today. I can assist with general questions, provide information about The New Fuse platform, or direct you to the right specialist agent.';
                }
                if (input.includes('task') || input.includes('project')) {
                    return 'I can help you with task and project management! Would you like me to:\n\n• Create a new task\n• Check project status\n• Assign team members\n• Set deadlines\n• Track progress\n\nWhat would you like to do?';
                }
                if (input.includes('agent') || input.includes('ai')) {
                    return 'I can help you work with AI agents! You can:\n\n• Deploy new agents\n• Monitor agent performance\n• Configure agent settings\n• View agent analytics\n\nWhich agent-related task interests you?';
                }
                return "I understand you said: \"".concat(userInput, "\"\n\nI'm here to help! I can assist with various tasks including:\n\u2022 General questions about the platform\n\u2022 Task and project management\n\u2022 Agent coordination\n\u2022 Workspace management\n\nWhat would you like to know more about?");
        }
    };
    var getStatusBadge = function (status) {
        switch (status) {
            case 'online':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'busy':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'offline':
                return 'bg-gray-100 text-gray-800 border-gray-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };
    var getStatusIcon = function (status) {
        switch (status) {
            case 'online': return '🟢';
            case 'busy': return '🟡';
            case 'offline': return '⚫';
            default: return '⚪';
        }
    };
    var formatTimestamp = function (timestamp) {
        return new Date(timestamp).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };
    if (loading) {
        return (_jsx("div", { className: "p-8 max-w-7xl mx-auto", children: _jsx("div", { className: "flex items-center justify-center min-h-[400px]", children: _jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" }) }) }));
    }
    return (_jsxs("div", { className: "p-8 max-w-7xl mx-auto", children: [_jsx("div", { className: "mb-8", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900 mb-2", children: "\uD83D\uDCAC Chat Center" }), _jsx("p", { className: "text-gray-600", children: "Communicate with AI agents and get instant help" })] }), _jsxs("div", { className: "flex space-x-3", children: [_jsxs("button", { onClick: function () { return setIsAgentModalOpen(true); }, className: "bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center", children: [_jsx(Users, { size: 16, className: "mr-2" }), "Agents (", (agents === null || agents === void 0 ? void 0 : agents.length) || 0, ")"] }), _jsxs("button", { onClick: function () { return setIsGoalModalOpen(true); }, className: "bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors flex items-center", children: [_jsx(Lightbulb, { size: 16, className: "mr-2" }), "Set Goal"] }), _jsxs("button", { onClick: function () { return setIsRuleModalOpen(true); }, className: "bg-yellow-500 text-black px-4 py-2 rounded-lg hover:bg-yellow-600 transition-colors flex items-center", children: [_jsx(Copy, { size: 16, className: "mr-2" }), "Rules"] }), _jsxs("button", { className: "bg-cyan-600 text-white px-4 py-2 rounded-lg hover:bg-cyan-700 transition-colors flex items-center", disabled: isSynthesizing, children: [_jsx(Sparkles, { size: 16, className: "mr-2" }), isSynthesizing ? 'Synthesizing...' : 'Creative Synthesis'] })] })] }) }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-4 gap-6", children: [_jsx("div", { className: "lg:col-span-1", children: _jsxs("div", { className: "bg-white rounded-lg shadow-lg p-6", children: [_jsx("h2", { className: "text-lg font-semibold text-gray-900 mb-4", children: "Available Agents" }), _jsx("div", { className: "space-y-3", children: agents.map(function (agent) { return (_jsx("button", { onClick: function () { return setSelectedAgent(agent.id); }, className: "w-full text-left p-3 rounded-lg transition-colors ".concat(selectedAgent === agent.id
                                            ? 'bg-blue-100 border-blue-200 border-2'
                                            : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'), children: _jsxs("div", { className: "flex items-center space-x-3", children: [_jsx("div", { className: "text-2xl", children: agent.avatar }), _jsxs("div", { className: "flex-1", children: [_jsx("div", { className: "font-medium text-gray-900", children: agent.name }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsxs("span", { className: "px-2 py-1 text-xs rounded-full border ".concat(getStatusBadge(agent.status)), children: [getStatusIcon(agent.status), " ", agent.status] }), _jsx("span", { className: "text-xs text-gray-500", children: agent.type })] })] })] }) }, agent.id)); }) }), _jsxs("div", { className: "mt-6 space-y-4", children: [_jsx("h3", { className: "text-sm font-medium text-gray-700", children: "Conversation Controls" }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-sm font-medium", children: "Mode:" }), _jsx("button", { onClick: function () { return setMode(mode === 'manual' ? 'auto' : 'manual'); }, className: "px-3 py-1 rounded-full text-sm ".concat(mode === 'auto' ? 'bg-blue-500 text-white' : 'bg-gray-200'), children: mode === 'auto' ? 'Auto' : 'Manual' })] }), mode === 'auto' && (_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-sm", children: "Auto-responses:" }), _jsx("button", { onClick: function () { return setIsPaused(!isPaused); }, className: "p-2 text-gray-400 hover:text-white rounded-full", children: isPaused ? _jsx(Play, { size: 16 }) : _jsx(Pause, { size: 16 }) })] })), _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-sm", children: "Text-to-Speech:" }), _jsx("button", { onClick: function () { return setIsTtsEnabled(!isTtsEnabled); }, className: "px-3 py-1 rounded-full text-sm ".concat(isTtsEnabled ? 'bg-green-500 text-white' : 'bg-gray-200'), children: isTtsEnabled ? 'ON' : 'OFF' })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Link, { to: "/agents", className: "block w-full text-left p-2 text-sm text-purple-600 hover:bg-purple-50 rounded", children: "\uD83E\uDD16 Manage All Agents" }), _jsx(Link, { to: "/agents/new", className: "block w-full text-left p-2 text-sm text-green-600 hover:bg-green-50 rounded", children: "\u2795 Create New Agent" }), _jsx(Link, { to: "/tasks/new", className: "block w-full text-left p-2 text-sm text-blue-600 hover:bg-blue-50 rounded", children: "\uD83D\uDCCB Create Task" }), _jsx("button", { onClick: function () { return setIsGalleryOpen(true); }, className: "block w-full text-left p-2 text-sm text-green-600 hover:bg-green-50 rounded", children: "\uD83C\uDFAC Synthesis Gallery" })] })] })] }) }), _jsx("div", { className: "lg:col-span-3", children: _jsxs("div", { className: "bg-white rounded-lg shadow-lg flex flex-col h-[600px]", children: [_jsx("div", { className: "p-4 border-b border-gray-200", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center space-x-3", children: [_jsx("div", { className: "text-2xl", children: (_a = agents.find(function (a) { return a.id === selectedAgent; })) === null || _a === void 0 ? void 0 : _a.avatar }), _jsxs("div", { children: [_jsx("h3", { className: "font-medium text-gray-900", children: (_b = agents.find(function (a) { return a.id === selectedAgent; })) === null || _b === void 0 ? void 0 : _b.name }), _jsxs("p", { className: "text-sm text-gray-500", children: [(_c = agents.find(function (a) { return a.id === selectedAgent; })) === null || _c === void 0 ? void 0 : _c.type, " \u2022 ", ' ', _jsx("span", { className: getStatusBadge(((_d = agents.find(function (a) { return a.id === selectedAgent; })) === null || _d === void 0 ? void 0 : _d.status) || 'offline'), children: (_e = agents.find(function (a) { return a.id === selectedAgent; })) === null || _e === void 0 ? void 0 : _e.status })] })] })] }), _jsxs("div", { className: "flex space-x-2", children: [_jsx("button", { className: "p-2 text-gray-400 hover:text-gray-600 rounded", children: "\uD83D\uDCCE" }), _jsx("button", { className: "p-2 text-gray-400 hover:text-gray-600 rounded", children: "\u2699\uFE0F" })] })] }) }), _jsxs("div", { className: "flex-1 overflow-y-auto p-4 space-y-4", children: [messages.map(function (message) { return (_jsx("div", { className: "flex ".concat(message.sender === 'user' ? 'justify-end' : 'justify-start'), children: _jsxs("div", { className: "max-w-xs lg:max-w-md px-4 py-2 rounded-lg ".concat(message.sender === 'user'
                                                    ? 'bg-blue-600 text-white'
                                                    : message.sender === 'system'
                                                        ? 'bg-gray-100 text-gray-800'
                                                        : 'bg-gray-50 text-gray-900'), children: [message.sender === 'agent' && (_jsxs("div", { className: "flex items-center space-x-2 mb-1", children: [_jsx("span", { className: "text-lg", children: message.agentAvatar }), _jsx("span", { className: "text-xs font-medium text-gray-600", children: message.agentName })] })), message.sender === 'system' && (_jsx("div", { className: "text-xs font-medium text-gray-500 mb-1", children: "System Message" })), _jsx("div", { className: "whitespace-pre-wrap", children: message.content.includes('```') ? (_jsx("div", { className: "space-y-2", children: message.content.split('```').map(function (part, index) {
                                                                return index % 2 === 0 ? (_jsx("div", { children: part }, index)) : (_jsx("div", { className: "bg-gray-800 text-green-400 p-2 rounded text-sm font-mono overflow-x-auto", children: part }, index));
                                                            }) })) : (message.content) }), _jsx("div", { className: "text-xs mt-1 ".concat(message.sender === 'user'
                                                            ? 'text-blue-200'
                                                            : 'text-gray-500'), children: formatTimestamp(message.timestamp) })] }) }, message.id)); }), isGenerating && (_jsx("div", { className: "flex justify-start", children: _jsxs("div", { className: "bg-gray-50 text-gray-900 max-w-xs lg:max-w-md px-4 py-2 rounded-lg", children: [_jsxs("div", { className: "flex items-center space-x-2 mb-1", children: [_jsx("span", { className: "text-lg", children: "\uD83E\uDD16" }), _jsx("span", { className: "text-xs font-medium text-gray-600", children: "Agent thinking..." })] }), _jsxs("div", { className: "flex space-x-1", children: [_jsx("div", { className: "w-2 h-2 bg-gray-400 rounded-full animate-bounce" }), _jsx("div", { className: "w-2 h-2 bg-gray-400 rounded-full animate-bounce", style: { animationDelay: '0.1s' } }), _jsx("div", { className: "w-2 h-2 bg-gray-400 rounded-full animate-bounce", style: { animationDelay: '0.2s' } })] })] }) })), _jsx("div", { ref: messagesEndRef })] }), _jsxs("div", { className: "p-4 border-t border-gray-200", children: [_jsxs("div", { className: "flex items-center gap-2 mb-3", children: [_jsx("label", { className: "text-sm", children: "From:" }), _jsxs("select", { value: senderId, onChange: function (e) { return setSenderId(e.target.value); }, className: "flex-1 p-2 border rounded-lg bg-gray-50 border-gray-300 text-sm", children: [_jsx("option", { value: "You", children: "You" }), agents === null || agents === void 0 ? void 0 : agents.map(function (a) { return (_jsx("option", { value: a.id, children: a.name }, a.id)); })] }), _jsx("label", { className: "text-sm", children: "To:" }), _jsxs("select", { value: recipientAgentId, onChange: function (e) { return setRecipientAgentId(e.target.value); }, className: "flex-1 p-2 border rounded-lg bg-gray-50 border-gray-300 text-sm", children: [_jsx("option", { value: "", children: "Select Agent" }), agents === null || agents === void 0 ? void 0 : agents.map(function (a) { return (_jsx("option", { value: a.id, children: a.name }, a.id)); })] })] }), _jsxs("div", { className: "flex space-x-2", children: [_jsx("input", { type: "text", value: newMessage, onChange: function (e) { return setNewMessage(e.target.value); }, onKeyPress: function (e) { return e.key === 'Enter' && handleSendMessage(); }, placeholder: isGenerating ? "Thinking..." : "Type a message...", className: "flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500", disabled: isGenerating || !agents || agents.length === 0 }), _jsx("button", { onClick: handleSendMessage, disabled: !newMessage.trim() || isGenerating || !agents || agents.length === 0 || !recipientAgentId, className: "bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed", children: "Send" })] }), _jsxs("div", { className: "flex items-center justify-between mt-2 text-xs text-gray-500", children: [_jsx("span", { children: "Press Enter to send" }), _jsxs("span", { children: [newMessage.length, "/500"] })] })] })] }) })] })] }));
}
// Wrap the main component with the enhanced provider
var WrappedChatPage = function () { return (_jsx(EnhancedChatProvider, { children: _jsx(ChatPage, {}) })); };
export default WrappedChatPage;
