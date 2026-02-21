import { configureStore } from "@reduxjs/toolkit";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import authReducer from '../components/auth/authSlice.js';
import chatReducer from '../components/chat/chatSlice.js';
import coreReducer from '../components/core/coreSlice.js';
import { RootState } from '../types.js';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    chat: chatReducer,
    core: coreReducer,
  },
});

export type AppDispatch = typeof store.dispatch;

// Create typed hooks
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
