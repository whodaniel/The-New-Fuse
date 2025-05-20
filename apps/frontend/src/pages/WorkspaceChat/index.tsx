"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
import react_1 from 'react';
import useRedisClient_1 from '../../hooks/useRedisClient.js';
import ChatMessage_1 from '../../components/ChatMessage.js';
import ChatInput_1 from '../../components/ChatInput.js';
const WorkspaceChat = () => {
    const [messages, setMessages] = (0, react_1.useState)([]);
    const { subscribe, publish, getClient } = (0, useRedisClient_1.useRedisClient)();
    const CHAT_CHANNEL = 'agent_chat';
    (0, react_1.useEffect)(() => {
        const initChat = async () => {
            const client = await getClient();
            subscribe(CHAT_CHANNEL, (message) => {
                const parsedMessage = JSON.parse(message);
                setMessages((prev: any) => [...prev, parsedMessage]);
            });
        };
        initChat();
    }, []);
    const sendMessage = async (content) => {
        const message = {
            id: Date.now().toString(),
            content,
            sender: 'user',
            timestamp: Date.now(),
        };
        await publish(CHAT_CHANNEL, JSON.stringify(message));
    };
    return (<div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((message) => (<ChatMessage_1.default key={message.id} message={message}/>))}
      </div>
      <div className="p-4 border-t">
        <ChatInput_1.default onSend={sendMessage}/>
      </div>
    </div>);
};
exports.default = WorkspaceChat;
export {};
//# sourceMappingURL=index.js.map