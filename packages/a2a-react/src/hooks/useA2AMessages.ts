import { useA2AContext } from '../context/A2AContext';

export const useA2AMessages = () => {
  const context = useA2AContext();
  return {
    messages: context.messages,
    sendMessage: context.sendMessage,
    isConnected: context.isConnected,
  };
};