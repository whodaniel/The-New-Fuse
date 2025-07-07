import React, { useState, useRef, useCallback } from 'react';
import { Button } from '../../core/button/index';
import { Input } from '../../core/input/index';
import { ChatInputProps, Message, Attachment } from './types';

export const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  onTyping,
  enableAttachments = false,
  placeholder = 'Type a message...',
  className = ''
}) => {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleTyping = useCallback((value: string) => {
    setMessage(value);
    
    if (onTyping) {
      if (!isTyping) {
        setIsTyping(true);
        onTyping(true);
      }
      
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set new timeout to stop typing indicator
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        onTyping(false);
      }, 1000);
    }
  }, [isTyping, onTyping]);

  const handleSend = useCallback(() => {
    if (message.trim() || attachments.length > 0) {
      const newMessage: Message = {
        id: Date.now().toString(),
        content: message.trim(),
        sender: 'user', // This would typically come from auth context
        timestamp: new Date(),
        type: 'text',
        metadata: {
          attachments: attachments.length > 0 ? attachments : undefined
        }
      };
      
      onSend(newMessage);
      setMessage('');
      setAttachments([]);
      
      // Stop typing indicator
      if (isTyping && onTyping) {
        setIsTyping(false);
        onTyping(false);
      }
    }
  }, [message, attachments, onSend, isTyping, onTyping]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    files.forEach(file => {
      const attachment: Attachment = {
        id: Date.now().toString(),
        name: file.name,
        type: file.type,
        size: file.size,
        url: URL.createObjectURL(file)
      };
      
      setAttachments(prev => [...prev, attachment]);
    });
  }, []);

  const removeAttachment = useCallback((attachmentId: string) => {
    setAttachments(prev => prev.filter(att => att.id !== attachmentId));
  }, []);

  return (
    <div className={`chat-input border-t bg-white p-4 ${className}`}>
      {/* Attachments preview */}
      {attachments.length > 0 && (
        <div className="mb-2">
          <div className="flex flex-wrap gap-2">
            {attachments.map(attachment => (
              <div 
                key={attachment.id}
                className="flex items-center gap-2 bg-gray-100 rounded-md px-2 py-1 text-sm"
              >
                <span className="truncate max-w-[200px]">{attachment.name}</span>
                <button 
                  onClick={() => removeAttachment(attachment.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <Input
            value={message}
            onChange={(e) => handleTyping(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            multiline
            className="min-h-[40px] max-h-[120px] resize-none"
          />
        </div>
        
        <div className="flex gap-2">
          {enableAttachments && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="shrink-0"
              >
                📎
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
            </>
          )}
          
          <Button
            onClick={handleSend}
            disabled={!message.trim() && attachments.length === 0}
            className="shrink-0"
          >
            Send
          </Button>
        </div>
      </div>
    </div>
  );
};