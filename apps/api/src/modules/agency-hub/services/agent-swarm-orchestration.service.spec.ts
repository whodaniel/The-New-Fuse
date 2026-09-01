import { EventEmitter2 } from '@nestjs/event-emitter';
import { AgentSwarmOrchestrationService } from './agent-swarm-orchestration.service';

/**
 * Behavioral spec for the swarm agent busy/active lifecycle:
 * assignment marks agents busy at capacity, completion/failure release them,
 * and heartbeat liveness keeps the status coherent end-to-end.
 */
describe('AgentSwarmOrchestrationService busy lifecycle', () => {
  const AGENCY = 'agency-busy-spec';

  const buildService = () => {
    const emitter = new EventEmitter2();
    const service = new AgentSwarmOrchestrationService({} as any, emitter);
    return { service, emitter };
  };

  const registerWorker = async (
    service: AgentSwarmOrchestrationService,
    maxLoad = 1,
    capabilities = ['code-analysis']
  ) =>
    service.registerAgent(AGENCY, {
      name: `worker-${Math.random().toString(36).slice(2, 8)}`,
      type: 'specialized',
      capabilities,
      currentLoad: 0,
      maxLoad,
      qualityScore: 0.9,
      status: 'active',
    });

  const submitAnalysisTask = (service: AgentSwarmOrchestrationService) =>
    service.submitTask(AGENCY, {
      type: 'analysis',
      priority: 'medium',
      payload: { input: 'x' },
      requirements: ['code-analysis'],
      assignedAgents: [],
    });

  afterEach(async () => {
    // No shared state: each test builds its own service; nothing to tear down
    // beyond letting pending microtasks settle.
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

  it('marks a saturated agent busy on assignment and active again on completion', async () => {
    const { service, emitter } = buildService();
    await service.initializeAgencySwarm(AGENCY);
    await registerWorker(service, 1);

    let before = await service.getGlobalSwarmStatus();
    expect(before.busyAgents).toBe(0);
    expect(before.onlineAgents).toBe(1);

    const taskId = await submitAnalysisTask(service);
    let afterAssign = await service.getGlobalSwarmStatus();
    expect(afterAssign.busyAgents).toBe(1);

    const [execution] = service.listExecutions(AGENCY);
    expect(execution.taskId).toBe(taskId);
    expect(execution.status).toBe('executing');

    // Outcome event is emitted by the driver, not the executor.
    const completedEvents: string[] = [];
    emitter.on('execution.completed', () => completedEvents.push('completed'));

    const updated = await service.completeExecution(execution.id, AGENCY);
    expect(updated).toBe(true);
    expect(completedEvents).toEqual(['completed']);

    afterAssign = await service.getGlobalSwarmStatus();
    expect(afterAssign.busyAgents).toBe(0);
    expect(afterAssign.onlineAgents).toBe(1);
    expect(afterAssign.completedExecutions).toBe(1);

    service.onModuleDestroy();
  });

  it('keeps partially loaded agents active and only busy at full capacity', async () => {
    const { service } = buildService();
    await service.initializeAgencySwarm(AGENCY);
    await registerWorker(service, 2);

    const task1 = await submitAnalysisTask(service);
    expect((await service.getGlobalSwarmStatus()).busyAgents).toBe(0);

    const task2 = await submitAnalysisTask(service);
    expect((await service.getGlobalSwarmStatus()).busyAgents).toBe(1);

    const executions = service.listExecutions(AGENCY);
    expect(executions).toHaveLength(2);

    // Completing one of two loads leaves the agent at 1/2 capacity -> active
    // again (busy means AT capacity), but still online.
    await service.completeExecution(executions[0].id, AGENCY);
    const partiallyReleased = await service.getGlobalSwarmStatus();
    expect(partiallyReleased.busyAgents).toBe(0);
    expect(partiallyReleased.onlineAgents).toBe(1);

    await service.completeExecution(executions[1].id, AGENCY);
    expect((await service.getGlobalSwarmStatus()).busyAgents).toBe(0);

    void task1;
    void task2;
    service.onModuleDestroy();
  });

  it('releases agents and records the reason when an execution fails', async () => {
    const { service } = buildService();
    await service.initializeAgencySwarm(AGENCY);
    await registerWorker(service, 1);

    await submitAnalysisTask(service);
    const [execution] = service.listExecutions(AGENCY);

    const updated = await service.failExecution(execution.id, 'worker-crash', AGENCY);
    expect(updated).toBe(true);

    const status = await service.getGlobalSwarmStatus();
    expect(status.busyAgents).toBe(0);
    expect(status.activeExecutions).toBe(0);

    service.onModuleDestroy();
  });

  it('drives completion through the execution.complete event contract', async () => {
    const { service, emitter } = buildService();
    await service.initializeAgencySwarm(AGENCY);
    await registerWorker(service, 1);

    await submitAnalysisTask(service);
    const [execution] = service.listExecutions(AGENCY);
    expect((await service.getGlobalSwarmStatus()).busyAgents).toBe(1);

    // Mirror what Nest's EventEmitterModule explorer does at bootstrap: bind
    // the imperative event to the service's @OnEvent handler.
    emitter.on('execution.complete', (payload: { executionId: string; agencyId?: string }) =>
      (service as any).onExecutionComplete(payload)
    );
    emitter.emit('execution.complete', { executionId: execution.id, agencyId: AGENCY });
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect((await service.getGlobalSwarmStatus()).busyAgents).toBe(0);
    expect((await service.getGlobalSwarmStatus()).completedExecutions).toBe(1);

    service.onModuleDestroy();
  });

  it('counts busy agents as online for connectivity and health', async () => {
    const { service } = buildService();
    await service.initializeAgencySwarm(AGENCY);
    await registerWorker(service, 1);

    await submitAnalysisTask(service);

    const status = await service.getSwarmStatus(AGENCY);
    expect(status.activeProviders).toBe(1); // busy agent is still online
    expect(status.healthMetrics.agentConnectivity).toBe(1);

    service.onModuleDestroy();
  });

  it('marks stale agents offline and revives them on heartbeat', async () => {
    const { service } = buildService();
    (service as any).heartbeatTimeoutMs = -1; // every agent is instantly stale
    await service.initializeAgencySwarm(AGENCY);
    const agentId = await registerWorker(service, 1);

    (service as any).monitorAgentHeartbeats();
    expect((await service.getGlobalSwarmStatus()).onlineAgents).toBe(0);

    expect(await service.recordHeartbeat(AGENCY, 'unknown-agent')).toBe(false);
    expect(await service.recordHeartbeat(AGENCY, agentId)).toBe(true);
    expect((await service.getGlobalSwarmStatus()).onlineAgents).toBe(1);

    service.onModuleDestroy();
  });

  it('reports unknown executions as not-updated', async () => {
    const { service } = buildService();
    expect(await service.completeExecution('exec-does-not-exist')).toBe(false);
    expect(await service.failExecution('exec-does-not-exist', 'boom')).toBe(false);
    service.onModuleDestroy();
  });
});
