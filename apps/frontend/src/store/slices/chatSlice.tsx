import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AppDispatch } from '../store.js';
import fetcher from '../../services/api/fetcher.js';
import { transformApiConversation } from '../../types/api.js';

interface Conversation {
  id: string;
  title: string;
  messages: Array<{
    id: string;
    content: string;
    sender: 'user' | 'agent';
    timestamp: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

interface ChatState {
  conversations: Conversation[];
  loading: boolean;
  error: string | null;
}

const initialState: ChatState = {
  conversations: [],
  loading: false,
  error: null,
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    fetchConversationsStart(state) {
      state.loading = true;
      state.error = null;
    },
    fetchConversationsSuccess(state, action: PayloadAction<Conversation[]>) {
      state.conversations = action.payload;
      state.loading = false;
    },
    fetchConversationsFailure(state, action: PayloadAction<string>) {
      state.error = action.payload;
      state.loading = false;
    },
    updateConversationSuccess(state, action: PayloadAction<Conversation>) {
      const index = state.conversations.findIndex(conv => conv.id === action.payload.id);
      if (index !== -1) {
        state.conversations[index] = action.payload;
      }
    },
    createConversationSuccess(state, action: PayloadAction<Conversation>) {
      state.conversations.push(action.payload);
    },
  },
});

export const {
  fetchConversationsStart,
  fetchConversationsSuccess,
  fetchConversationsFailure,
  updateConversationSuccess,
  createConversationSuccess,
} = chatSlice.actions;

export const fetchConversations = (userId: string): any => async (dispatch: AppDispatch) => {
  try {
    dispatch(fetchConversationsStart());
    const response = await fetcher.get('/api/chat/conversations', { params: { user_id: userId } });
    const conversations = response.data.map(transformApiConversation);
    dispatch(fetchConversationsSuccess(conversations));
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    dispatch(fetchConversationsFailure(errorMessage));
  }
};

export const updateConversation = (conversationId: string, conversationData: Partial<Conversation>): any => async (dispatch: AppDispatch) => {
  try {
    const response = await fetcher.put(`/api/chat/conversations/${conversationId}`, conversationData);
    const finalConversation = transformApiConversation(response.data);
    dispatch(updateConversationSuccess(finalConversation));
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    dispatch(fetchConversationsFailure(errorMessage));
  }
};

export const createConversation = (userId: string): any => async (dispatch: AppDispatch) => {
  try {
    const response = await fetcher.post('/api/chat/start', { user_id: userId });
    const newConversation = transformApiConversation(response.data);
    dispatch(createConversationSuccess(newConversation));
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    dispatch(fetchConversationsFailure(errorMessage));
  }
};

export default chatSlice.reducer;