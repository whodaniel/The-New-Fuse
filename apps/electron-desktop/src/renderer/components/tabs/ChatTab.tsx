import { Alert, Badge, Button, Container } from '@the-new-fuse/ui-consolidated';
import React, { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { FiDownload, FiSend, FiTrash2 } from 'react-icons/fi';
import { useSelector } from 'react-redux';
import type { ChatMessage } from '../../shared/types';
import type { RootState } from '../../store/store';

export const ChatTab: React.FC = () => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages } = useSelector((state: RootState) => state.chat);
  const { tnfRelay } = useSelector((state: RootState) => state.connections);
  const { elements } = useSelector((state: RootState) => state.elements);

  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    if (!tnfRelay.connected) {
      toast.error('Not Connected - Please connect to TNF Relay first');
      return;
    }

    setIsSending(true);
    try {
      if (window.api) {
        await window.api.sendChatMessage(inputMessage);
        setInputMessage('');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const handleClearChat = async () => {
    try {
      if (window.api) {
        await window.api.clearChatHistory();
        toast.success('Chat history cleared');
      }
    } catch (error) {
      console.error('Failed to clear chat:', error);
      toast.error('Failed to clear chat history');
    }
  };

  const handleExportChat = async () => {
    try {
      if (window.api) {
        await window.api.exportChatHistory();
        toast.success('Chat history exported');
      }
    } catch (error) {
      console.error('Failed to export chat:', error);
      toast.error('Failed to export chat history');
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const renderMessage = (message: ChatMessage, index: number) => {
    const isUser = message.role === 'user';

    return (
      <div key={index} className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
        <div
          className={`flex ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start space-x-3 max-w-[80%]`}
        >
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              isUser ? 'bg-blue-500 text-white ml-3' : 'bg-gray-300 text-gray-700 mr-3'
            }`}
          >
            {isUser ? 'U' : 'A'}
          </div>

          <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
            <div
              className={`px-4 py-2 rounded-lg ${
                isUser ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-900 border'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            </div>

            <div className="flex items-center mt-1 space-x-2">
              <span className="text-xs text-gray-500">{formatTimestamp(message.timestamp)}</span>
              {message.elementContext && (
                <Badge variant="secondary" className="text-xs">
                  Element Context
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Container className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div>
          <h2 className="text-lg font-semibold">Chat Interface</h2>
          <p className="text-sm text-gray-600">
            Communicate with connected systems through TNF Relay
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Badge variant={tnfRelay.connected ? 'default' : 'destructive'}>
            {tnfRelay.connected ? 'Connected' : 'Disconnected'}
          </Badge>

          <button
            onClick={handleExportChat}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md"
            title="Export Chat"
          >
            <FiDownload size={16} />
          </button>

          <button
            onClick={handleClearChat}
            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md"
            title="Clear Chat"
          >
            <FiTrash2 size={16} />
          </button>
        </div>
      </div>

      {/* Connection Status Alert */}
      {!tnfRelay.connected && (
        <Alert variant="destructive" className="m-4">
          <div className="flex items-center">
            <span className="mr-2">⚠️</span>
            <div>
              <h4 className="font-medium">Not Connected</h4>
              <p className="text-sm">Connect to TNF Relay to start chatting</p>
            </div>
          </div>
        </Alert>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500">
              <p className="text-lg font-medium">No messages yet</p>
              <p className="text-sm">Start a conversation by typing a message below</p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message, index) => renderMessage(message, index))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t p-4">
        <div className="flex space-x-3">
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 min-h-[60px] max-h-32 p-3 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            disabled={isSending || !tnfRelay.connected}
          />

          <Button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isSending || !tnfRelay.connected}
            className="px-4 py-2 h-fit"
          >
            {isSending ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <FiSend size={16} />
            )}
          </Button>
        </div>

        {elements.length > 0 && (
          <div className="mt-3 p-3 bg-gray-50 rounded-md">
            <p className="text-sm font-medium text-gray-700 mb-2">
              Available Elements ({elements.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {elements.slice(0, 5).map((element, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {element.type}: {element.selector.slice(0, 20)}...
                </Badge>
              ))}
              {elements.length > 5 && (
                <Badge variant="outline" className="text-xs">
                  +{elements.length - 5} more
                </Badge>
              )}
            </div>
          </div>
        )}
      </div>
    </Container>
  );
};
