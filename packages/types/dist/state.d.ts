export interface AppState {
    loading: boolean;
    error?: string;
    user?: unknown;
}
export interface StateManager {
    getState(): AppState;
    setState(state: Partial<AppState>): void;
}
//# sourceMappingURL=state.d.ts.map