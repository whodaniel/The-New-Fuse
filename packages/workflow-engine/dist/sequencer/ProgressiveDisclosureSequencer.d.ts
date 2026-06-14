export interface ProgressivePromptBridge {
    findElements(): {
        isReady: boolean;
    };
    sendMessage(text: string): Promise<boolean>;
    isStreaming?(): boolean;
    getLastResponse?(): string | null;
}
export interface ProgressiveDisclosureStep {
    id: string;
    label: string;
    prompt: string;
}
export interface ProgressiveDisclosureSequencerOptions {
    idleThresholdMs?: number;
    minPromptIntervalMs?: number;
    maxPromptsPerConversation?: number;
    prefix?: string;
    steps?: ProgressiveDisclosureStep[];
    now?: () => number;
    log?: Pick<Console, 'log' | 'warn'>;
}
export interface ProgressiveDisclosureSequencerStatus {
    enabled: boolean;
    activeConversation: boolean;
    currentStep: ProgressiveDisclosureStep;
    currentStepIndex: number;
    totalSteps: number;
    promptsSent: number;
    awaitingResponse: boolean;
    lastActivityAt: number;
    lastPromptAt: number;
    blockedReason: string | null;
}
export declare const DEFAULT_PROGRESSIVE_DISCLOSURE_STEPS: ProgressiveDisclosureStep[];
export declare class ProgressiveDisclosureSequencer {
    private readonly bridge;
    private readonly idleThresholdMs;
    private readonly minPromptIntervalMs;
    private readonly maxPromptsPerConversation;
    private readonly prefix;
    private readonly now;
    private readonly log;
    private steps;
    private lastActivityAt;
    private lastPromptAt;
    private enabled;
    private activeConversation;
    private currentStepIndex;
    private promptsSent;
    private awaitingResponse;
    private responseSnapshot;
    private inFlight;
    constructor(bridge: ProgressivePromptBridge, options?: ProgressiveDisclosureSequencerOptions);
    updateActivity(): void;
    enable(): void;
    disable(): void;
    checkAndPrompt(): void;
    checkAndPromptAsync(): Promise<boolean>;
    setWorkflowSteps(steps: ProgressiveDisclosureStep[]): void;
    resetConversation(): void;
    getStatus(): ProgressiveDisclosureSequencerStatus;
    private getBlockedReason;
    private refreshResponseGate;
    private formatPrompt;
    private getCurrentStep;
    private advanceStep;
    private getResponseSnapshot;
    private normalizeSteps;
}
export type ProgressivePromptStep = ProgressiveDisclosureStep;
export type ProgressiveSelfPrompterOptions = ProgressiveDisclosureSequencerOptions;
export type ProgressiveSelfPrompterStatus = ProgressiveDisclosureSequencerStatus;
export declare const DEFAULT_PROGRESSIVE_PROMPT_STEPS: ProgressiveDisclosureStep[];
export declare class ProgressiveSelfPrompter extends ProgressiveDisclosureSequencer {
}
//# sourceMappingURL=ProgressiveDisclosureSequencer.d.ts.map