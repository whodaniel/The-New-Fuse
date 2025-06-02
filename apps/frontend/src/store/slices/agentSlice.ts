import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AppThunk } from '../index.js';
import fetcher from '../../services/api/fetcher.js';
import { transformApiToStoreAgent, Agent } from '../../types/agent.js';

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

const agentSlice = createSlice({
    name: 'agent',
    initialState,
    reducers: {
        fetchAgentsStart(state) {
            state.loading = true;
            state.error = null;
        },
        fetchAgentsSuccess(state, action: PayloadAction<Agent[]>) {
            state.agents = action.payload;
            state.loading = false;
        },
        fetchAgentsFailure(state, action: PayloadAction<string>) {
            state.error = action.payload;
            state.loading = false;
        },
        updateAgentSuccess(state, action: PayloadAction<Agent>) {
            const index = state.agents.findIndex(agent => agent.id === action.payload.id);
            if (index !== -1) {
                state.agents[index] = action.payload;
            }
        },
        createAgentSuccess(state, action: PayloadAction<Agent>) {
            state.agents.push(action.payload);
        },
    },
});

export const { 
    fetchAgentsStart, 
    fetchAgentsSuccess, 
    fetchAgentsFailure, 
    updateAgentSuccess, 
    createAgentSuccess 
} = agentSlice.actions;

export const fetchAgents = (): AppThunk => async (dispatch) => {
    try {
        dispatch(fetchAgentsStart());
        const response = await fetcher.get('/agents');
        const storeAgents = response.data.map(transformApiToStoreAgent);
        dispatch(fetchAgentsSuccess(storeAgents));
    } catch (error) {
        dispatch(fetchAgentsFailure(error instanceof Error ? error.message : 'An error occurred'));
    }
};

export const updateAgent = (agentId: string, agentData: Partial<Agent>): AppThunk => async (dispatch) => {
    try {
        const response = await fetcher.put(`/agents/${agentId}`, agentData);
        const updatedAgent = transformApiToStoreAgent(response.data);
        dispatch(updateAgentSuccess(updatedAgent));
    } catch (error) {
        dispatch(fetchAgentsFailure(error instanceof Error ? error.message : 'An error occurred'));
    }
};

export const createAgent = (agentData: Omit<Agent, 'id'>): AppThunk => async (dispatch) => {
    try {
        const response = await fetcher.post('/agents', agentData);
        const newAgent = transformApiToStoreAgent(response.data);
        dispatch(createAgentSuccess(newAgent));
    } catch (error) {
        dispatch(fetchAgentsFailure(error instanceof Error ? error.message : 'An error occurred'));
    }
};

export default agentSlice.reducer;
