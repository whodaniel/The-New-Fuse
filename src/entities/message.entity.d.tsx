export interface Message extends BaseEntity {
  content: string;
  role: string;
  conversationId: string;
  userId?: string;
  metadata?: Record<string, any>;
  tokens?: number;
}
export interface Conversation extends BaseEntity {
  title?: string;
  userId: string;
  status: string;
  messages: Message[];
  metadata?: Record<string, any>;
  lastMessageAt: Date;
}
