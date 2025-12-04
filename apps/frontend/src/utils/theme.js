var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var THEME_KEY = 'app_theme';
var defaultLightColors = {
    primary: '#0066cc',
    secondary: '#666666',
    background: '#ffffff',
    surface: '#f5f5f5',
    text: '#000000',
    textSecondary: '#666666',
    border: '#e0e0e0',
    error: '#dc2626',
    warning: '#f59e0b',
    success: '#16a34a',
    info: '#0891b2',
};
var defaultDarkColors = {
    primary: '#3b82f6',
    secondary: '#9ca3af',
    background: '#1f2937',
    surface: '#374151',
    text: '#ffffff',
    textSecondary: '#9ca3af',
    border: '#4b5563',
    error: '#ef4444',
    warning: '#f59e0b',
    success: '#22c55e',
    info: '#06b6d4',
};
export function getSystemTheme() {
    if (typeof window === 'undefined')
        return 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}
export function getStoredTheme() {
    if (typeof window === 'undefined') {
        return { mode: 'dark', colors: defaultDarkColors };
    }
    var stored = localStorage.getItem(THEME_KEY);
    if (!stored) {
        return { mode: 'system', colors: defaultDarkColors };
    }
    try {
        var theme = JSON.parse(stored);
        return __assign({ mode: theme.mode || 'system', colors: theme.mode === 'light' ? defaultLightColors : defaultDarkColors }, theme);
    }
    catch (_a) {
        return { mode: 'system', colors: defaultDarkColors };
    }
}
export function setTheme(mode) {
    var theme = {
        mode: mode,
        colors: mode === 'light' ? defaultLightColors : defaultDarkColors,
    };
    if (typeof window !== 'undefined') {
        localStorage.setItem(THEME_KEY, JSON.stringify(theme));
        applyTheme(theme);
    }
}
export function applyTheme(theme) {
    var root = document.documentElement;
    var colors = theme.colors;
    // Apply CSS variables
    Object.entries(colors).forEach(function (_a) {
        var key = _a[0], value = _a[1];
        root.style.setProperty("--color-".concat(key), value);
    });
    // Set color scheme meta tag
    var meta = document.querySelector('meta[name="color-scheme"]');
    if (meta) {
        meta.setAttribute('content', theme.mode === 'light' ? 'light' : 'dark');
    }
    // Set class on root element
    root.classList.remove('light', 'dark');
    root.classList.add(theme.mode === 'light' ? 'light' : 'dark');
}
// Initialize theme on load
if (typeof window !== 'undefined') {
    var theme = getStoredTheme();
    var effectiveMode = theme.mode === 'system' ? getSystemTheme() : theme.mode;
    applyTheme(__assign(__assign({}, theme), { colors: effectiveMode === 'light' ? defaultLightColors : defaultDarkColors }));
    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) {
        var currentTheme = getStoredTheme();
        if (currentTheme.mode === 'system') {
            applyTheme(__assign(__assign({}, currentTheme), { colors: e.matches ? defaultDarkColors : defaultLightColors }));
        }
    });
}
