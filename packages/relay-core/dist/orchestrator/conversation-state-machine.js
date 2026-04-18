import { EventEmitter } from 'node:events'; // eslint-disable-line import/no-unresolved
export var ConversationPhase;
(function (ConversationPhase) {
    ConversationPhase["INITIALIZING"] = "initializing";
    ConversationPhase["AGENT_DISCOVERY"] = "agent_discovery";
    ConversationPhase["TASK_ASSIGNMENT"] = "task_assignment";
    ConversationPhase["EXECUTION"] = "execution";
    ConversationPhase["REVIEW"] = "review";
    ConversationPhase["COMPLETION"] = "completion";
    ConversationPhase["STALLED"] = "stalled";
    ConversationPhase["RECOVERY"] = "recovery";
    ConversationPhase["TERMINATED"] = "terminated";
    ConversationPhase["PAUSED"] = "paused";
})(ConversationPhase || (ConversationPhase = {}));
export class ConversationStateMachine extends EventEmitter {
    constructor(channelId, config) {
        super();
        this.phase = ConversationPhase.INITIALIZING;
        this.channelId = channelId;
        this.config = {
            maxDuration: config?.maxDuration || 3600000, // 1 hour
            phaseTimeouts: config?.phaseTimeouts || {
                [ConversationPhase.INITIALIZING]: 60000,
                [ConversationPhase.AGENT_DISCOVERY]: 60000,
                [ConversationPhase.TASK_ASSIGNMENT]: 60000,
                [ConversationPhase.EXECUTION]: 3600000,
                [ConversationPhase.REVIEW]: 3600000,
                [ConversationPhase.COMPLETION]: 3600000,
                [ConversationPhase.STALLED]: 3600000,
                [ConversationPhase.RECOVERY]: 3600000,
                [ConversationPhase.TERMINATED]: 0,
                [ConversationPhase.PAUSED]: 0,
            },
            autoAdvance: config?.autoAdvance ?? true,
            requireHumanApproval: config?.requireHumanApproval ?? false,
        };
        this.phaseStartedAt = Date.now();
        this.lastActivityAt = Date.now();
    }
    get currentPhase() {
        return this.phase;
    }
    getPhase() {
        return this.phase;
    }
    get durationInPhase() {
        return Date.now() - this.phaseStartedAt;
    }
    recordActivity() {
        this.lastActivityAt = Date.now();
    }
    async pause() {
        if (this.phase === ConversationPhase.PAUSED) {
            return;
        }
        await this.transition(ConversationPhase.PAUSED);
    }
    async resume() {
        if (this.phase !== ConversationPhase.PAUSED) {
            return;
        }
        // Resume to EXECUTION by default or logic to determine previous phase
        await this.transition(ConversationPhase.EXECUTION);
    }
    async transition(newPhase) {
        if (this.phase === newPhase) {
            return;
        }
        // console.log(`[Conversation] ${this.phase} -> ${newPhase}`);
        // Exit actions
        await this.exitPhase(this.phase);
        // Transition
        const oldPhase = this.phase;
        this.phase = newPhase;
        this.phaseStartedAt = Date.now();
        this.emit('phase:changed', {
            from: oldPhase,
            to: newPhase,
            timestamp: this.phaseStartedAt,
            conversationId: this.channelId,
        });
        // Entry actions
        await this.enterPhase(newPhase);
    }
    async exitPhase(_phase) {
        // Logic for cleanup when leaving a phase
        // console.log(`[Conversation] Exiting phase: ${phase}`);
    }
    async enterPhase(phase) {
        // console.log(`[Conversation] Entering phase: ${phase}`);
        switch (phase) {
            case ConversationPhase.STALLED:
                await this.handleStallEntry();
                break;
            case ConversationPhase.RECOVERY:
                await this.handleRecoveryEntry();
                break;
            case ConversationPhase.INITIALIZING:
            case ConversationPhase.AGENT_DISCOVERY:
            case ConversationPhase.TASK_ASSIGNMENT:
            case ConversationPhase.EXECUTION:
            case ConversationPhase.REVIEW:
            case ConversationPhase.COMPLETION:
            case ConversationPhase.TERMINATED:
            case ConversationPhase.PAUSED:
                // Default entry logic if any
                break;
        }
    }
    async handleStallEntry() {
        // console.log('[Conversation] Handling stall entry...');
        // Additional logic can be added here
    }
    async handleRecoveryEntry() {
        // console.log('[Conversation] Handling recovery entry...');
        // Additional logic can be added here
    }
}
//# sourceMappingURL=conversation-state-machine.js.map