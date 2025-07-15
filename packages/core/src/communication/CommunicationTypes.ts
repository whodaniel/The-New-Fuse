export interface Message {
  id: string;
  type: MessageType;
  content: any;
  senderId: string;
  recipientId?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  FILE = 'file',
  SYSTEM = 'system',
  TYPING = 'typing',
  READ_RECEIPT = 'read_receipt',
}

export interface ChatRoom {
  id: string;
  name: string;
  participants: string[];
  createdAt: Date;
  updatedAt: Date;
  lastMessage?: Message;
}

export interface UserStatus {
  userId: string;
  status: 'online' | 'offline' | 'away' | 'busy';
  lastSeen: Date;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
  metadata?: Record<string, any>;
}

export enum NotificationType {
  MESSAGE = 'message',
  MENTION = 'mention',
  SYSTEM = 'system',
  COLLABORATION = 'collaboration',
}

export interface CommunicationEvent {
  type: string;
  data: any;
  timestamp: Date;
}