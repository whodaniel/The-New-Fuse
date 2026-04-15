
export {}
import vitest_1 from 'vitest';
import index_1 from '../index';
import api_1 from '../../services/api';
import agent_1 from '../../types/agent';
vitest_1.vi.mock('../../services/api', () => ({
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
}));
(0, vitest_1.describe)('Store Integration', () => {
    (0, vitest_1.beforeEach)(() => {
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
    (0, vitest_1.describe)('Agent State', () => {
        (0, vitest_1.it)('should update agents', () => {
            const mockAgents = [
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
        (0, vitest_1.it)('should select an agent', () => {
            const mockAgent = {
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
        (0, vitest_1.it)('should fetch agents', async () => {
            const mockApiAgents = [
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
            const expectedStoreAgents = mockApiAgents.map(agent_1.transformApiToStoreAgent);
            vitest_1.vi.mocked(api_1.agentService.getAllAgents).mockResolvedValue(mockApiAgents);
            await index_1.default.getState().fetchAgents();
            (0, vitest_1.expect)(api_1.agentService.getAllAgents).toHaveBeenCalled();
            (0, vitest_1.expect)(index_1.default.getState().agents).toEqual(expectedStoreAgents);
        });
    });
    (0, vitest_1.describe)('Chat State', () => {
        (0, vitest_1.it)('should update chats', () => {
            const mockChats = [
                { id: '1', title: 'Chat 1', messages: [] },
                { id: '2', title: 'Chat 2', messages: [] },
            ];
            index_1.default.getState().setChats(mockChats);
            (0, vitest_1.expect)(index_1.default.getState().chats).toEqual(mockChats);
        });
        (0, vitest_1.it)('should set active chat', () => {
            const mockChat = { id: '1', title: 'Chat 1', messages: [] };
            index_1.default.getState().setActiveChat(mockChat);
            (0, vitest_1.expect)(index_1.default.getState().activeChat).toEqual(mockChat);
        });
        (0, vitest_1.it)('should add message to chat', () => {
            const mockChat = { id: '1', title: 'Chat 1', messages: [] };
            const mockMessage = {
                id: '1',
                sender: 'user',
                content: 'Hello',
                timestamp: new Date(),
            };
            index_1.default.getState().setChats([mockChat]);
            index_1.default.getState().setActiveChat(mockChat);
            index_1.default.getState().addMessage(mockChat.id, mockMessage);
            const updatedChat = index_1.default.getState().chats[0];
            (0, vitest_1.expect)(updatedChat.messages).toHaveLength(1);
            (0, vitest_1.expect)(updatedChat.messages[0]).toEqual(mockMessage);
        });
        (0, vitest_1.it)('should create a new chat', async () => {
            const mockResponse = {
                status: 'success',
                conversationId: 1,
                message: 'Conversation started',
            };
            vitest_1.vi.mocked(api_1.chatService.startConversation).mockResolvedValue(mockResponse);
            await index_1.default.getState().createChat('user1');
            (0, vitest_1.expect)(api_1.chatService.startConversation).toHaveBeenCalledWith('user1');
            (0, vitest_1.expect)(index_1.default.getState().chats).toHaveLength(1);
            (0, vitest_1.expect)(index_1.default.getState().activeChat?.id).toBe('1');
        });
    });
    (0, vitest_1.describe)('System State', () => {
        (0, vitest_1.it)('should update loading state', () => {
            index_1.default.getState().setLoading(true);
            (0, vitest_1.expect)(index_1.default.getState().isLoading).toBe(true);
            index_1.default.getState().setLoading(false);
            (0, vitest_1.expect)(index_1.default.getState().isLoading).toBe(false);
        });
        (0, vitest_1.it)('should update error state', () => {
            const errorMessage = 'Test error';
            index_1.default.getState().setError(errorMessage);
            (0, vitest_1.expect)(index_1.default.getState().error).toBe(errorMessage);
            index_1.default.getState().setError(null);
            (0, vitest_1.expect)(index_1.default.getState().error).toBeNull();
        });
    });
});

export {};
