export interface SuggestionActionsContextType {
    submitSuggestion: (content: string) => Promise<void>;
    approveSuggestion: (id: string) => Promise<void>;
    rejectSuggestion: (id: string) => Promise<void>;
}
export declare const SuggestionActionsContext: import("react").Context<SuggestionActionsContextType>;
//# sourceMappingURL=suggestion-actions.d.ts.map