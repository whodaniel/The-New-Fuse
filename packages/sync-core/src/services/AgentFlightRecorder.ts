import { EventEmitter } from 'events';

export interface AgentAction {
  timestamp: number;
  agentId: string;
  actionType: string;
  target?: string;
  details?: Record<string, any>;
}

export interface AgentSessionRecord {
  sessionId: string;
  agentId: string;
  startTime: number;
  endTime?: number;
  actions: AgentAction[];
  metadata: Record<string, any>;
}

/**
 * AgentFlightRecorder
 *
 * Provides telemetry and behavioral analysis recording for agents.
 * Records session actions, state snapshots,
 * and errors for debugging and analyzing agent behavior.
 */
export class AgentFlightRecorder extends EventEmitter {
  private activeSessions: Map<string, AgentSessionRecord> = new Map();
  private recordStoragePath: string;

  constructor(storagePath: string = './logs/flight-recorder') {
    super();
    this.recordStoragePath = storagePath;
  }

  /**
   * Start a new recording session
   */
  public startSession(agentId: string, metadata: Record<string, any> = {}): string {
    const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const record: AgentSessionRecord = {
      sessionId,
      agentId,
      startTime: Date.now(),
      actions: [],
      metadata,
    };

    this.activeSessions.set(sessionId, record);
    console.log(`[FlightRecorder] Started recording session ${sessionId} for agent ${agentId}`);
    return sessionId;
  }

  /**
   * Record an action in the current session
   */
  public recordAction(
    sessionId: string,
    actionType: string,
    target?: string,
    details?: Record<string, any>
  ): void {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      console.warn(`[FlightRecorder] Attempted to record action for unknown session ${sessionId}`);
      return;
    }

    const action: AgentAction = {
      timestamp: Date.now(),
      agentId: session.agentId,
      actionType,
      target,
      details,
    };

    session.actions.push(action);
    this.emit('action-recorded', { sessionId, action });
  }

  /**
   * End a recording session and save it
   */
  public async endSession(sessionId: string): Promise<AgentSessionRecord | null> {
    const session = this.activeSessions.get(sessionId);
    if (!session) return null;

    session.endTime = Date.now();
    this.activeSessions.delete(sessionId);

    console.log(
      `[FlightRecorder] Ended recording session ${sessionId} with ${session.actions.length} actions`
    );

    // In a full implementation, save this to `this.recordStoragePath` or push to a central telemetry server
    this.emit('session-ended', session);
    return session;
  }

  /**
   * Get an active session's current record
   */
  public getActiveSession(sessionId: string): AgentSessionRecord | undefined {
    return this.activeSessions.get(sessionId);
  }
}
