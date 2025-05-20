export {}
exports.useMessages = useMessages;
import react_1 from 'react';
import chatService_1 from '../services/api/chatService.js';
import SocketContext_1 from '../services/SocketContext.js';
import message_utils_1 from '../utils/message-utils.js';
function useMessages(selectedAgent, conversationId): any {
    const [messages, setMessages] = (0, react_1.useState)([]);
    const [isTyping, setIsTyping] = (0, react_1.useState)(false);
    const { socket } = (0, SocketContext_1.useSocket)();
    (0, react_1.useEffect)(() => {
        if (!socket)
            return;
        socket.on('chatMessage', (message) => {
            setMessages(prevMessages => [...prevMessages, Object.assign(Object.assign({}, message), { timestamp: new Date(message.timestamp) })]);
            setIsTyping(false);
        });
        socket.on('agentTyping', () => {
            setIsTyping(true);
        });
        return () => {
            socket.off('chatMessage');
            socket.off('agentTyping');
        };
    }, [socket]);
    const loadMessages = async (conversationId) => {
        try {
            const messagesResponse = await chatService_1.chatService.getConversationMessages(conversationId);
            if (messagesResponse.status === 'success') {
                setMessages(messagesResponse.messages.map(message_utils_1.mapMessageResponseToMessage));
            }
        }
        catch (error) {
            console.error('Failed to load messages:', error);
        }
    };
    const sendMessage = async (content) => {
        if (!selectedAgent || !conversationId || !(0, message_utils_1.validateMessage)(content))
            return false;
        const message = (0, message_utils_1.createUserMessage)(content, selectedAgent);
        try {
            const response = await chatService_1.chatService.sendMessage(selectedAgent, content);
            if (response.status === 'success') {
                socket === null || socket === void 0 ? void 0 : socket.emit('sendChatMessage', (0, message_utils_1.createSocketPayload)(message, conversationId));
                setMessages(prev => [...prev, message]);
                return true;
            }
        }
        catch (error) {
            console.error('Failed to send message:', error);
        }
        return false;
    };
    const clearMessages = async () => {
        if (!selectedAgent)
            return false;
        try {
            const response = await chatService_1.chatService.clearConversation(selectedAgent);
            if (response.status === 'success') {
                setMessages([]);
                return true;
            }
        }
        catch (error) {
            console.error('Failed to clear messages:', error);
        }
        return false;
    };
    return {
        messages,
        isTyping,
        sendMessage,
        clearMessages,
        loadMessages
    };
}
export {};
//# sourceMappingURL=useMessages.js.map