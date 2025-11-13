import { createContext } from 'react';
export const AuthContext = createContext({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    login: async () => { throw new Error('Not implemented'); },
    logout: async () => { throw new Error('Not implemented'); },
    register: async () => { throw new Error('Not implemented'); },
});
export const ApiClientContext = createContext({
    baseUrl: '',
    isReady: false,
});
export const WebSocketContext = createContext({
    isConnected: false,
    send: () => { throw new Error('Not implemented'); },
    messages: [],
});
export const FeatureToggleContext = createContext({
    features: {},
    isEnabled: () => false,
    setFeature: () => { },
});
export const SuggestionActionsContext = createContext({
    createSuggestion: async () => { throw new Error('Not implemented'); },
    voteSuggestion: async () => { throw new Error('Not implemented'); },
    updateStatus: async () => { throw new Error('Not implemented'); },
    deleteSuggestion: async () => { throw new Error('Not implemented'); },
    loading: false,
});
//# sourceMappingURL=index.js.map