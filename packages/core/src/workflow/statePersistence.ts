import { WorkflowState } from './types';
interface StateManager {
  // Implementation needed
}
  saveState(workflowId: string, state: WorkflowState): Promise<void>;
  getState(workflowId: string): Promise<any>;
}

interface EventStore {
  // Implementation needed
}
  recordTransition(event: {
  // Implementation needed
}
    workflowId: string;
    previousState: string;
    newState: string;
    timestamp: Date;
    metadata?: Record<string, unknown>;
  }): Promise<void>;
  getEventsSince(workflowId: string, timestamp: Date): Promise<any[]>;
}

export class WorkflowStatePersistence {
  // Implementation needed
}
  private readonly stateManager: StateManager;
  private readonly eventStore: EventStore;
  constructor(stateManager: StateManager, eventStore: EventStore) {
  // Implementation needed
}
    this.stateManager = stateManager;
    this.eventStore = eventStore;
  }

  async persistWorkflowState(workflowId: string, state: WorkflowState): Promise<void> {
  // Implementation needed
}
    // Store current state
    await this.stateManager.saveState(workflowId, state);
    // Record state transition event
    await this.eventStore.recordTransition({
  // Implementation needed
}
      workflowId,
      previousState: state.previous || 'initial',
      newState: state.current,
      timestamp: new Date(),
      metadata: state.metadata,
    });
  }

  async recoverWorkflowState(workflowId: string): Promise<WorkflowState> {
  // Implementation needed
}
    // Retrieve last known state
    const savedState = await this.stateManager.getState(workflowId);
    // Replay events if needed
    const events = await this.eventStore.getEventsSince(workflowId, savedState.timestamp || new Date(0));
    return this.reconstructState(savedState, events);
  }

  private reconstructState(savedState: any, events: any[]): WorkflowState {
  // Implementation needed
}
    // Implementation for reconstructing state from events
    let currentState = savedState;
    for (const event of events) {
  // Implementation needed
}
      currentState = this.applyEvent(currentState, event);
    }

    return currentState;
  }

  private applyEvent(state: any, event: any): any {
  // Implementation needed
}
    // Implementation for applying event to state
    return { ...state, ...event.changes };
  }
}