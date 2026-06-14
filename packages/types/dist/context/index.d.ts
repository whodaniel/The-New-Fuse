export interface AuthUser {
    id: string;
    email: string;
    name?: string;
    role?: string;
}
export interface AuthContextProps {
    user: AuthUser | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    register: (email: string, password: string, name?: string) => Promise<void>;
}
export declare const AuthContext: import("react").Context<AuthContextProps>;
export interface ApiClientContextProps {
    baseUrl: string;
    apiKey?: string;
    client?: any;
    isReady: boolean;
}
export declare const ApiClientContext: import("react").Context<ApiClientContextProps>;
export interface WebSocketMessage {
    type: string;
    payload: any;
}
export interface WebSocketContextProps {
    isConnected: boolean;
    send: (message: WebSocketMessage) => void;
    messages: WebSocketMessage[];
}
export declare const WebSocketContext: import("react").Context<WebSocketContextProps>;
export interface FeatureFlags {
    [key: string]: boolean;
}
export interface FeatureToggleContextProps {
    features: FeatureFlags;
    isEnabled: (featureName: string) => boolean;
    setFeature: (featureName: string, enabled: boolean) => void;
}
export declare const FeatureToggleContext: import("react").Context<FeatureToggleContextProps>;
export interface SuggestionActionsContextProps {
    createSuggestion: (title: string, description: string) => Promise<void>;
    voteSuggestion: (id: string) => Promise<void>;
    updateStatus: (id: string, status: string) => Promise<void>;
    deleteSuggestion: (id: string) => Promise<void>;
    loading: boolean;
}
export declare const SuggestionActionsContext: import("react").Context<SuggestionActionsContextProps>;
//# sourceMappingURL=index.d.ts.map