import React from 'react';
import { TimeStamp } from "@/utils/TimeStamp";
import HistoricalMessage from '../HistoricalMessage.js';
import { WorkspaceData } from "@/types/workspace";

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string | Date | number;
  editedAt?: string | Date | number;
  attachments?: {
    name: string;
    contentString: string;
  }[];
}

interface MessageGroupProps {
  messages: Message[];
  workspace: WorkspaceData | null;
  chatId: string | null;
  onEditMessage?: (params: {
    editedMessage: string;
    chatId: string;
    role: "user" | "assistant";
    attachments?: File[];
  }) => void;
  onRegenerateMessage?: (chatId: string) => void;
  onForkThread?: (chatId: string) => void;
}

export default function MessageGroup({
  messages,
  workspace,
  chatId,
  onEditMessage,
  onRegenerateMessage,
  onForkThread
}: MessageGroupProps): React.ReactElement | null {
  if (messages.length === 0) return null;

  // Get timestamp of first message in group
  const groupTimestamp = new TimeStamp(messages[0].createdAt);
  
  // Determine if we should show date header
  const showDateHeader = () => {
    if (groupTimestamp.isToday()) {
      return 'Today';
    } else if (groupTimestamp.isYesterday()) {
      return 'Yesterday';
    } else {
      return groupTimestamp.format({ format: 'medium', includeTime: false });
    }
  };

  return (
    <div className="message-group">
      <div className="sticky top-0 z-10 flex items-center justify-center py-2 bg-theme-bg-secondary/80 backdrop-blur-sm">
        <div className="px-3 py-1 text-xs text-white/60 bg-theme-bg-secondary rounded-full">
          {showDateHeader()}
        </div>
      </div>
      
      {messages.map((message, index) => (
        <HistoricalMessage
          key={message.id}
          uuid={message.id}
          message={message.content}
          role={message.role}
          workspace={workspace}
          attachments={message.attachments}
          chatId={chatId}
          isLastMessage={index === messages.length - 1}
          regenerateMessage={onRegenerateMessage}
          saveEditedMessage={onEditMessage}
          forkThread={onForkThread}
          createdAt={message.createdAt}
          editedAt={message.editedAt}
        />
      ))}
    </div>
  );
}