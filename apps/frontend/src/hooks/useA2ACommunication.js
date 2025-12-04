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
import { useState, useEffect, useCallback } from 'react';
import { a2aProtocolService } from '@/services/A2AProtocolService';
export var useA2ACommunication = function () {
    var _a = useState([]), agents = _a[0], setAgents = _a[1];
    var _b = useState([]), messages = _b[0], setMessages = _b[1];
    var _c = useState(false), loading = _c[0], setLoading = _c[1];
    var _d = useState(null), error = _d[0], setError = _d[1];
    // Load agents
    var loadAgents = useCallback(function () { return __awaiter(void 0, void 0, void 0, function () {
        var mockAgents, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setLoading(true);
                    setError(null);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    // In a real app, this would fetch agents from an API
                    // For now, we'll just simulate a delay
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 1000); })];
                case 2:
                    // In a real app, this would fetch agents from an API
                    // For now, we'll just simulate a delay
                    _a.sent();
                    mockAgents = [
                        {
                            id: 'agent-1',
                            name: 'Code Assistant',
                            capabilities: ['code-generation', 'code-review', 'bug-fixing'],
                            status: 'online',
                            lastSeen: Date.now()
                        },
                        {
                            id: 'agent-2',
                            name: 'Data Analyzer',
                            capabilities: ['data-analysis', 'visualization', 'reporting'],
                            status: 'online',
                            lastSeen: Date.now()
                        },
                        {
                            id: 'agent-3',
                            name: 'Content Writer',
                            capabilities: ['writing', 'editing', 'summarization'],
                            status: 'offline',
                            lastSeen: Date.now() - 3600000 // 1 hour ago
                        },
                        {
                            id: 'agent-4',
                            name: 'Bug Hunter',
                            capabilities: ['bug-detection', 'bug-fixing', 'testing'],
                            status: 'busy',
                            lastSeen: Date.now()
                        }
                    ];
                    setAgents(mockAgents);
                    return [3 /*break*/, 5];
                case 3:
                    err_1 = _a.sent();
                    setError(err_1 instanceof Error ? err_1 : new Error('Failed to load agents'));
                    return [3 /*break*/, 5];
                case 4:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); }, []);
    // Send message
    var sendMessage = useCallback(function (message) { return __awaiter(void 0, void 0, void 0, function () {
        var fullMessage_1, err_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setLoading(true);
                    setError(null);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    fullMessage_1 = a2aProtocolService.createMessage(message.type, message.payload, message.sender, 'recipient' in message ? message.recipient : undefined, {
                        priority: 'metadata' in message && message.metadata ? message.metadata.priority : 'medium',
                        timeout: 'metadata' in message && message.metadata ? message.metadata.timeout : undefined,
                        retryCount: 'metadata' in message && message.metadata ? message.metadata.retryCount : undefined
                    });
                    // Send message
                    return [4 /*yield*/, a2aProtocolService.sendMessage(fullMessage_1)];
                case 2:
                    // Send message
                    _a.sent();
                    // Add message to list
                    setMessages(function (prev) { return __spreadArray(__spreadArray([], prev, true), [fullMessage_1], false); });
                    return [2 /*return*/, fullMessage_1];
                case 3:
                    err_2 = _a.sent();
                    setError(err_2 instanceof Error ? err_2 : new Error('Failed to send message'));
                    throw err_2;
                case 4:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); }, []);
    // Broadcast message
    var broadcastMessage = useCallback(function (message) { return __awaiter(void 0, void 0, void 0, function () {
        var fullMessage_2, err_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setLoading(true);
                    setError(null);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    fullMessage_2 = a2aProtocolService.createMessage(message.type, message.payload, message.sender, undefined, // No recipient for broadcast
                    {
                        priority: 'metadata' in message && message.metadata ? message.metadata.priority : 'medium',
                        timeout: 'metadata' in message && message.metadata ? message.metadata.timeout : undefined,
                        retryCount: 'metadata' in message && message.metadata ? message.metadata.retryCount : undefined
                    });
                    // Broadcast message
                    return [4 /*yield*/, a2aProtocolService.broadcastMessage(fullMessage_2)];
                case 2:
                    // Broadcast message
                    _a.sent();
                    // Add message to list
                    setMessages(function (prev) { return __spreadArray(__spreadArray([], prev, true), [fullMessage_2], false); });
                    return [2 /*return*/, fullMessage_2];
                case 3:
                    err_3 = _a.sent();
                    setError(err_3 instanceof Error ? err_3 : new Error('Failed to broadcast message'));
                    throw err_3;
                case 4:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); }, []);
    // Request-response
    var sendRequestAndWaitForResponse = useCallback(function (message_1) {
        var args_1 = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args_1[_i - 1] = arguments[_i];
        }
        return __awaiter(void 0, __spreadArray([message_1], args_1, true), void 0, function (message, timeout) {
            var fullMessage_3, response_1, err_4;
            if (timeout === void 0) { timeout = 30000; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        setLoading(true);
                        setError(null);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, 4, 5]);
                        fullMessage_3 = a2aProtocolService.createMessage(message.type, message.payload, message.sender, 'recipient' in message ? message.recipient : undefined, {
                            priority: 'metadata' in message && message.metadata ? message.metadata.priority : 'medium',
                            timeout: timeout,
                            retryCount: 'metadata' in message && message.metadata ? message.metadata.retryCount : undefined
                        });
                        return [4 /*yield*/, a2aProtocolService.sendRequestAndWaitForResponse(fullMessage_3, timeout)];
                    case 2:
                        response_1 = _a.sent();
                        // Add request and response to list
                        setMessages(function (prev) { return __spreadArray(__spreadArray([], prev, true), [fullMessage_3, response_1], false); });
                        return [2 /*return*/, response_1];
                    case 3:
                        err_4 = _a.sent();
                        setError(err_4 instanceof Error ? err_4 : new Error('Failed to get response'));
                        throw err_4;
                    case 4:
                        setLoading(false);
                        return [7 /*endfinally*/];
                    case 5: return [2 /*return*/];
                }
            });
        });
    }, []);
    // Load agents on mount
    useEffect(function () {
        loadAgents();
    }, [loadAgents]);
    return {
        agents: agents,
        messages: messages,
        loading: loading,
        error: error,
        loadAgents: loadAgents,
        sendMessage: sendMessage,
        broadcastMessage: broadcastMessage,
        sendRequestAndWaitForResponse: sendRequestAndWaitForResponse
    };
};
export default useA2ACommunication;
