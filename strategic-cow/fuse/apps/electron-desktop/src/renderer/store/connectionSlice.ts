import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface ConnectionState {
  tnfRelay: {
    connected: boolean
    reconnectAttempts: number
    lastConnected: string | null
  }
  mcp: {
    connected: boolean
    host?: string
    port?: number
  }
  systemStatus: {
    initialized: boolean
    nativeHost: boolean
    lastUpdate: string | null
  }
}

const initialState: ConnectionState = {
  tnfRelay: {
    connected: false,
    reconnectAttempts: 0,
    lastConnected: null,
  },
  mcp: {
    connected: false,
  },
  systemStatus: {
    initialized: false,
    nativeHost: false,
    lastUpdate: null,
  },
}

export const connectionSlice = createSlice({
  name: 'connections',
  initialState,
  reducers: {
    updateTNFRelayStatus: (state, action: PayloadAction<any>) => {
      state.tnfRelay = { ...state.tnfRelay, ...action.payload }
    },
    updateMCPStatus: (state, action: PayloadAction<any>) => {
      state.mcp = { ...state.mcp, ...action.payload }
    },
    updateSystemStatus: (state, action: PayloadAction<any>) => {
      state.systemStatus = { ...state.systemStatus, ...action.payload, lastUpdate: new Date().toISOString() }
    },
    setTNFRelayConnected: (state, action: PayloadAction<boolean>) => {
      state.tnfRelay.connected = action.payload
      if (action.payload) {
        state.tnfRelay.lastConnected = new Date().toISOString()
        state.tnfRelay.reconnectAttempts = 0
      }
    },
    setMCPConnected: (state, action: PayloadAction<boolean>) => {
      state.mcp.connected = action.payload
    },
  },
})

export const {
  updateTNFRelayStatus,
  updateMCPStatus,
  updateSystemStatus,
  setTNFRelayConnected,
  setMCPConnected,
} = connectionSlice.actions
