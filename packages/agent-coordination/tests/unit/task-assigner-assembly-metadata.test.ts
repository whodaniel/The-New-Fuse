import { AgentStatus, TaskAssigner, TaskPriority, TaskStatus } from '../../src/core/index.js';

describe('TaskAssigner assembly-line metadata', () => {
  it('stamps isolated context and forwards a specification id', () => {
    const assigner = new TaskAssigner();
    const assignment = assigner.assignTask(
      {
        id: 'task-1',
        type: 'implement',
        priority: TaskPriority.NORMAL,
        status: TaskStatus.QUEUED,
        payload: { objective: 'Add health endpoint' },
        retryCount: 0,
        metadata: { specificationId: 'spec-abc', assemblyLine: true },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      [
        {
          id: 'agent-1',
          name: 'Worker',
          type: 'developer',
          capabilities: [],
          status: AgentStatus.IDLE,
          currentLoad: 0,
          maxConcurrentTasks: 2,
          createdAt: new Date(),
          lastHeartbeat: new Date(),
        },
      ]
    );

    expect(assignment).not.toBeNull();
    expect(assignment?.metadata.isolatedContext).toBe(true);
    expect(assignment?.metadata.maxContextTokens).toBe(4096);
    expect(assignment?.metadata.specificationId).toBe('spec-abc');
    expect(assignment?.metadata.assemblyLine).toBe(true);
  });
});
