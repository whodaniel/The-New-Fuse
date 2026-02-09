// Chat utility functions and constants

export const ABORT_STREAM_EVENT = 'abort-stream';

export const chatPrompt = {
  defaultPrompt: 'How can I help you today?',
  systemPrompt: 'You are a helpful assistant.',
  maxLength: 4000
};

export enum RefusalType {
  DEFAULT = 'default',
  OFFENSIVE = 'offensive',
  UNSAFE = 'unsafe',
  UNAUTHORIZED = 'unauthorized',
}

export const chatQueryRefusalResponses: Record<RefusalType, string> = {
  [RefusalType.DEFAULT]: 'I apologize, but I cannot process that request.',
  [RefusalType.OFFENSIVE]: 'I cannot engage with offensive content.',
  [RefusalType.UNSAFE]: 'I cannot perform unsafe or harmful actions.',
  [RefusalType.UNAUTHORIZED]: 'I cannot access unauthorized information.',
};

export const formatChatMessage = (message: string, type: 'user' | 'assistant'): string => {
  return `${type === 'user' ? '👤' : '🤖'} ${message}`;
};

export const validateChatInput = (input: string): boolean => {
  return input.trim().length > 0 && input.length <= chatPrompt.maxLength;
};