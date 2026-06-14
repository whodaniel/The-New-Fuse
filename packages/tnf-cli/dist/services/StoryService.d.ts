export interface StorySession {
    id: string;
    user_id: string;
    owner_principal_id: string;
    title: string;
    description?: string;
    status: 'active' | 'completed' | 'archived';
    created_at: string;
    updated_at: string;
}
export interface StoryQuestion {
    id: number;
    text: string;
    ring: number;
    shelfCode: string;
    ddcLabel: string;
    answer: string;
    captured: boolean;
}
export interface StoryTimelineEvent {
    id: string;
    type: string;
    event_date: string;
    title: string;
    description?: string;
    era?: number;
    sourceType?: string;
    tags?: string[];
    sourceQuestionId?: number;
    sourceSessionId?: string;
}
export declare class StoryService {
    private supabase;
    private readonly defaultOwnerPrincipalId;
    private readonly authMode;
    constructor();
    listSessions(ownerPrincipalId?: string): Promise<StorySession[]>;
    getActiveSession(ownerPrincipalId?: string): Promise<StorySession | null>;
    createSession(params: {
        title: string;
        description?: string;
        ownerPrincipalId?: string;
    }): Promise<StorySession>;
    getQuestions(): StoryQuestion[];
    getCapturedQuestionIds(sessionId: string): Promise<number[]>;
    listTimelineEvents(ownerPrincipalId?: string): Promise<StoryTimelineEvent[]>;
    doctor(): Promise<{
        url: string;
        authMode: string;
        owner: string;
        story_sessions: {
            ok: boolean;
            message: string;
        };
        timeline_events: {
            ok: boolean;
            message: string;
        };
    }>;
    saveCapture(params: {
        sessionId: string;
        questionId: number;
        ring: number;
        shelfCode: string;
        questionText: string;
        answerText: string;
        ownerPrincipalId?: string;
    }): Promise<any>;
    private getSessionById;
    private resolveOwnerPrincipalId;
    private wrapSupabaseError;
    private isPermissionError;
    private extractErrorMessage;
    private mapRingToEra;
}
//# sourceMappingURL=StoryService.d.ts.map