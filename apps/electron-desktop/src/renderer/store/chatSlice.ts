import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface ChatMessage {
  id: string
  content: string
  timestamp: string
  sender: 'user' | 'system' | 'ai'
  metadata?: any
}

export interface ChatState {
  messages: ChatMessage[]
  isLoading: boolean
  currentInput: string
}

const initialState: ChatState = {
  messages: [],
  isLoading: false,
  currentInput: '',
}

export const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    addMessage: (state, action: PayloadAction<ChatMessage>) => {
      state.messages.push(action.payload)
    },
    setMessages: (state, action: PayloadAction<ChatMessage[]>) => {
      state.messages = action.payload
    },
    setIsLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },
    setCurrentInput: (state, action: PayloadAction<string>) => {
      state.currentInput = action.payload
    },
    clearMessages: (state) => {
      state.messages = []
    },
    updateMessage: (state, action: PayloadAction<{ id: string; updates: Partial<ChatMessage> }>) => {
      const { id, updates } = action.payload
      const messageIndex = state.messages.findIndex(msg => msg.id === id)
      if (messageIndex !== -1) {
        state.messages[messageIndex] = { ...state.messages[messageIndex], ...updates }
      }
    },
  },
})

export const {
  addMessage,
  setMessages,
  setIsLoading,
  setCurrentInput,
  clearMessages,
  updateMessage,
} = chatSlice.actions
