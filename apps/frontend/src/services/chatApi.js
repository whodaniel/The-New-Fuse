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
import { apiRequest } from '../utils/api';
var ChatApiService = /** @class */ (function () {
    function ChatApiService() {
        this.baseUrl = '/api/chat';
    }
    ChatApiService.prototype.getChats = function () {
        return __awaiter(this, void 0, void 0, function () {
            var response, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, apiRequest("".concat(this.baseUrl), {
                                method: 'GET',
                            })];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response.data || []];
                    case 2:
                        error_1 = _a.sent();
                        console.error('Error fetching chats:', error_1);
                        return [2 /*return*/, []];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    ChatApiService.prototype.getChat = function (chatId) {
        return __awaiter(this, void 0, void 0, function () {
            var response, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, apiRequest("".concat(this.baseUrl, "/").concat(chatId), {
                                method: 'GET',
                            })];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response.data];
                    case 2:
                        error_2 = _a.sent();
                        console.error('Error fetching chat:', error_2);
                        return [2 /*return*/, null];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    ChatApiService.prototype.createChat = function (chatData) {
        return __awaiter(this, void 0, void 0, function () {
            var response, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, apiRequest("".concat(this.baseUrl), {
                                method: 'POST',
                                data: chatData,
                            })];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response.data];
                    case 2:
                        error_3 = _a.sent();
                        console.error('Error creating chat:', error_3);
                        return [2 /*return*/, null];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    ChatApiService.prototype.addMessage = function (chatId, messageData) {
        return __awaiter(this, void 0, void 0, function () {
            var response, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, apiRequest("".concat(this.baseUrl, "/").concat(chatId, "/messages"), {
                                method: 'POST',
                                data: messageData,
                            })];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response.data];
                    case 2:
                        error_4 = _a.sent();
                        console.error('Error adding message:', error_4);
                        return [2 /*return*/, null];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    ChatApiService.prototype.generateAgentResponse = function (chatId, prompt, agentId) {
        return __awaiter(this, void 0, void 0, function () {
            var response, error_5;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, apiRequest("".concat(this.baseUrl, "/").concat(chatId, "/generate-response"), {
                                method: 'POST',
                                data: { prompt: prompt, agentId: agentId },
                            })];
                    case 1:
                        response = _b.sent();
                        return [2 /*return*/, (_a = response.data) === null || _a === void 0 ? void 0 : _a.response];
                    case 2:
                        error_5 = _b.sent();
                        console.error('Error generating agent response:', error_5);
                        return [2 /*return*/, null];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    ChatApiService.prototype.automateConversation = function (chatId, conversationGoal) {
        return __awaiter(this, void 0, void 0, function () {
            var response, error_6;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, apiRequest("".concat(this.baseUrl, "/").concat(chatId, "/automate"), {
                                method: 'POST',
                                data: { conversationGoal: conversationGoal },
                            })];
                    case 1:
                        response = _b.sent();
                        return [2 /*return*/, ((_a = response.data) === null || _a === void 0 ? void 0 : _a.success) || false];
                    case 2:
                        error_6 = _b.sent();
                        console.error('Error automating conversation:', error_6);
                        return [2 /*return*/, false];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    ChatApiService.prototype.createConversationRule = function (ruleData) {
        return __awaiter(this, void 0, void 0, function () {
            var response, error_7;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, apiRequest("".concat(this.baseUrl, "/rules"), {
                                method: 'POST',
                                data: ruleData,
                            })];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response.data];
                    case 2:
                        error_7 = _a.sent();
                        console.error('Error creating conversation rule:', error_7);
                        return [2 /*return*/, null];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    ChatApiService.prototype.getConversationRules = function () {
        return __awaiter(this, void 0, void 0, function () {
            var response, error_8;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, apiRequest("".concat(this.baseUrl, "/rules/all"), {
                                method: 'GET',
                            })];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response.data || []];
                    case 2:
                        error_8 = _a.sent();
                        console.error('Error fetching conversation rules:', error_8);
                        return [2 /*return*/, []];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    ChatApiService.prototype.createSynthesisJob = function (jobData) {
        return __awaiter(this, void 0, void 0, function () {
            var response, error_9;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, apiRequest("".concat(this.baseUrl, "/synthesis"), {
                                method: 'POST',
                                data: jobData,
                            })];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response.data];
                    case 2:
                        error_9 = _a.sent();
                        console.error('Error creating synthesis job:', error_9);
                        return [2 /*return*/, null];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    ChatApiService.prototype.getSynthesisJobs = function () {
        return __awaiter(this, void 0, void 0, function () {
            var response, error_10;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, apiRequest("".concat(this.baseUrl, "/synthesis/all"), {
                                method: 'GET',
                            })];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response.data || []];
                    case 2:
                        error_10 = _a.sent();
                        console.error('Error fetching synthesis jobs:', error_10);
                        return [2 /*return*/, []];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // Mock AI API calls for development
    ChatApiService.prototype.callTextApi = function (prompt_1) {
        return __awaiter(this, arguments, void 0, function (prompt, systemPrompt) {
            var responses, error_11;
            if (systemPrompt === void 0) { systemPrompt = "You are a helpful assistant."; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        // Replace with actual AI service integration
                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 1000 + Math.random() * 2000); })];
                    case 1:
                        // Replace with actual AI service integration
                        _a.sent();
                        responses = [
                            "Based on your prompt: \"".concat(prompt.substring(0, 50), "...\", here's my response."),
                            "I understand you're asking about: ".concat(prompt.substring(0, 40), ". Let me help with that."),
                            "That's an interesting question. Regarding \"".concat(prompt.substring(0, 45), "...\", I think..."),
                        ];
                        return [2 /*return*/, responses[Math.floor(Math.random() * responses.length)]];
                    case 2:
                        error_11 = _a.sent();
                        console.error('Error calling text API:', error_11);
                        throw error_11;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    ChatApiService.prototype.callImageApi = function (prompt) {
        return __awaiter(this, void 0, void 0, function () {
            var error_12;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        // Mock image generation - replace with actual service
                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 2000 + Math.random() * 3000); })];
                    case 1:
                        // Mock image generation - replace with actual service
                        _a.sent();
                        // Return a placeholder image data
                        return [2 /*return*/, 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMiA2VjE4TTYgMTJIMTgiIHN0cm9rZT0iIzlDQTNBRiIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9zdmc+'];
                    case 2:
                        error_12 = _a.sent();
                        console.error('Error calling image API:', error_12);
                        throw error_12;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    return ChatApiService;
}());
export var chatApiService = new ChatApiService();
