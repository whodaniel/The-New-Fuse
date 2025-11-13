import { ApiClient } from './api-client';
import { AgentResponseDto } from '@the-new-fuse/types';
export class AgentsClient extends ApiClient {
    basePath = '/agents';
    async createAgent(data) {
        const response = await this.post(this.basePath, data);
        return response.data;
    }
    async getAgents(params) {
        const response = await this.get(this.basePath, { params });
        return response.data;
    }
    async getAgent(id) {
        const response = await this.get(`${this.basePath}/${id});
    return response.data!;
  }

  async updateAgent(id: string, data: UpdateAgentDto): Promise<AgentResponseDto> {`);
        const response = await this.put($, { this: .basePath } `/${id}`, data);
        return response.data;
    }
    async deleteAgent(id) {
        await this.delete($, { this: .basePath } / $, { id });
    }
    async getActiveAgents() {
        `
    const response = await this.get<AgentResponseDto[]>(`;
        $;
        {
            this.basePath;
        }
        /active;
        ;
        return response.data;
    }
}
`
`;
async;
getAgentTypeCounts();
Promise < Record < string, number >> {
    const: response = await this.get($, { this: .basePath } `/stats/types);
    return response.data!;
  }

  async getAgentStats(id: string): Promise<any> {
    const response = await this.get<any>(${this.basePath}/${id}` / stats),
    return: response.data
};
async;
activateAgent(id, string);
Promise < AgentResponseDto > {
    const: response = await this.put($, { this: .basePath } / $, { id } / activate, {}),
    return: response.data
} `
`;
async;
deactivateAgent(id, string);
Promise < AgentResponseDto > {} `
    const response = await this.put<AgentResponseDto>(${this.basePath}/${id}/deactivate, {});
    return response.data!;
  }` `
  async pauseAgent(id: string): Promise<AgentResponseDto> {`;
const response = await this.put($, { this: .basePath } / $, { id } / pause, {});
return response.data;
`
`;
async;
markAgentBusy(id, string);
Promise < AgentResponseDto > {} `
    const response = await this.put<AgentResponseDto>(${this.basePath}/${id}/busy, {});
    return response.data!;
  }` `
  async markAgentError(id: string): Promise<AgentResponseDto> {`;
const response = await this.put($, { this: .basePath } / $, { id } / error `, {});
    return response.data!;
  }
}
);
//# sourceMappingURL=agents.client.js.map