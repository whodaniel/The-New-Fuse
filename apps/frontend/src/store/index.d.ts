interface AppState {
    system: {
        isDevelopment: boolean;
    };
}
interface AppActions {
    setDevelopmentMode: (isDev: boolean) => void;
}
export declare const useStore: import("zustand").UseBoundStore<Omit<import("zustand").StoreApi<AppState & AppActions>, "setState" | "devtools"> & {
    setState(partial: (AppState & AppActions) | Partial<AppState & AppActions> | ((state: AppState & AppActions) => (AppState & AppActions) | Partial<AppState & AppActions>), replace?: false | undefined, action?: (string | {
        [x: string]: unknown;
        [x: number]: unknown;
        [x: symbol]: unknown;
        type: string;
    }) | undefined): void;
    setState(state: (AppState & AppActions) | ((state: AppState & AppActions) => AppState & AppActions), replace: true, action?: (string | {
        [x: string]: unknown;
        [x: number]: unknown;
        [x: symbol]: unknown;
        type: string;
    }) | undefined): void;
    devtools: {
        cleanup: () => void;
    };
}>;
export {};
