export const agentService = {
    async createAgent(agent) {
        const response = await apiClient.post('/agents', agent);
        return response.data;
    },
    async getAgents() {
        const response = await apiClient.get('/agents');
        return response.data || [];
    },
    async getAgentById(id) {
        const response = await apiClient.get(`/agents/${id}`);
        return response.data;
    },
    async updateAgent(id, updates) {
        const response = await apiClient.put(`/agents/${id}`, updates);
        return response.data;
    },
    async deleteAgent(id) {
        await apiClient.delete(`/agents/${id}`);
        return true;
    },
};
//# sourceMappingURL=agent.js.map