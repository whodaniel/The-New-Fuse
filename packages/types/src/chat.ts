export interface ChatMessage {
  id: string;
  content: string;
  role: string; // "user", "assistant", "system"
  userId: string;
  sessionId?: string;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatMessageCreateInput {
  userId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  sessionId?: string;
  metadata?: any;
}

export interface ChatMessageUpdateInput {
  role?: 'user' | 'assistant' | 'system';
  content?: string;
  sessionId?: string;
  metadata?: any;
}

export interface ChatHistoryResponse {
  messages: ChatMessage[];
  total: number;
  hasMore: boolean;
}
