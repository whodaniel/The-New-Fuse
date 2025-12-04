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
exports.useMessages = useMessages;
import react_1 from 'react';
import chatService_1 from '../services/api/chatService';
import SocketContext_1 from '../services/SocketContext';
import message_utils_1 from '../utils/message-utils';
function useMessages(selectedAgent, conversationId) {
    var _this = this;
    var _a = (0, react_1.useState)([]), messages = _a[0], setMessages = _a[1];
    var _b = (0, react_1.useState)(false), isTyping = _b[0], setIsTyping = _b[1];
    var socket = (0, SocketContext_1.useSocket)().socket;
    (0, react_1.useEffect)(function () {
        if (!socket)
            return;
        socket.on('chatMessage', function (message) {
            setMessages(function (prevMessages) { return __spreadArray(__spreadArray([], prevMessages, true), [Object.assign(Object.assign({}, message), { timestamp: new Date(message.timestamp) })], false); });
            setIsTyping(false);
        });
        socket.on('agentTyping', function () {
            setIsTyping(true);
        });
        return function () {
            socket.off('chatMessage');
            socket.off('agentTyping');
        };
    }, [socket]);
    var loadMessages = function (conversationId) { return __awaiter(_this, void 0, void 0, function () {
        var messagesResponse, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, chatService_1.chatService.getConversationMessages(conversationId)];
                case 1:
                    messagesResponse = _a.sent();
                    if (messagesResponse.status === 'success') {
                        setMessages(messagesResponse.messages.map(message_utils_1.mapMessageResponseToMessage));
                    }
                    return [3 /*break*/, 3];
                case 2:
                    error_1 = _a.sent();
                    console.error('Failed to load messages:', error_1);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); };
    var sendMessage = function (content) { return __awaiter(_this, void 0, void 0, function () {
        var message, response, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!selectedAgent || !conversationId || !(0, message_utils_1.validateMessage)(content))
                        return [2 /*return*/, false];
                    message = (0, message_utils_1.createUserMessage)(content, selectedAgent);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, chatService_1.chatService.sendMessage(selectedAgent, content)];
                case 2:
                    response = _a.sent();
                    if (response.status === 'success') {
                        socket === null || socket === void 0 ? void 0 : socket.emit('sendChatMessage', (0, message_utils_1.createSocketPayload)(message, conversationId));
                        setMessages(function (prev) { return __spreadArray(__spreadArray([], prev, true), [message], false); });
                        return [2 /*return*/, true];
                    }
                    return [3 /*break*/, 4];
                case 3:
                    error_2 = _a.sent();
                    console.error('Failed to send message:', error_2);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/, false];
            }
        });
    }); };
    var clearMessages = function () { return __awaiter(_this, void 0, void 0, function () {
        var response, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!selectedAgent)
                        return [2 /*return*/, false];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, chatService_1.chatService.clearConversation(selectedAgent)];
                case 2:
                    response = _a.sent();
                    if (response.status === 'success') {
                        setMessages([]);
                        return [2 /*return*/, true];
                    }
                    return [3 /*break*/, 4];
                case 3:
                    error_3 = _a.sent();
                    console.error('Failed to clear messages:', error_3);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/, false];
            }
        });
    }); };
    return {
        messages: messages,
        isTyping: isTyping,
        sendMessage: sendMessage,
        clearMessages: clearMessages,
        loadMessages: loadMessages
    };
}
