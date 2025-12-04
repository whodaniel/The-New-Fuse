import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useState, useContext } from 'react';
var ThemeContext = createContext(null);
var defaultTheme = {
    mode: 'system',
    primaryColor: '#0070f3',
    secondaryColor: '#00b4d8',
};
export function ThemeProvider(_a) {
    var children = _a.children;
    var _b = useState(defaultTheme), theme = _b[0], setTheme = _b[1];
    var toggleMode = function () {
        setTheme(function (prev) { return (Object.assign(Object.assign({}, prev), { mode: prev.mode === 'light' ? 'dark' : 'light' })); });
    };
    return (_jsx(ThemeContext.Provider, { value: { theme: theme, setTheme: setTheme, toggleMode: toggleMode }, children: children }));
}
export function useTheme() {
    var context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
export default ThemeContext;
