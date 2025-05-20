Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatInterface = ChatInterface;
import react_1 from 'react';
import card_1 from './ui/card.js';
import input_1 from './ui/input.js';
import button_1 from './ui/button.js';
import scroll_area_1 from './ui/scroll-area.js';
import SocketContext_1 from '../services/SocketContext.js';
import theme_context_1 from '../contexts/theme-context.js';
import useMessages_1 from '../hooks/useMessages.js';
import useAgents_1 from '../hooks/useAgents.js';
import EnhancedChatBubble_1 from './chat/EnhancedChatBubble.js';
import typing_indicator_1 from './typing-indicator.js';
import agent_selector_1 from './agent-selector.js';
import message_utils_1 from '../utils/message-utils.js';
function ChatInterface() {
    var _a;
    const [input, setInput] = (0, react_1.useState)('');
    const scrollRef = (0, react_1.useRef)(null);
    const { isConnected } = (0, SocketContext_1.useSocket)();
    const { theme } = (0, theme_context_1.useTheme)();
    const { agents, selectedAgent, conversationId, selectAgent, clearConversation: resetConversation } = (0, useAgents_1.useAgents)();
    const { messages, isTyping, sendMessage, clearMessages: resetMessages, loadMessages } = (0, useMessages_1.useMessages)(selectedAgent, conversationId);
    (0, react_1.useEffect)(() => {
        if (conversationId) {
            loadMessages(conversationId);
        }
    }, [conversationId]);
    (0, react_1.useEffect)(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);
    const handleSendMessage = async () => {
        if ((0, message_utils_1.validateMessage)(input)) {
            const success = await sendMessage(input);
            if (success) {
                setInput('');
            }
        }
    };
    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };
    const handleClearConversation = async () => {
        const success = await resetMessages();
        if (success) {
            resetConversation();
        }
    };
    return (<card_1.Card className="w-full min-h-[600px] max-h-screen flex flex-col bg-white dark:bg-neutral-900 shadow-lg">
      <card_1.CardHeader className="border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <agent_selector_1.AgentSelector agents={agents} selectedAgent={selectedAgent} onSelect={selectAgent}/>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}/>
              <span className="text-sm text-neutral-600 dark:text-neutral-400">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <button_1.Button variant="outline" size="sm" onClick={handleClearConversation} disabled={!selectedAgent}>
              Clear Chat
            </button_1.Button>
          </div>
        </div>
      </card_1.CardHeader>
      <card_1.CardContent className="flex-grow flex flex-col p-4">
        <scroll_area_1.ScrollArea className="flex-grow pr-4">
          <div className="space-y-4">
            {messages.map((message) => {
            var _a;
            return (<EnhancedChatBubble_1.EnhancedChatBubble key={message.id} message={{
                    id: message.id,
                    content: message.content,
                    timestamp: message.timestamp,
                    sender: {
                        id: message.sender === 'User' ? 'user' : message.agentId || 'system',
                        type: message.sender === 'User' ? 'user' : 'agent',
                        name: message.sender === 'User' ? 'User' : (_a = agents.find(a => a.id === message.agentId)) === null || _a === void 0 ? void 0 : _a.name,
                    },
                    metadata: {
                        agentId: message.agentId,
                        workspaceId: '',
                        llmProvider: '',
                    },
                }} agents={agents} workspace={null}/>);
        })}
            {isTyping && <typing_indicator_1.TypingIndicator />}
            <div ref={scrollRef}/>
          </div>
        </scroll_area_1.ScrollArea>
        <div className="flex items-center gap-2 mt-4">
          <input_1.Input value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={handleKeyPress} placeholder={selectedAgent
            ? `Message ${(_a = agents.find(a => a.id === selectedAgent)) === null || _a === void 0 ? void 0 : _a.name}...`
            : "Select an agent to start chatting..."} className="flex-grow" disabled={!selectedAgent || !isConnected}/>
          <button_1.Button onClick={handleSendMessage} disabled={!(0, message_utils_1.validateMessage)(input) || !isConnected || !selectedAgent} className="px-6">
            Send
          </button_1.Button>
        </div>
      </card_1.CardContent>
    </card_1.Card>);
}
export {};
//# sourceMappingURL=chat-interface.js.map