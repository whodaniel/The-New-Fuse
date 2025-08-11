export interface Message {
  // Implementation needed
}
  id: string;
  type: MessageType;
  content: any;
  senderId: string;
  recipientId?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export enum MessageType {
  // Implementation needed
}
  TEXT = 'text',
  IMAGE = 'image',
  FILE = 'file',
  SYSTEM = 'system',
  TYPING = 'typing',
  READ_RECEIPT = 'read_receipt',
}

export interface ChatRoom {
  // Implementation needed
}
  id: string;
  name: string;
  participants: string[];
  createdAt: Date;
  updatedAt: Date;
  lastMessage?: Message;
}

export interface UserStatus {
  // Implementation needed
}
  userId: string;
  status: 'online' | 'offline' | 'away' | 'busy';
  lastSeen: Date;
}

export interface Notification {
  // Implementation needed
}
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
  // Implementation needed
}
  MESSAGE = 'message',
  MENTION = 'mention',
  SYSTEM = 'system',
  COLLABORATION = 'collaboration',
}

export interface CommunicationEvent {
  // Implementation needed
}
  type: string;
  data: any;
  timestamp: Date;
}