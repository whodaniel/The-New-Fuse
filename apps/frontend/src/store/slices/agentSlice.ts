var _a;
export {}
exports.createAgent = exports.updateAgent = exports.fetchAgents = exports.createAgentSuccess = exports.updateAgentSuccess = exports.fetchAgentsFailure = exports.fetchAgentsSuccess = exports.fetchAgentsStart = void 0;
import toolkit_1 from '@reduxjs/toolkit';
import fetcher_1 from '../../services/api/fetcher.js';
import agent_1 from '../../types/agent.js';
const agentSlice = (0, toolkit_1.createSlice)({
    name: 'agent',
    initialState: {
        agents: [],
        loading: false,
        error: null,
    },
    reducers: {
        fetchAgentsStart(state) {
            state.loading = true;
            state.error = null;
        },
        fetchAgentsSuccess(state, action) {
            state.agents = action.payload;
            state.loading = false;
        },
        fetchAgentsFailure(state, action) {
            state.error = action.payload;
            state.loading = false;
        },
        updateAgentSuccess(state, action) {
            const index = state.agents.findIndex(agent => agent.id === action.payload.id);
            if (index !== -1) {
                state.agents[index] = action.payload;
            }
        },
        createAgentSuccess(state, action) {
            state.agents.push(action.payload);
        },
    },
});
_a = agentSlice.actions, exports.fetchAgentsStart = _a.fetchAgentsStart, exports.fetchAgentsSuccess = _a.fetchAgentsSuccess, exports.fetchAgentsFailure = _a.fetchAgentsFailure, exports.updateAgentSuccess = _a.updateAgentSuccess, exports.createAgentSuccess = _a.createAgentSuccess;
const fetchAgents = (): any => async (dispatch) => {
    try {
        dispatch((0, exports.fetchAgentsStart)());
        const response = await fetcher_1.default.get('/agents');
        const storeAgents = response.data.map(agent_1.transformApiToStoreAgent);
        dispatch((0, exports.fetchAgentsSuccess)(storeAgents));
    }
    catch (error) {
        dispatch((0, exports.fetchAgentsFailure)(error.message));
    }
};
exports.fetchAgents = fetchAgents;
const updateAgent = (agentId, agentData): any => async (dispatch) => {
    try {
        const apiAgentData = (0, agent_1.transformStoreToApiAgent)(agentData);
        const response = await fetcher_1.default.put(`/agents/${agentId}`, apiAgentData);
        const finalAgent = (0, agent_1.transformApiToStoreAgent)(response.data);
        dispatch((0, exports.updateAgentSuccess)(finalAgent));
    }
    catch (error) {
        dispatch((0, exports.fetchAgentsFailure)(error.message));
    }
};
exports.updateAgent = updateAgent;
const createAgent = (fullAgentData): any => async (dispatch) => {
    try {
        const apiAgentData = (0, agent_1.transformStoreToApiAgent)(fullAgentData);
        const response = await fetcher_1.default.post('/agents', apiAgentData);
        const newAgent = (0, agent_1.transformApiToStoreAgent)(response.data);
        dispatch((0, exports.createAgentSuccess)(newAgent));
    }
    catch (error) {
        dispatch((0, exports.fetchAgentsFailure)(error.message));
    }
};
exports.createAgent = createAgent;
exports.default = agentSlice.reducer;
export {};
//# sourceMappingURL=agentSlice.js.map