import React, { useRef, useEffect } from 'react';
import { MessageListProps, Message, ChatParticipant } from './types';

interface MessageItemProps {
  message: Message;
  participants: ChatParticipant[];
  isOwn?: boolean;
}

const MessageItem: React.FC<MessageItemProps> = ({ 
  message, 
  participants, 
  isOwn = false 
}) => {
  const participant = participants.find(p => p.id === message.sender);
  const senderName = participant?.name || message.sender;
  
  const formatTime = (timestamp: Date) => {
    return new Intl.DateTimeFormat('default', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(timestamp);
  };

  return (
    <div className={`flex mb-4 ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[70%] ${isOwn ? 'order-2' : 'order-1'}`}>
        {!isOwn && (
          <div className="flex items-center mb-1">
            {participant?.avatar && (
              <img 
                src={participant.avatar} 
                alt={senderName}
                className="w-6 h-6 rounded-full mr-2"
              />
            )}
            <span className="text-sm font-medium text-gray-700">
              {senderName}
            </span>
          </div>
        )}
        
        <div className={`
          rounded-lg px-3 py-2 
          ${isOwn 
            ? 'bg-blue-500 text-white' 
            : 'bg-gray-100 text-gray-900'
          }
        `}>
          <div className="text-sm">
            {message.content}
          </div>
          
          {message.metadata?.attachments && message.metadata.attachments.length > 0 && (
            <div className="mt-2 space-y-1">
              {message.metadata.attachments.map(attachment => (
                <div key={attachment.id} className="flex items-center gap-2 p-2 bg-white/10 rounded">
                  <span className="text-xs">📎</span>
                  <span className="text-xs truncate">{attachment.name}</span>
                </div>
              ))}
            </div>
          )}
          
          <div className={`text-xs mt-1 ${isOwn ? 'text-blue-100' : 'text-gray-500'}`}>
            {formatTime(message.timestamp)}
            {message.metadata?.isEdited && (
              <span className="ml-1">(edited)</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const MessageList: React.FC<MessageListProps> = ({ 
  messages, 
  participants, 
  className = '' 
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentUserId = 'user'; // This would typically come from auth context

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const groupedMessages = messages.reduce((groups, message) => {
    const dateKey = message.timestamp.toDateString();
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(message);
    return groups;
  }, {} as Record<string, Message[]>);

  const formatDateGroup = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    
    if (dateString === today) return 'Today';
    if (dateString === yesterday) return 'Yesterday';
    
    return new Intl.DateTimeFormat('default', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  const chatParticipants: ChatParticipant[] = participants.map(p => 
    typeof p === 'string' ? {
      id: p,
      name: p,
      isOnline: true
    } : p
  );

  return (
    <div className={`message-list flex-1 overflow-y-auto p-4 ${className}`}>
      {Object.entries(groupedMessages).map(([dateKey, dayMessages]) => (
        <div key={dateKey}>
          {/* Date separator */}
          <div className="flex justify-center my-4">
            <span className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
              {formatDateGroup(dateKey)}
            </span>
          </div>
          
          {/* Messages for this date */}
          {dayMessages.map(message => (
            <MessageItem
              key={message.id}
              message={message}
              participants={chatParticipants}
              isOwn={message.sender === currentUserId}
            />
          ))}
        </div>
      ))}
      
      {messages.length === 0 && (
        <div className="flex items-center justify-center h-full text-gray-500">
          <div className="text-center">
            <div className="text-lg mb-2">💬</div>
            <div>No messages yet</div>
            <div className="text-sm">Start a conversation!</div>
          </div>
        </div>
      )}
      
      <div ref={messagesEndRef} />
    </div>
  );
};