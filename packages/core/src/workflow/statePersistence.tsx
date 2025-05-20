export class WorkflowStatePersistence {
  private readonly stateManager: StateManager;
  private readonly eventStore: EventStore;

  async persistWorkflowState(
    workflowId: string, 
    state: WorkflowState
  ): Promise<void> {
    // Store current state
    await this.stateManager.saveState(workflowId, state);
    
    // Record state transition event
    await this.eventStore.recordTransition({
      workflowId,
      previousState: state.previous,
      newState: state.current,
      timestamp: new Date(),
      metadata: state.metadata
    });
  }

  async recoverWorkflowState(
    workflowId: string
  ): Promise<WorkflowState> {
    // Retrieve last known state
    const savedState = await this.stateManager.getState(workflowId);
    
    // Replay events if needed
    const events = await this.eventStore.getEventsSince(
      workflowId, 
      savedState.timestamp
    );
    
    return this.reconstructState(savedState, events);
  }
}
