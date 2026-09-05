// @ts-nocheck
import React, { useEffect, useRef, useState } from 'react';
import {
  askOnboardingGreeter,
  type GreeterStepContext,
} from '../../services/onboardingGreeter';
import { useWizard } from './WizardProvider';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

interface GreeterAgentProps {
  initialMessage?: string;
  agentName?: string;
  agentAvatar?: string;
  /** Secret-scrubbed onboarding context for the AI greeter. */
  stepContext?: GreeterStepContext;
}

const GreeterMessageItem = React.memo<{
  message: Message;
  agentName: string;
}>(({ message, agentName }) => {
  return (
    <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] p-3 rounded-md ${
          message.role === 'user' ? 'bg-blue-50 text-gray-900' : 'bg-gray-100 text-gray-900'
        }`}
      >
        {message.role === 'assistant' && (
          <div className="flex items-center space-x-1 mb-1">
            <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center text-xs text-white font-semibold">
              {agentName.charAt(0)}
            </div>
            <span className="font-bold text-sm">{agentName}</span>
          </div>
        )}
        <p>{message.content}</p>
        <p className="text-xs text-muted-foreground text-right mt-1">
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
});
GreeterMessageItem.displayName = 'GreeterMessageItem';

export const GreeterAgent: React.FC<GreeterAgentProps> = ({
  initialMessage = "Hello! I'm your AI assistant for The New Fuse platform. I can help you get started and answer any questions you might have. What would you like to know?",
  agentName = 'Fuse Assistant',
  stepContext,
}) => {
  const { addConversation } = useWizard();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const systemMessage: Message = {
      id: 'system-1',
      role: 'system',
      content: `You are the Greeter Agent for The New Fuse platform. Your name is ${agentName}.`,
      timestamp: new Date(),
    };

    const initialGreeting: Message = {
      id: 'assistant-1',
      role: 'assistant',
      content: initialMessage,
      timestamp: new Date(),
    };

    setMessages([systemMessage, initialGreeting]);
    addConversation({ role: 'system', content: systemMessage.content });
    addConversation({ role: 'assistant', content: initialGreeting.content });
  }, [addConversation, agentName, initialMessage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const generateResponse = async (userMessage: string): Promise<string> => {
    setIsTyping(true);
    try {
      const history = messages
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

      const context: GreeterStepContext = stepContext ?? {
        stepLabel: 'Meet Your Assistant',
        userType: 'unknown',
      };

      const reply = await askOnboardingGreeter(userMessage, context, history);
      return reply.text;
    } catch (error) {
      console.error('Error generating greeter response:', error);
      return 'I encountered an issue trying to find an answer for you. Please try asking in a different way or check the documentation.';
    } finally {
      setIsTyping(false);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: `user-${messages.length}`,
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    addConversation({ role: 'user', content: input });
    setInput('');

    const responseContent = await generateResponse(input);
    const assistantMessage: Message = {
      id: `assistant-${messages.length + 1}`,
      role: 'assistant',
      content: responseContent,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, assistantMessage]);
    addConversation({ role: 'assistant', content: responseContent });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="rounded-md overflow-hidden bg-transparent shadow-md h-[500px] flex flex-col">
      <div className="p-4 bg-blue-600 text-white">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-sm font-semibold">
            {agentName.charAt(0)}
          </div>
          <span className="font-bold">{agentName}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages
          .filter((m) => m.role !== 'system')
          .map((message) => (
            <GreeterMessageItem key={message.id} message={message} agentName={agentName} />
          ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-100 p-3 rounded-md">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center text-xs text-white font-semibold">
                  {agentName.charAt(0)}
                </div>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <hr className="border-gray-200" />

      <div className="p-4">
        <div className="flex space-x-2">
          <input
            type="text"
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            disabled={isTyping}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          <button
            onClick={handleSendMessage}
            disabled={!input.trim() || isTyping}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isTyping ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Sending</span>
              </>
            ) : (
              <span>Send</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
