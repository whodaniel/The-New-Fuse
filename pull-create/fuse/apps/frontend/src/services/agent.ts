import { AgentResponseDto, CreateAgentDto, UpdateAgentDto } from '@the-new-fuse/types';
import api from './api';

export const agentService = {
  async createAgent(agent: CreateAgentDto): Promise<AgentResponseDto> {
    const response = await api.post('/api/agents', agent);
    return response.data;
  },
  async getAgents(): Promise<AgentResponseDto[]> {
    const response = await api.get('/api/agents');
    return response.data || [];
  },
  async getAgentById(id: string): Promise<AgentResponseDto> {
    const response = await api.get(`/api/agents/${id}`);
    return response.data;
  },
  async updateAgent(id: string, updates: UpdateAgentDto): Promise<AgentResponseDto> {
    const response = await api.put(`/api/agents/${id}`, updates);
    return response.data;
  },
  async deleteAgent(id: string): Promise<boolean> {
    await api.delete(`/api/agents/${id}`);
    return true;
  },
};
