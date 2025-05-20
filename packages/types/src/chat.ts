export interface ChatMessage {
  id: string;
  userId: string;
  role: 'user' | 'assistant';
  content: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatMessageCreateInput {
  userId: string;
  role: 'user' | 'assistant';
  content: string;
  expiresAt: Date;
}

export interface ChatMessageUpdateInput {
  role?: 'user' | 'assistant';
  content?: string;
  expiresAt?: Date;
}

export interface ChatHistoryResponse {
  messages: ChatMessage[];
  total: number;
  hasMore: boolean;
}