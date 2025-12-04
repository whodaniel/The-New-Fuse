import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext } from 'react';
import { useTheme } from '@features/theme/ThemeContext';
var ThemeContext = createContext(undefined);
export function ThemeProvider(_a) {
    var children = _a.children, _b = _a.defaultTheme, defaultTheme = _b === void 0 ? 'system' : _b, _c = _a.storageKey, storageKey = _c === void 0 ? 'ui-theme' : _c;
    var _d = useTheme(storageKey), theme = _d[0], setTheme = _d[1];
    var value = {
        theme: theme,
        setTheme: setTheme,
    };
    return (_jsx(ThemeContext.Provider, { value: value, children: children }));
}
export var useThemeContext = function () {
    var context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useThemeContext must be used within a ThemeProvider');
    }
    return context;
};
