import { configureStore } from '@reduxjs/toolkit'
import { connectionSlice } from './connectionSlice.js'
import { elementsSlice } from './elementsSlice.js'
import { chatSlice } from './chatSlice.js'
import { portsSlice } from './portsSlice.js'

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
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
