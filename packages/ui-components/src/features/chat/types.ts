/**
 * Chat-related type definitions
 */

export interface Message {
  id: string;
  content: string;
  sender: string;
  timestamp: Date;
  type?: 'text' | 'image' | 'file' | 'system';
  metadata?: {
    threadId?: string;
    isRead?: boolean;
    isEdited?: boolean;
    editedAt?: Date;
    attachments?: Attachment[];
  };
}

export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
}

export interface ChatParticipant {
  id: string;
  name: string;
  avatar?: string;
  isOnline?: boolean;
  lastSeen?: Date;
}

export interface ChatThread {
  id: string;
  title?: string;
  participants: ChatParticipant[];
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatInputProps {
  onSend: (message: Message) => void;
  onTyping?: (isTyping: boolean) => void;
  enableAttachments?: boolean;
  placeholder?: string;
  className?: string;
}

export interface MessageListProps {
  messages: Message[];
  participants: string[] | ChatParticipant[];
  className?: string;
}

export interface ChatCoreProps {
  initialMessages?: Message[];
  participants?: string[];
  threadId?: string;
  enableVoice?: boolean;
  enableVideo?: boolean;
  enableAttachments?: boolean;
  onSend?: (message: Message) => void;
  onTyping?: (isTyping: boolean) => void;
  className?: string;
  theme?: 'light' | 'dark';
}