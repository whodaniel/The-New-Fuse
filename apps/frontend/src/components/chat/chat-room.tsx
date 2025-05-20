"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatRoom = ChatRoom;
import react_1 from 'react';
import card_1 from '@/components/ui/card';
import button_1 from '@/components/ui/button';
import input_1 from '@/components/ui/input';
import scroll_area_1 from '@/components/ui/scroll-area';
import avatar_1 from '@/components/ui/avatar';
import websocket_1 from '../services/websocket.js';
function ChatRoom({ roomId, agents }) {
    const [messages, setMessages] = (0, react_1.useState)([]);
    const [input, setInput] = (0, react_1.useState)('');
    (0, react_1.useEffect)(() => {
        websocket_1.webSocketService.on(`chatRoom:${roomId}`, (data) => {
            setMessages((prev: any) => [...prev, data]);
        });
        return () => {
            websocket_1.webSocketService.off(`chatRoom:${roomId}`, () => { });
        };
    }, [roomId]);
    const handleSend = () => {
        if (input.trim()) {
            websocket_1.webSocketService.send('chatMessage', { roomId, message: input });
            setInput('');
        }
    };
    return (<card_1.Card className="w-full max-w-2xl h-[600px] flex flex-col">
      <card_1.CardHeader>
        <card_1.CardTitle>Chat Room: {roomId}</card_1.CardTitle>
      </card_1.CardHeader>
      <card_1.CardContent className="flex-grow flex flex-col">
        <scroll_area_1.ScrollArea className="flex-grow mb-4">
          {messages.map((msg, index) => (<div key={index} className="flex items-start space-x-2 mb-4">
              <avatar_1.Avatar>
                <avatar_1.AvatarImage src={msg.agent.avatar} alt={msg.agent.name}/>
                <avatar_1.AvatarFallback>{msg.agent.name[0]}</avatar_1.AvatarFallback>
              </avatar_1.Avatar>
              <div>
                <p className="font-semibold">{msg.agent.name}</p>
                <p>{msg.content}</p>
              </div>
            </div>))}
        </scroll_area_1.ScrollArea>
        <div className="flex space-x-2">
          <input_1.Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type a message..." onKeyPress={(e) => e.key === 'Enter' && handleSend()}/>
          <button_1.Button onClick={handleSend}>Send</button_1.Button>
        </div>
      </card_1.CardContent>
    </card_1.Card>);
}
export {};
//# sourceMappingURL=chat-room.js.map