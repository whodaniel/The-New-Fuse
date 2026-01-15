export { AgentType } from '@the-new-fuse/types';

export enum ReasoningStrategy {
  DEDUCTIVE = 'deductive',
  INDUCTIVE = 'inductive',
  ABDUCTIVE = 'abductive',
  ANALOGICAL = 'analogical',
}

export interface RawApiMessage {
  id: string;
  conversationId: string;
  sender: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface RawApiConversation {
  id: string;
  userId: string;
  messages: RawApiMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface TransformedMessage {
  id: string;
  conversationId: string;
  sender: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface TransformedConversation {
  id: string;
  userId: string;
  messages: TransformedMessage[];
  createdAt: string;
  updatedAt: string;
}

export const transformApiMessage = (apiMessage: RawApiMessage): TransformedMessage => {
  return {
    id: apiMessage.id,
    conversationId: apiMessage.conversationId,
    sender: apiMessage.sender,
    content: apiMessage.content,
    createdAt: apiMessage.createdAt,
    updatedAt: apiMessage.updatedAt,
  };
};

export const transformApiConversation = (
  apiConversation: RawApiConversation
): TransformedConversation => {
  return {
    id: apiConversation.id,
    userId: apiConversation.userId,
    messages: apiConversation.messages.map(transformApiMessage),
    createdAt: apiConversation.createdAt,
    updatedAt: apiConversation.updatedAt,
  };
};
