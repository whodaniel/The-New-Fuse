import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { Agent } from '@the-new-fuse/types';
import { api } from '../services/api.js';

interface AgentState {
  agents: Agent[];
  loading: boolean;
  error: string | null;
}

const initialState: AgentState = {
  agents: [],
  loading: false,
  error: null,
};

export const fetchAgents = createAsyncThunk(
  'agents/fetchAgents',
  async () => {
    const response = await api.get('/agents');
    return response.data;
  }
);

export const createAgent = createAsyncThunk(
  'agents/createAgent',
  async (agent: Partial<Agent>) => {
    const response = await api.post('/agents', agent);
    return response.data;
  }
);

const agentSlice = createSlice({
  name: 'agents',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAgents.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAgents.fulfilled, (state, action) => {
        state.agents = action.payload;
        state.loading = false;
      })
      .addCase(fetchAgents.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to fetch agents';
        state.loading = false;
      });
  },
});

export default agentSlice.reducer;