import { Injectable } from '@nestjs/common';

@Injectable()
export class AgentsService {
  getAgents() {
    return { agents: [] };
  }

  getAgent(id: string) {
    return { id, name: `Agent ${id}`, status: 'active' };
  }
}
