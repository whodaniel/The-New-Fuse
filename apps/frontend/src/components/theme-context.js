import { jsx as _jsx } from "react/jsx-runtime";
exports.ThemeProvider = ThemeProvider;
exports.useTheme = useTheme;
import react_1 from 'react';
var ThemeContext = (0, react_1.createContext)(undefined);
function ThemeProvider(_a) {
    var children = _a.children;
    var _b = (0, react_1.useState)(function () {
        var savedTheme = localStorage.getItem('theme');
        if (savedTheme)
            return savedTheme;
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }), theme = _b[0], setTheme = _b[1];
    (0, react_1.useEffect)(function () {
        var root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(theme);
        localStorage.setItem('theme', theme);
    }, [theme]);
    var toggleTheme = function () {
        setTheme(function (prev) { return prev === 'light' ? 'dark' : 'light'; });
    };
    return (_jsx(ThemeContext.Provider, { value: { theme: theme, toggleTheme: toggleTheme }, children: children }));
}
function useTheme() {
    var context = (0, react_1.useContext)(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
