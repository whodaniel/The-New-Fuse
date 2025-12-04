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
import vitest_1 from 'vitest';
import index_1 from '../index';
import api_1 from '../../services/api';
import agent_1 from '../../types/agent';
vitest_1.vi.mock('../../services/api', function () { return ({
    chatService: {
        startConversation: vitest_1.vi.fn(),
        sendMessage: vitest_1.vi.fn(),
        clearConversation: vitest_1.vi.fn(),
        getConversations: vitest_1.vi.fn(),
        getConversationMessages: vitest_1.vi.fn(),
    },
    agentService: {
        getAllAgents: vitest_1.vi.fn(),
        updateAgent: vitest_1.vi.fn(),
        createAgent: vitest_1.vi.fn(),
        deleteAgent: vitest_1.vi.fn(),
        updateAgentSkills: vitest_1.vi.fn(),
    },
}); });
(0, vitest_1.describe)('Store Integration', function () {
    (0, vitest_1.beforeEach)(function () {
        vitest_1.vi.clearAllMocks();
        index_1.default.setState({
            // Agent State
            agents: [],
            selectedAgent: null,
            // Chat State
            chats: [],
            activeChat: null,
            // System State
            isLoading: false,
            error: null,
        });
    });
    (0, vitest_1.describe)('Agent State', function () {
        (0, vitest_1.it)('should update agents', function () {
            var mockAgents = [
                {
                    id: '1',
                    name: 'Agent 1',
                    status: 'idle',
                    type: 'assistant',
                    personality: 'Helpful',
                    skills: ['chat', 'analysis']
                },
                {
                    id: '2',
                    name: 'Agent 2',
                    status: 'busy',
                    type: 'specialist',
                    personality: 'Professional',
                    skills: ['coding', 'debugging']
                },
            ];
            index_1.default.getState().setAgents(mockAgents);
            (0, vitest_1.expect)(index_1.default.getState().agents).toEqual(mockAgents);
        });
        (0, vitest_1.it)('should select an agent', function () {
            var mockAgent = {
                id: '1',
                name: 'Agent 1',
                status: 'idle',
                type: 'assistant',
                personality: 'Helpful',
                skills: ['chat', 'analysis']
            };
            index_1.default.getState().setSelectedAgent(mockAgent);
            (0, vitest_1.expect)(index_1.default.getState().selectedAgent).toEqual(mockAgent);
        });
        (0, vitest_1.it)('should fetch agents', function () { return __awaiter(void 0, void 0, void 0, function () {
            var mockApiAgents, expectedStoreAgents;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        mockApiAgents = [
                            {
                                id: '1',
                                name: 'Agent 1',
                                status: 'idle',
                                type: 'assistant',
                                personality: 'Helpful',
                                skills: ['chat', 'analysis'],
                                createdAt: new Date().toISOString(),
                                updatedAt: new Date().toISOString(),
                            },
                        ];
                        expectedStoreAgents = mockApiAgents.map(agent_1.transformApiToStoreAgent);
                        vitest_1.vi.mocked(api_1.agentService.getAllAgents).mockResolvedValue(mockApiAgents);
                        return [4 /*yield*/, index_1.default.getState().fetchAgents()];
                    case 1:
                        _a.sent();
                        (0, vitest_1.expect)(api_1.agentService.getAllAgents).toHaveBeenCalled();
                        (0, vitest_1.expect)(index_1.default.getState().agents).toEqual(expectedStoreAgents);
                        return [2 /*return*/];
                }
            });
        }); });
    });
    (0, vitest_1.describe)('Chat State', function () {
        (0, vitest_1.it)('should update chats', function () {
            var mockChats = [
                { id: '1', title: 'Chat 1', messages: [] },
                { id: '2', title: 'Chat 2', messages: [] },
            ];
            index_1.default.getState().setChats(mockChats);
            (0, vitest_1.expect)(index_1.default.getState().chats).toEqual(mockChats);
        });
        (0, vitest_1.it)('should set active chat', function () {
            var mockChat = { id: '1', title: 'Chat 1', messages: [] };
            index_1.default.getState().setActiveChat(mockChat);
            (0, vitest_1.expect)(index_1.default.getState().activeChat).toEqual(mockChat);
        });
        (0, vitest_1.it)('should add message to chat', function () {
            var mockChat = { id: '1', title: 'Chat 1', messages: [] };
            var mockMessage = {
                id: '1',
                sender: 'user',
                content: 'Hello',
                timestamp: new Date(),
            };
            index_1.default.getState().setChats([mockChat]);
            index_1.default.getState().setActiveChat(mockChat);
            index_1.default.getState().addMessage(mockChat.id, mockMessage);
            var updatedChat = index_1.default.getState().chats[0];
            (0, vitest_1.expect)(updatedChat.messages).toHaveLength(1);
            (0, vitest_1.expect)(updatedChat.messages[0]).toEqual(mockMessage);
        });
        (0, vitest_1.it)('should create a new chat', function () { return __awaiter(void 0, void 0, void 0, function () {
            var mockResponse;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        mockResponse = {
                            status: 'success',
                            conversationId: 1,
                            message: 'Conversation started',
                        };
                        vitest_1.vi.mocked(api_1.chatService.startConversation).mockResolvedValue(mockResponse);
                        return [4 /*yield*/, index_1.default.getState().createChat('user1')];
                    case 1:
                        _b.sent();
                        (0, vitest_1.expect)(api_1.chatService.startConversation).toHaveBeenCalledWith('user1');
                        (0, vitest_1.expect)(index_1.default.getState().chats).toHaveLength(1);
                        (0, vitest_1.expect)((_a = index_1.default.getState().activeChat) === null || _a === void 0 ? void 0 : _a.id).toBe('1');
                        return [2 /*return*/];
                }
            });
        }); });
    });
    (0, vitest_1.describe)('System State', function () {
        (0, vitest_1.it)('should update loading state', function () {
            index_1.default.getState().setLoading(true);
            (0, vitest_1.expect)(index_1.default.getState().isLoading).toBe(true);
            index_1.default.getState().setLoading(false);
            (0, vitest_1.expect)(index_1.default.getState().isLoading).toBe(false);
        });
        (0, vitest_1.it)('should update error state', function () {
            var errorMessage = 'Test error';
            index_1.default.getState().setError(errorMessage);
            (0, vitest_1.expect)(index_1.default.getState().error).toBe(errorMessage);
            index_1.default.getState().setError(null);
            (0, vitest_1.expect)(index_1.default.getState().error).toBeNull();
        });
    });
});
