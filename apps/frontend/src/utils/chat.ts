// Chat utility functions and constants

export const chatPrompt = {
  defaultPrompt: 'How can I help you today?',
  systemPrompt: 'You are a helpful assistant.',
  maxLength: 4000
};

export const chatQueryRefusalResponse = {
  defaultResponse: 'I apologize, but I cannot process that request.',
  customResponses: {
    offensive: 'I cannot engage with offensive content.',
    unsafe: 'I cannot perform unsafe or harmful actions.',
    unauthorized: 'I cannot access unauthorized information.'
  }
};

export const formatChatMessage = (message: string, type: 'user' | 'assistant'): string => {
  return `${type === 'user' ? '👤' : '🤖'} ${message}`;
};

export const validateChatInput = (input: string): boolean => {
  return input.trim().length > 0 && input.length <= chatPrompt.maxLength;
};