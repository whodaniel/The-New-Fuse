import { jsx as _jsx } from "react/jsx-runtime";
import * as React from 'react';
const LayoutContext = React.createContext(undefined);
/**
 * Shared layout state provider migrated from the legacy layout package.
 * Keeps collapsed sidebar state in one place for composed layout UIs.
 */
export function LayoutProvider({ children, defaultCollapsed = false }) {
    const [collapsed, setCollapsed] = React.useState(defaultCollapsed);
    const toggleCollapsed = React.useCallback(() => {
        setCollapsed((current) => !current);
    }, []);
    const value = React.useMemo(() => ({
        collapsed,
        setCollapsed,
        toggleCollapsed,
    }), [collapsed, toggleCollapsed]);
    return _jsx(LayoutContext.Provider, { value: value, children: children });
}
export function useLayoutContext() {
    const context = React.useContext(LayoutContext);
    if (!context) {
        throw new Error('useLayoutContext must be used within a LayoutProvider');
    }
    return context;
}
