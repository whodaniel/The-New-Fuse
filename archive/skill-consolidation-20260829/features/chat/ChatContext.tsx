
var __assign = (this && this.__assign) || function (): any {
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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator): any {
    function adopt(value): any { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject): any {
        function fulfilled(value): any { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value): any { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result): any { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body): any {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n): any { return function (v) { return step([n, v]); }; }
    function step(op): any {
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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack): any {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
export {}
exports.useChat = exports.ChatProvider = void 0;
var react_1 = require("react");
var initialState = {
    messages: [],
    participants: [],
    status: idle',
};
var chatReducer = function (state, action): any {
    switch (action.type) {
        case 'ADD_MESSAGE':
            return __assign(__assign({}, state), { messages: __spreadArray(__spreadArray([], state.messages, true), [action.payload], false), error: undefined });
        case 'SET_STATUS':
            return __assign(__assign({}, state), { status: action.payload });
        case 'SET_ERROR':
            return __assign(__assign({}, state), { error: action.payload, status: idle' });
        case 'CLEAR_CHAT':
            return __assign(__assign({}, initialState), { participants: state.participants });
        default:
            return state;
    }
};
var ChatContext = (0, react_1.createContext)(undefined);
var ChatProvider = function (_a): any {
    var children = _a.children, onSendMessage = _a.onSendMessage;
    var _b = (0, react_1.useReducer)(chatReducer, initialState), state = _b[0], dispatch = _b[1];
    var sendMessage = (0, react_1.useCallback)(function (content, attachments): any { return __awaiter(void 0, void 0, void 0, function () {
        var message, error_1;
        return __generator(this, function (_a): any {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    dispatch({ type: SET_STATUS', payload: processing' });
                    message = {
                        id: Date.now().toString(),
                        content: content,
                        sender: user',
                        timestamp: new Date(),
                        type: text',
                        attachments: attachments === null || attachments === void 0 ? void 0 : attachments.map(function (file): any { return ({
                            id: Math.random().toString(),
                            name: file.name,
                            type: file.type,
                            url: URL.createObjectURL(file),
                            size: file.size,
                        }); }),
                    };
                    dispatch({ type: ADD_MESSAGE', payload: message });
                    if (!onSendMessage) return [3 /*break*/, 2];
                    return [4 /*yield*/, onSendMessage(content, attachments)];
                case 1:
                    _a.sent();
                    _a.label = 2;
                case 2:
                    dispatch({ type: SET_STATUS', payload: idle' });
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _a.sent();
                    dispatch({
                        type: SET_ERROR',
                        payload: error_1 instanceof Error ? error_1.message : Failed to send message',
                    });
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); }, [onSendMessage]);
    var clearChat = (0, react_1.useCallback)(function (): any {
        dispatch({ type: CLEAR_CHAT' });
    }, []);
    var setError = (0, react_1.useCallback)(function (error): any {
        dispatch({ type: SET_ERROR', payload: error });
    }, []);
    var value = {
        state: state,
        sendMessage: sendMessage,
        clearChat: clearChat,
        setError: setError,
    };
    return (<ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>);
};
exports.ChatProvider = ChatProvider;
var useChat = function (): any {
    var context = (0, react_1.useContext)(ChatContext);
    if (context === undefined) {
        throw new Error('useChat must be used within a ChatProvider');
    }
    return context;
};
exports.useChat = useChat;
export {};
