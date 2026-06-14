"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentFlightRecorder = void 0;
const events_1 = require("events");
/**
 * AgentFlightRecorder
 *
 * Provides telemetry and behavioral analysis recording for agents.
 * Records session actions, state snapshots,
 * and errors for debugging and analyzing agent behavior.
 */
class AgentFlightRecorder extends events_1.EventEmitter {
    constructor(storagePath = './logs/flight-recorder') {
        super();
        this.activeSessions = new Map();
        this.recordStoragePath = storagePath;
    }
    /**
     * Start a new recording session
     */
    startSession(agentId, metadata = {}) {
        const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const record = {
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
    recordAction(sessionId, actionType, target, details) {
        const session = this.activeSessions.get(sessionId);
        if (!session) {
            console.warn(`[FlightRecorder] Attempted to record action for unknown session ${sessionId}`);
            return;
        }
        const action = {
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
    async endSession(sessionId) {
        const session = this.activeSessions.get(sessionId);
        if (!session)
            return null;
        session.endTime = Date.now();
        this.activeSessions.delete(sessionId);
        console.log(`[FlightRecorder] Ended recording session ${sessionId} with ${session.actions.length} actions`);
        // In a full implementation, save this to `this.recordStoragePath` or push to a central telemetry server
        this.emit('session-ended', session);
        return session;
    }
    /**
     * Get an active session's current record
     */
    getActiveSession(sessionId) {
        return this.activeSessions.get(sessionId);
    }
}
exports.AgentFlightRecorder = AgentFlightRecorder;
//# sourceMappingURL=AgentFlightRecorder.js.map