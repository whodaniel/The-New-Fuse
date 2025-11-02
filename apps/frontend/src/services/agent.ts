import api from './api';

export const agentService = {
    async createAgent(agent) {
        const response = await api.post('/api/agents', agent);
        return response.data;
    },
    async getAgents() {
        const response = await api.get('/api/agents');
        return response.data || [];
    },
    async getAgentById(id) {
        const response = await api.get(`/api/agents/${id}`);
        return response.data;
    },
    async updateAgent(id, updates) {
        const response = await api.put(`/api/agents/${id}`, updates);
        return response.data;
    },
    async deleteAgent(id) {
        await api.delete(`/api/agents/${id}`);
        return true;
    },
};
