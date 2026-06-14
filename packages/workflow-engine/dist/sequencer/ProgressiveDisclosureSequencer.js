"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProgressiveSelfPrompter = exports.DEFAULT_PROGRESSIVE_PROMPT_STEPS = exports.ProgressiveDisclosureSequencer = exports.DEFAULT_PROGRESSIVE_DISCLOSURE_STEPS = void 0;
exports.DEFAULT_PROGRESSIVE_DISCLOSURE_STEPS = [
    {
        id: 'orient',
        label: 'Orient',
        prompt: 'Restate the current objective, identify the single next checkpoint, and stop after that checkpoint is clear.',
    },
    {
        id: 'inspect',
        label: 'Inspect',
        prompt: 'Inspect the current state needed for that checkpoint. Use concrete evidence from the page, tool output, or conversation state before deciding.',
    },
    {
        id: 'act',
        label: 'Act',
        prompt: 'Take the smallest useful next action for the checkpoint. Keep it bounded, and call out any assumption that affects the action.',
    },
    {
        id: 'verify',
        label: 'Verify',
        prompt: 'Verify whether the action worked using observable state. If it did not work, give the next changed attempt instead of repeating the same action.',
    },
    {
        id: 'handoff',
        label: 'Handoff',
        prompt: 'Summarize what changed, what remains uncertain, and the next concrete action for the workflow.',
    },
];
class ProgressiveDisclosureSequencer {
    constructor(bridge, options = {}) {
        this.lastPromptAt = 0;
        this.enabled = false;
        this.activeConversation = false;
        this.currentStepIndex = 0;
        this.promptsSent = 0;
        this.awaitingResponse = false;
        this.responseSnapshot = null;
        this.inFlight = false;
        this.bridge = bridge;
        this.idleThresholdMs = options.idleThresholdMs ?? 45000;
        this.minPromptIntervalMs = options.minPromptIntervalMs ?? 60000;
        this.maxPromptsPerConversation = options.maxPromptsPerConversation ?? 8;
        this.prefix = options.prefix ?? 'Auto-Continue';
        this.steps = this.normalizeSteps(options.steps);
        this.now = options.now ?? (() => Date.now());
        this.log = options.log ?? console;
        this.lastActivityAt = this.now();
    }
    updateActivity() {
        this.lastActivityAt = this.now();
        this.activeConversation = true;
        this.refreshResponseGate();
    }
    enable() {
        this.enabled = true;
        this.log.log('[ProgressiveDisclosureSequencer] Progressive auto-continue enabled');
    }
    disable() {
        this.enabled = false;
        this.log.log('[ProgressiveDisclosureSequencer] Progressive auto-continue disabled');
    }
    checkAndPrompt() {
        void this.checkAndPromptAsync();
    }
    async checkAndPromptAsync() {
        if (this.getBlockedReason())
            return false;
        const step = this.getCurrentStep();
        this.inFlight = true;
        this.lastPromptAt = this.now();
        this.responseSnapshot = this.getResponseSnapshot();
        this.log.log('[ProgressiveDisclosureSequencer] Triggering progressive auto-prompt:', step.id);
        try {
            const success = await this.bridge.sendMessage(this.formatPrompt(step));
            if (!success) {
                this.log.warn('[ProgressiveDisclosureSequencer] Failed to send progressive auto-prompt');
                return false;
            }
            this.promptsSent++;
            this.lastActivityAt = this.now();
            this.awaitingResponse = true;
            this.advanceStep();
            this.log.log('[ProgressiveDisclosureSequencer] Progressive auto-prompt sent successfully');
            return true;
        }
        finally {
            this.inFlight = false;
        }
    }
    setWorkflowSteps(steps) {
        this.steps = this.normalizeSteps(steps);
        this.currentStepIndex = 0;
    }
    resetConversation() {
        this.activeConversation = false;
        this.lastActivityAt = this.now();
        this.lastPromptAt = 0;
        this.currentStepIndex = 0;
        this.promptsSent = 0;
        this.awaitingResponse = false;
        this.responseSnapshot = null;
        this.log.log('[ProgressiveDisclosureSequencer] Conversation reset');
    }
    getStatus() {
        return {
            enabled: this.enabled,
            activeConversation: this.activeConversation,
            currentStep: this.getCurrentStep(),
            currentStepIndex: this.currentStepIndex,
            totalSteps: this.steps.length,
            promptsSent: this.promptsSent,
            awaitingResponse: this.awaitingResponse,
            lastActivityAt: this.lastActivityAt,
            lastPromptAt: this.lastPromptAt,
            blockedReason: this.getBlockedReason(),
        };
    }
    getBlockedReason() {
        if (!this.enabled)
            return 'disabled';
        if (!this.activeConversation)
            return 'no_active_conversation';
        if (this.inFlight)
            return 'prompt_in_flight';
        if (this.promptsSent >= this.maxPromptsPerConversation)
            return 'max_prompts_reached';
        if (this.bridge.isStreaming?.())
            return 'chat_streaming';
        if (!this.bridge.findElements().isReady)
            return 'chat_not_ready';
        const now = this.now();
        if (now - this.lastActivityAt < this.idleThresholdMs)
            return 'idle_threshold_not_met';
        if (this.lastPromptAt > 0 && now - this.lastPromptAt < this.minPromptIntervalMs) {
            return 'prompt_interval_not_met';
        }
        if (!this.refreshResponseGate())
            return 'awaiting_response';
        return null;
    }
    refreshResponseGate() {
        if (!this.awaitingResponse)
            return true;
        if (!this.bridge.getLastResponse) {
            this.awaitingResponse = false;
            return true;
        }
        const latestResponse = this.getResponseSnapshot();
        if (latestResponse && latestResponse !== this.responseSnapshot) {
            this.awaitingResponse = false;
            this.responseSnapshot = latestResponse;
            return true;
        }
        return false;
    }
    formatPrompt(step) {
        return `[${this.prefix}:${step.id}] ${step.label}: ${step.prompt}`;
    }
    getCurrentStep() {
        return this.steps[this.currentStepIndex] || this.steps[0];
    }
    advanceStep() {
        this.currentStepIndex = (this.currentStepIndex + 1) % this.steps.length;
    }
    getResponseSnapshot() {
        const response = this.bridge.getLastResponse?.();
        return typeof response === 'string' && response.trim().length > 0 ? response : null;
    }
    normalizeSteps(steps) {
        const normalized = (steps?.length ? steps : exports.DEFAULT_PROGRESSIVE_DISCLOSURE_STEPS)
            .map((step) => ({
            id: String(step.id || '').trim(),
            label: String(step.label || '').trim(),
            prompt: String(step.prompt || '').trim(),
        }))
            .filter((step) => step.id && step.label && step.prompt);
        if (normalized.length === 0) {
            throw new Error('Progressive disclosure sequencer requires at least one valid prompt step.');
        }
        return normalized;
    }
}
exports.ProgressiveDisclosureSequencer = ProgressiveDisclosureSequencer;
exports.DEFAULT_PROGRESSIVE_PROMPT_STEPS = exports.DEFAULT_PROGRESSIVE_DISCLOSURE_STEPS;
class ProgressiveSelfPrompter extends ProgressiveDisclosureSequencer {
}
exports.ProgressiveSelfPrompter = ProgressiveSelfPrompter;
//# sourceMappingURL=ProgressiveDisclosureSequencer.js.map