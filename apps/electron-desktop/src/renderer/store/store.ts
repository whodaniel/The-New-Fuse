import { configureStore } from '@reduxjs/toolkit';
import { chatSlice } from './chatSlice';
import { connectionSlice } from './connectionSlice';
import { elementsSlice } from './elementsSlice';
import { portsSlice } from './portsSlice';

export const store = configureStore({
  reducer: {
    connections: connectionSlice.reducer,
    elements: elementsSlice.reducer,
    chat: chatSlice.reducer,
    ports: portsSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
