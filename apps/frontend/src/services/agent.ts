import { AgentResponseDto, CreateAgentDto, UpdateAgentDto } from '@the-new-fuse/types';
import api from './api';

export const agentService = {
  async createAgent(agent: CreateAgentDto): Promise<AgentResponseDto> {
    const response = await api.post('/api/v1/agents', agent);
    return response.data;
  },
  async getAgents(): Promise<AgentResponseDto[]> {
    const response = await api.get('/api/v1/agents');
    return response.data || [];
  },
  async getAgentById(id: string): Promise<AgentResponseDto> {
    const response = await api.get(`/api/v1/agents/${id}`);
    return response.data;
  },
  async updateAgent(id: string, updates: UpdateAgentDto): Promise<AgentResponseDto> {
    const response = await api.put(`/api/v1/agents/${id}`, updates);
    return response.data;
  },
  async deleteAgent(id: string): Promise<boolean> {
    await api.delete(`/api/v1/agents/${id}`);
    return true;
  },
};
