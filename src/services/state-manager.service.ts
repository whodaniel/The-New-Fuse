import { Injectable } from '@nestjs/common';
import { Workflow } from './agent-workflow.service.js';

@Injectable()
export class StateManagerService {
  async createWorkflowState(workflow: Workflow): Promise<any> {
    return { id: 'mock-state-id', workflow };
  }

  async markWorkflowFailed(stateId: string, error: Error): Promise<void> {
    // Implementation
  }
}
