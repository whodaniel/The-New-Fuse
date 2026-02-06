import {
  AgentResponseDto,
  AgentStatus,
  AgentType,
  CreateAgentDto,
  UpdateAgentDto,
} from '@the-new-fuse/types';
import { ApiClient } from './api-client';

export class AgentsClient extends ApiClient {
  private readonly basePath = '/agents';

  async createAgent(data: CreateAgentDto): Promise<AgentResponseDto> {
    const response = await this.post<AgentResponseDto>(this.basePath, data);
    return response.data!;
  }

  async getAgents(params?: {
    type?: AgentType;
    status?: AgentStatus;
    search?: string;
  }): Promise<AgentResponseDto[]> {
    const response = await this.get<AgentResponseDto[]>(this.basePath, { params });
    return response.data!;
  }

  async getAgent(id: string): Promise<AgentResponseDto> {
    const response = await this.get<AgentResponseDto>(`${this.basePath}/${id}`);
    return response.data!;
  }

  async updateAgent(id: string, data: UpdateAgentDto): Promise<AgentResponseDto> {
    const response = await this.put<AgentResponseDto>(`${this.basePath}/${id}`, data);
    return response.data!;
  }

  async deleteAgent(id: string): Promise<void> {
    await this.delete<void>(`${this.basePath}/${id}`);
  }

  async getActiveAgents(): Promise<AgentResponseDto[]> {
    const response = await this.get<AgentResponseDto[]>(`${this.basePath}/active`);
    return response.data!;
  }

  async getAgentTypeCounts(): Promise<Record<string, number>> {
    const response = await this.get<Record<string, number>>(`${this.basePath}/stats/types`);
    return response.data!;
  }

  async getAgentStats(id: string): Promise<any> {
    const response = await this.get<any>(`${this.basePath}/${id}/stats`);
    return response.data!;
  }

  async activateAgent(id: string): Promise<AgentResponseDto> {
    const response = await this.put<AgentResponseDto>(`${this.basePath}/${id}/activate`, {});
    return response.data!;
  }

  async deactivateAgent(id: string): Promise<AgentResponseDto> {
    const response = await this.put<AgentResponseDto>(`${this.basePath}/${id}/deactivate`, {});
    return response.data!;
  }

  async pauseAgent(id: string): Promise<AgentResponseDto> {
    const response = await this.put<AgentResponseDto>(`${this.basePath}/${id}/pause`, {});
    return response.data!;
  }

  async markAgentBusy(id: string): Promise<AgentResponseDto> {
    const response = await this.put<AgentResponseDto>(`${this.basePath}/${id}/busy`, {});
    return response.data!;
  }

  async markAgentError(id: string): Promise<AgentResponseDto> {
    const response = await this.put<AgentResponseDto>(`${this.basePath}/${id}/error`, {});
    return response.data!;
  }
}
