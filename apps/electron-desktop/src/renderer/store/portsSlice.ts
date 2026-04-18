import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { PortStatus } from '../../shared/types.js'

export interface PortsState {
  monitored: number[]
  statuses: PortStatus[]
}

const initialState: PortsState = {
  monitored: [3000, 3001, 5173, 8080],
  statuses: []
}

export const portsSlice = createSlice({
  name: 'ports',
  initialState,
  reducers: {
    setMonitoredPorts: (state, action: PayloadAction<number[]>) => {
      state.monitored = action.payload
    },
    addMonitoredPort: (state, action: PayloadAction<number>) => {
      if (!state.monitored.includes(action.payload)) {
        state.monitored.push(action.payload)
      }
    },
    removeMonitoredPort: (state, action: PayloadAction<number>) => {
      state.monitored = state.monitored.filter(port => port !== action.payload)
      state.statuses = state.statuses.filter(status => status.port !== action.payload)
    },
    updatePortStatuses: (state, action: PayloadAction<PortStatus[]>) => {
      state.statuses = action.payload
    },
    updateSinglePortStatus: (state, action: PayloadAction<PortStatus>) => {
      const index = state.statuses.findIndex(status => status.port === action.payload.port)
      if (index >= 0) {
        state.statuses[index] = action.payload
      } else {
        state.statuses.push(action.payload)
      }
    }
  }
})

export const {
  setMonitoredPorts,
  addMonitoredPort,
  removeMonitoredPort,
  updatePortStatuses,
  updateSinglePortStatus
} = portsSlice.actions
