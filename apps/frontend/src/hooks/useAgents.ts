export {}
exports.useAgents = useAgents;
import react_1 from 'react';
import SocketContext_1 from '../services/SocketContext.js';
import chatService_1 from '../services/api/chatService.js';
const DEFAULT_AGENTS = [
    { id: '1', name: 'Assistant', type: 'general', status: 'active' },
    { id: '2', name: 'Code Expert', type: 'specialist', status: 'active' },
    { id: '3', name: 'Data Analyst', type: 'specialist', status: 'active' },
];
function useAgents(): any {
    const [agents, setAgents] = (0, react_1.useState)(DEFAULT_AGENTS);
    const [selectedAgent, setSelectedAgent] = (0, react_1.useState)(null);
    const [conversationId, setConversationId] = (0, react_1.useState)(null);
    const { socket } = (0, SocketContext_1.useSocket)();
    (0, react_1.useEffect)(() => {
        if (!socket)
            return;
        socket.on('agentUpdate', (updatedAgents) => {
            setAgents(updatedAgents);
        });
        return () => {
            socket.off('agentUpdate');
        };
    }, [socket]);
    (0, react_1.useEffect)(() => {
        if (selectedAgent) {
            const startNewConversation = async () => {
                try {
                    const response = await chatService_1.chatService.startConversation(selectedAgent);
                    if (response.status === 'success') {
                        setConversationId(response.conversationId);
                    }
                }
                catch (error) {
                    console.error('Failed to start conversation:', error);
                }
            };
            startNewConversation();
        }
    }, [selectedAgent]);
    const selectAgent = (agentId): any => {
        setSelectedAgent(agentId);
    };
    const clearConversation = (): any => {
        setConversationId(null);
    };
    return {
        agents,
        selectedAgent,
        conversationId,
        selectAgent,
        clearConversation
    };
}
export {};
//# sourceMappingURL=useAgents.js.map