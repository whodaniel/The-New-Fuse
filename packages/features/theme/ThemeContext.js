"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function (t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s)
                if (Object.prototype.hasOwnProperty.call(s, p))
                    t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useTheme = exports.ThemeProvider = void 0;
var react_1 = require("react");
var defaultTheme = {
    mode: 'system',
    fontSize: 'md',
    spacing: 'comfortable',
    colors: {
        light: {
            primary: '#2563eb',
            secondary: '#4f46e5',
            accent: '#7c3aed',
            background: '#f3f4f6',
            surface: '#ffffff',
            text: '#111827',
            textSecondary: '#6b7280',
            border: '#e5e7eb',
            error: '#ef4444',
            warning: '#f59e0b',
            success: '#10b981',
            info: '#3b82f6',
        },
        dark: {
            primary: '#3b82f6',
            secondary: '#6366f1',
            accent: '#8b5cf6',
            background: '#111827',
            surface: '#1f2937',
            text: '#f9fafb',
            textSecondary: '#9ca3af',
            border: '#374151',
            error: '#f87171',
            warning: '#fbbf24',
            success: '#34d399',
            info: '#60a5fa',
        },
    },
    borderRadius: '0.375rem',
    transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
};
var ThemeContext = (0, react_1.createContext)(undefined);
var ThemeProvider = function (_a) {
    var children = _a.children, initialTheme = _a.initialTheme;
    var _b = (0, react_1.useState)(__assign(__assign({}, defaultTheme), initialTheme)), theme = _b[0], setThemeState = _b[1];
    var _c = (0, react_1.useState)('light'), systemColorMode = _c[0], setSystemColorMode = _c[1];
    (0, react_1.useEffect)(function () {
        // Check system color scheme
        var mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        var updateSystemColorMode = function (e) {
            setSystemColorMode(e.matches ? 'dark' : 'light');
        };
        updateSystemColorMode(mediaQuery);
        mediaQuery.addListener(updateSystemColorMode);
        return function () { return mediaQuery.removeListener(updateSystemColorMode); };
    }, []);
    var currentMode = theme.mode === 'system' ? systemColorMode : theme.mode;
    var currentColors = theme.colors[currentMode];
    var setTheme = function (config) {
        setThemeState(function (prev) { return (__assign(__assign(__assign({}, prev), config), { colors: __assign(__assign({}, prev.colors), (config.colors || {})) })); });
    };
    var toggleColorMode = function () {
        setTheme({
            mode: currentMode === 'light' ? 'dark' : 'light',
        });
    };
    (0, react_1.useEffect)(function () {
        // Apply theme to document
        var root = document.documentElement;
        Object.entries(currentColors).forEach(function (_a) {
            var key = _a[0], value = _a[1];
            root.style.setProperty("--color-".concat(key), value);
        });
        root.style.setProperty('--font-size', theme.fontSize);
        root.style.setProperty('--spacing', theme.spacing);
        root.style.setProperty('--border-radius', theme.borderRadius);
        root.style.setProperty('--transition', theme.transition);
        root.classList.toggle('dark', currentMode === 'dark');
    }, [theme, currentMode, currentColors]);
    var value = {
        theme: theme,
        currentColors: currentColors,
        setTheme: setTheme,
        toggleColorMode: toggleColorMode,
    };
    return value = { value } > { children } < /ThemeContext.Provider>;
    ;
};
exports.ThemeProvider = ThemeProvider;
var useTheme = function () {
    var context = (0, react_1.useContext)(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
exports.useTheme = useTheme;
//# sourceMappingURL=ThemeContext.js.map