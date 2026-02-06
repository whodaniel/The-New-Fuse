export enum ChannelType {
  DIRECT = 'direct',
  GROUP = 'group',
  BROADCAST = 'broadcast',
}

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  FILE = 'file',
  SYSTEM = 'system',
}

export interface Channel {
  id: string;
  name: string;
  type: ChannelType;
  participants: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  channelId: string;
  senderId: string;
  type: MessageType;
  content: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

export interface ChannelService {
  createChannel(name: string, type: ChannelType, participants: string[]): Promise<Channel>;
  getChannel(id: string): Promise<Channel | null>;
  getUserChannels(userId: string): Promise<Channel[]>;
  sendMessage(
    channelId: string,
    senderId: string,
    content: string,
    type?: MessageType,
  ): Promise<Message>;
  getMessages(channelId: string, limit?: number): Promise<Message[]>;
}
