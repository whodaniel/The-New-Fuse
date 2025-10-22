import { WorkflowState } from '../types/types';

interface StateManager {
  saveState(workflowId: string, state: WorkflowState): Promise<void>;
  getState(workflowId: string): Promise<any>;
}

interface StateTransitionEvent {
  workflowId: string;
  previousState: string;
  newState: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

interface EventStore {
  recordTransition(event: StateTransitionEvent): Promise<void>;
  getEventsSince(workflowId: string, timestamp: Date): Promise<any[]>;
}

export class WorkflowStatePersistence {
  private readonly stateManager: StateManager;
  private readonly eventStore: EventStore;

  constructor(stateManager: StateManager, eventStore: EventStore) {
    this.stateManager = stateManager;
    this.eventStore = eventStore;
  }

  async persistWorkflowState(workflowId: string, state: WorkflowState): Promise<void> {
    // Store current state
    await this.stateManager.saveState(workflowId, state);

    // Record state transition event
    await this.eventStore.recordTransition({
      workflowId,
      previousState: state.previous || 'initial',
      newState: state.current,
      timestamp: new Date(),
      metadata: state.metadata,
    });
  }

  async recoverWorkflowState(workflowId: string): Promise<WorkflowState> {
    // Retrieve last known state
    const savedState = await this.stateManager.getState(workflowId);

    // Replay events if needed
    const events = await this.eventStore.getEventsSince(workflowId, savedState.timestamp || new Date(0));

    return this.reconstructState(savedState, events);
  }

  private reconstructState(savedState: any, events: any[]): WorkflowState {
    // Implementation for reconstructing state from events
    let currentState = savedState;

    for (const event of events) {
      currentState = this.applyEvent(currentState, event);
    }

    return currentState;
  }

  private applyEvent(state: any, event: any): any {
    // Implementation for applying event to state
    return { ...state, ...event.changes };
  }
}
