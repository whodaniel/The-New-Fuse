import React, { FC } from 'react';
import { PromptInput } from '@the-new-fuse/PromptInput';
import { ChatHistory } from '@the-new-fuse/ChatHistory';
import { ChatControls } from '@the-new-fuse/ChatControls';

export interface ChatMessage {
  id: string;
  content: string;
  sender: string;
  timestamp: Date;
  attachments?: unknown[];
}

interface ChatCoreProps {
  messages: ChatMessage[];
  onSendMessage: (content: string, attachments?: unknown[]) => void;
  onTyping?: (isTyping: boolean) => void;
  enableVoice?: boolean;
  enableVideo?: boolean;
  enableAttachments?: boolean;
  className?: string;
}

export const ChatCore: FC<ChatCoreProps> = ({
  messages,
  onSendMessage,
  onTyping,
  enableVoice = false,
  enableVideo = false,
  enableAttachments = false,
  className = ''
}) => {
  return (
    <div className={`chat-container flex flex-col h-full ${className}`}>
      <ChatHistory messages={messages} />
      <ChatControls
        enableVoice={enableVoice}
        enableVideo={enableVideo}
      />
      <PromptInput
        onSend={onSendMessage}
        onTyping={onTyping}
        enableAttachments={enableAttachments}
      />
    </div>
  );
};