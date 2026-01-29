import { createContext, FC, ReactNode, useCallback, useContext, useReducer } from 'react';
import { Message, MessageType } from './types';

interface ChatState {
  messages: Message[];
  status: 'idle' | 'processing' | 'error';
  error?: string;
}

type ChatAction =
  | { type: 'ADD_MESSAGE'; payload: Message }
  | { type: 'SET_STATUS'; payload: ChatState['status'] }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR_CHAT' };

const initialState: ChatState = {
  messages: [],
  status: 'idle',
};

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'ADD_MESSAGE':
      return { ...state, messages: [...state.messages, action.payload], error: undefined };
    case 'SET_STATUS':
      return { ...state, status: action.payload };
    case 'SET_ERROR':
      return { ...state, status: 'error', error: action.payload };
    case 'CLEAR_CHAT':
      return { ...initialState };
    default:
      return state;
  }
}

interface ChatContextValue {
  state: ChatState;
  sendMessage: (content: string, attachments?: File[]) => Promise<void>;
  clearChat: () => void;
  setError: (error: string) => void;
}

const ChatContext = createContext<ChatContextValue | undefined>(undefined);

export const ChatProvider: FC<{
  children: ReactNode;
  onSendMessage?: (content: string, attachments?: File[]) => Promise<void>;
}> = ({ children, onSendMessage }) => {
  const [state, dispatch] = useReducer(chatReducer, initialState);

  const sendMessage = useCallback(
    async (content: string, attachments?: File[]) => {
      try {
        dispatch({ type: 'SET_STATUS', payload: 'processing' });

        const message: Message = {
          id: Date.now().toString(),
          content,
          sender: 'user',
          timestamp: new Date(),
          type: 'text' as MessageType,
          attachments: attachments?.map((file) => ({
            id: Math.random().toString(),
            name: file.name,
            type: file.type,
            url: URL.createObjectURL(file),
            size: file.size,
          })),
        };

        dispatch({ type: 'ADD_MESSAGE', payload: message });

        if (onSendMessage) {
          await onSendMessage(content, attachments);
        }

        dispatch({ type: 'SET_STATUS', payload: 'idle' });
      } catch (error) {
        dispatch({
          type: 'SET_ERROR',
          payload: error instanceof Error ? error.message : 'Failed to send message',
        });
      }
    },
    [onSendMessage]
  );

  const clearChat = useCallback(() => {
    dispatch({ type: 'CLEAR_CHAT' });
  }, []);

  const setError = useCallback((error: string) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  }, []);

  return (
    <ChatContext.Provider value={{ state, sendMessage, clearChat, setError }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
