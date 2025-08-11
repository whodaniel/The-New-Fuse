export enum ChannelType {
  // Implementation needed
}
  DIRECT = 'direct',
  GROUP = 'group',
  BROADCAST = 'broadcast',
}

export enum MessageType {
  // Implementation needed
}
  TEXT = 'text',
  IMAGE = 'image',
  FILE = 'file',
  SYSTEM = 'system',
}

export interface Channel {
  // Implementation needed
}
  id: string;
  name: string;
  type: ChannelType;
  participants: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  // Implementation needed
}
  id: string;
  channelId: string;
  senderId: string;
  type: MessageType;
  content: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

export interface ChannelService {
  // Implementation needed
}
  createChannel(name: string, type: ChannelType, participants: string[]): Promise<Channel>;
  getChannel(id: string): Promise<Channel | null>;
  getUserChannels(userId: string): Promise<Channel[]>;
  sendMessage(channelId: string, senderId: string, content: string, type?: MessageType): Promise<Message>;
  getMessages(channelId: string, limit?: number): Promise<Message[]>;
}