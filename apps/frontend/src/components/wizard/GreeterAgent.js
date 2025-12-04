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
import { useState, useEffect, useRef } from 'react';
import { useWizard } from './WizardProvider';
// Mock RAG service to avoid dependency issues
var ragService = {
    query: function (query) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: 
                // Mock response generation
                return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 1000); })];
                case 1:
                    // Mock response generation
                    _a.sent();
                    return [2 /*return*/, "Hello! I'm here to help you get started. You asked: \"".concat(query, "\". I can assist you with setting up your workspace, navigating features, or answering questions about the platform.")];
            }
        });
    }); },
    generateResponse: function (query, context) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: 
                // Mock response generation
                return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 1000); })];
                case 1:
                    // Mock response generation
                    _a.sent();
                    return [2 /*return*/, {
                            response: "Hello! I'm here to help you get started. You asked: \"".concat(query, "\". I can assist you with setting up your workspace, navigating features, or answering questions about the platform."),
                            confidence: 0.85,
                            sources: []
                        }];
            }
        });
    }); },
    indexKnowledge: function (documents) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            console.log('Mock: Indexing knowledge documents', documents);
            return [2 /*return*/, { indexed: documents.length }];
        });
    }); }
};
export var GreeterAgent = function (_a) {
    var _b = _a.initialMessage, initialMessage = _b === void 0 ? "Hello! I'm your AI assistant for The New Fuse platform. I can help you get started and answer any questions you might have. What would you like to know?" : _b, _c = _a.agentName, agentName = _c === void 0 ? "Fuse Assistant" : _c, _d = _a.agentAvatar, agentAvatar = _d === void 0 ? "/assets/images/assistant-avatar.png" : _d;
    var addConversation = useWizard().addConversation;
    var _e = useState([]), messages = _e[0], setMessages = _e[1];
    var _f = useState(''), input = _f[0], setInput = _f[1];
    var _g = useState(false), isTyping = _g[0], setIsTyping = _g[1];
    var messagesEndRef = useRef(null);
    // Initialize with system message and initial greeting
    useEffect(function () {
        var systemMessage = {
            id: 'system-1',
            role: 'system',
            content: "You are the Greeter Agent for The New Fuse platform. Your name is ".concat(agentName, ".\n      You help users get started with the platform by answering their questions and providing guidance.\n      The New Fuse is an AI agent coordination platform that enables intelligent interaction between different AI systems.\n      Be friendly, helpful, and concise in your responses."),
            timestamp: new Date()
        };
        var initialGreeting = {
            id: 'assistant-1',
            role: 'assistant',
            content: initialMessage,
            timestamp: new Date()
        };
        setMessages([systemMessage, initialGreeting]);
        // Add to conversation history in wizard state
        addConversation({
            role: 'system',
            content: systemMessage.content
        });
        addConversation({
            role: 'assistant',
            content: initialGreeting.content
        });
    }, [addConversation, agentName, initialMessage]);
    // Scroll to bottom when messages change
    useEffect(function () {
        var _a;
        (_a = messagesEndRef.current) === null || _a === void 0 ? void 0 : _a.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);
    // Function to generate a response using RAG
    var generateResponse = function (userMessage) { return __awaiter(void 0, void 0, void 0, function () {
        var response, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setIsTyping(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, ragService.query(userMessage)];
                case 2:
                    response = _a.sent();
                    return [2 /*return*/, response];
                case 3:
                    error_1 = _a.sent();
                    console.error('Error generating response from RagService:', error_1);
                    return [2 /*return*/, "I encountered an issue trying to find an answer for you. Please try asking in a different way or check the documentation."];
                case 4:
                    setIsTyping(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    var handleSendMessage = function () { return __awaiter(void 0, void 0, void 0, function () {
        var userMessage, responseContent, assistantMessage;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!input.trim())
                        return [2 /*return*/];
                    userMessage = {
                        id: "user-".concat(messages.length),
                        role: 'user',
                        content: input,
                        timestamp: new Date()
                    };
                    // Add user message to state and conversation history
                    setMessages(function (prev) { return __spreadArray(__spreadArray([], prev, true), [userMessage], false); });
                    addConversation({
                        role: 'user',
                        content: input
                    });
                    // Clear input
                    setInput('');
                    return [4 /*yield*/, generateResponse(input)];
                case 1:
                    responseContent = _a.sent();
                    assistantMessage = {
                        id: "assistant-".concat(messages.length + 1),
                        role: 'assistant',
                        content: responseContent,
                        timestamp: new Date()
                    };
                    // Add assistant message to state and conversation history
                    setMessages(function (prev) { return __spreadArray(__spreadArray([], prev, true), [assistantMessage], false); });
                    addConversation({
                        role: 'assistant',
                        content: responseContent
                    });
                    return [2 /*return*/];
            }
        });
    }); };
    var handleKeyPress = function (e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };
    return (_jsxs("div", { className: "rounded-lg overflow-hidden bg-gray-50 shadow-md h-[500px] flex flex-col", children: [_jsx("div", { className: "p-4 bg-blue-600 text-white", children: _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("div", { className: "w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-sm font-semibold", children: agentName.charAt(0) }), _jsx("span", { className: "font-bold", children: agentName })] }) }), _jsxs("div", { className: "flex-1 overflow-y-auto p-4 space-y-4", children: [messages.filter(function (m) { return m.role !== 'system'; }).map(function (message) { return (_jsx("div", { className: "flex ".concat(message.role === 'user' ? 'justify-end' : 'justify-start'), children: _jsxs("div", { className: "max-w-[80%] p-3 rounded-lg ".concat(message.role === 'user'
                                ? 'bg-blue-50 text-gray-900'
                                : 'bg-gray-100 text-gray-900'), children: [message.role === 'assistant' && (_jsxs("div", { className: "flex items-center space-x-1 mb-1", children: [_jsx("div", { className: "w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center text-xs text-white font-semibold", children: agentName.charAt(0) }), _jsx("span", { className: "font-bold text-sm", children: agentName })] })), _jsx("p", { children: message.content }), _jsx("p", { className: "text-xs text-gray-500 text-right mt-1", children: message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) })] }) }, message.id)); }), isTyping && (_jsx("div", { className: "flex justify-start", children: _jsx("div", { className: "bg-gray-100 p-3 rounded-lg", children: _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("div", { className: "w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center text-xs text-white font-semibold", children: agentName.charAt(0) }), _jsx("div", { className: "animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" })] }) }) })), _jsx("div", { ref: messagesEndRef })] }), _jsx("hr", { className: "border-gray-200" }), _jsx("div", { className: "p-4", children: _jsxs("div", { className: "flex space-x-2", children: [_jsx("input", { type: "text", placeholder: "Type your message...", value: input, onChange: function (e) { return setInput(e.target.value); }, onKeyPress: handleKeyPress, disabled: isTyping, className: "flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed" }), _jsx("button", { onClick: handleSendMessage, disabled: !input.trim() || isTyping, className: "px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2", children: isTyping ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "animate-spin rounded-full h-4 w-4 border-b-2 border-white" }), _jsx("span", { children: "Sending" })] })) : (_jsx("span", { children: "Send" })) })] }) })] }));
};
