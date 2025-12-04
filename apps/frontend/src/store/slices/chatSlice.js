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
var _a;
import { createSlice } from '@reduxjs/toolkit';
import fetcher from '../../services/api/fetcher';
import { transformApiConversation } from '../../types/api';
var initialState = {
    conversations: [],
    loading: false,
    error: null,
};
var chatSlice = createSlice({
    name: 'chat',
    initialState: initialState,
    reducers: {
        fetchConversationsStart: function (state) {
            state.loading = true;
            state.error = null;
        },
        fetchConversationsSuccess: function (state, action) {
            state.conversations = action.payload;
            state.loading = false;
        },
        fetchConversationsFailure: function (state, action) {
            state.error = action.payload;
            state.loading = false;
        },
        updateConversationSuccess: function (state, action) {
            var index = state.conversations.findIndex(function (conv) { return conv.id === action.payload.id; });
            if (index !== -1) {
                state.conversations[index] = action.payload;
            }
        },
        createConversationSuccess: function (state, action) {
            state.conversations.push(action.payload);
        },
    },
});
export var fetchConversationsStart = (_a = chatSlice.actions, _a.fetchConversationsStart), fetchConversationsSuccess = _a.fetchConversationsSuccess, fetchConversationsFailure = _a.fetchConversationsFailure, updateConversationSuccess = _a.updateConversationSuccess, createConversationSuccess = _a.createConversationSuccess;
export var fetchConversations = function (userId) { return function (dispatch) { return __awaiter(void 0, void 0, void 0, function () {
    var response, conversations, error_1, errorMessage;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                dispatch(fetchConversationsStart());
                return [4 /*yield*/, fetcher.get('/api/chat/conversations', { params: { user_id: userId } })];
            case 1:
                response = _a.sent();
                conversations = response.data.map(transformApiConversation);
                dispatch(fetchConversationsSuccess(conversations));
                return [3 /*break*/, 3];
            case 2:
                error_1 = _a.sent();
                errorMessage = error_1 instanceof Error ? error_1.message : 'An unknown error occurred';
                dispatch(fetchConversationsFailure(errorMessage));
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); }; };
export var updateConversation = function (conversationId, conversationData) { return function (dispatch) { return __awaiter(void 0, void 0, void 0, function () {
    var response, finalConversation, error_2, errorMessage;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, fetcher.put("/api/chat/conversations/".concat(conversationId), conversationData)];
            case 1:
                response = _a.sent();
                finalConversation = transformApiConversation(response.data);
                dispatch(updateConversationSuccess(finalConversation));
                return [3 /*break*/, 3];
            case 2:
                error_2 = _a.sent();
                errorMessage = error_2 instanceof Error ? error_2.message : 'An unknown error occurred';
                dispatch(fetchConversationsFailure(errorMessage));
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); }; };
export var createConversation = function (userId) { return function (dispatch) { return __awaiter(void 0, void 0, void 0, function () {
    var response, newConversation, error_3, errorMessage;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, fetcher.post('/api/chat/start', { user_id: userId })];
            case 1:
                response = _a.sent();
                newConversation = transformApiConversation(response.data);
                dispatch(createConversationSuccess(newConversation));
                return [3 /*break*/, 3];
            case 2:
                error_3 = _a.sent();
                errorMessage = error_3 instanceof Error ? error_3.message : 'An unknown error occurred';
                dispatch(fetchConversationsFailure(errorMessage));
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); }; };
export default chatSlice.reducer;
