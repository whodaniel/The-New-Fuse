"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIAssistant = AIAssistant;
import react_1 from 'react';
import lucide_react_1 from 'lucide-react';
import button_1 from '@/components/ui/button';
import card_1 from '@/components/ui/card';
import input_1 from '@/components/ui/input';
import websocket_1 from '../services/websocket.js';
function AIAssistant() {
    const [isOpen, setIsOpen] = (0, react_1.useState)(false);
    const [messages, setMessages] = (0, react_1.useState)([]);
    const [input, setInput] = (0, react_1.useState)('');
    (0, react_1.useEffect)(() => {
        websocket_1.webSocketService.on('aiInsight', (insight) => {
            setMessages((prev: any) => [...prev, { type: 'ai', content: insight }]);
        });
        return () => {
            websocket_1.webSocketService.off('aiInsight', () => { });
        };
    }, []);
    const handleSendMessage = () => {
        if (input.trim()) {
            setMessages((prev: any) => [...prev, { type: 'user', content: input }]);
            websocket_1.webSocketService.send('userMessage', { message: input });
            setInput('');
        }
    };
    return (<div className="fixed bottom-4 right-4">
      {!isOpen && (<button_1.Button onClick={() => setIsOpen(true)} className="rounded-full h-16 w-16">
          <lucide_react_1.Bot className="h-8 w-8"/>
        </button_1.Button>)}
      {isOpen && (<card_1.Card className="w-80 h-96 flex flex-col">
          <card_1.CardHeader className="flex flex-row items-center justify-between">
            <card_1.CardTitle>AI Assistant</card_1.CardTitle>
            <button_1.Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
              <lucide_react_1.X className="h-4 w-4"/>
            </button_1.Button>
          </card_1.CardHeader>
          <card_1.CardContent className="flex-grow overflow-auto">
            <div className="space-y-4">
              {messages.map((msg, index) => (<div key={index} className={`p-2 rounded-lg ${msg.type === 'user' ? 'bg-blue-500 text-white self-end' : 'bg-gray-200 text-black self-start'}`}>
                  {msg.content}
                </div>))}
            </div>
          </card_1.CardContent>
          <div className="p-4 border-t flex">
            <input_1.Input value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()} placeholder="Ask me anything..." className="flex-grow"/>
            <button_1.Button onClick={handleSendMessage} className="ml-2">Send</button_1.Button>
          </div>
        </card_1.Card>)}
    </div>);
}
export {};
//# sourceMappingURL=ai-assistant.js.map