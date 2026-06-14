"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.A2AProvider = A2AProvider;
exports.useA2AContext = useA2AContext;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const useA2A_1 = require("./useA2A");
const A2AContext = (0, react_1.createContext)(null);
function A2AProvider({ config, autoConnect = false, autoRegister = false, agentRegistration, children }) {
    const a2aHook = (0, useA2A_1.useA2A)(config);
    (0, react_1.useEffect)(() => {
        if (autoConnect && !a2aHook.connectionState.connected) {
            a2aHook.connect();
        }
    }, [autoConnect, a2aHook.connectionState.connected, a2aHook.connect]);
    (0, react_1.useEffect)(() => {
        if (autoRegister && agentRegistration && a2aHook.connectionState.authenticated) {
            a2aHook.registerAgent(agentRegistration);
        }
    }, [autoRegister, agentRegistration, a2aHook.connectionState.authenticated, a2aHook.registerAgent]);
    const contextValue = {
        ...a2aHook
    };
    return ((0, jsx_runtime_1.jsx)(A2AContext.Provider, { value: contextValue, children: children }));
}
function useA2AContext() {
    const context = (0, react_1.useContext)(A2AContext);
    if (!context) {
        throw new Error('useA2AContext must be used within an A2AProvider');
    }
    return context;
}
//# sourceMappingURL=A2AProvider.js.map