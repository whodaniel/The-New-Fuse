export function useTheme(storageKey) {
    if (storageKey === void 0) { storageKey = 'ui-theme'; }
    var _a = useState({
        theme: 'system',
        systemTheme: 'light',
    }), state = _a[0], setState = _a[1];
    useEffect(function () {
        var savedTheme = localStorage.getItem(storageKey);
        if (savedTheme) {
            setState(function (prev) { return (Object.assign(Object.assign({}, prev), { theme: savedTheme })); });
        }
        var mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        var updateSystemTheme = function (e) {
            setState(function (prev) { return (Object.assign(Object.assign({}, prev), { systemTheme: e.matches ? 'dark' : 'light' })); });
        };
        updateSystemTheme(mediaQuery);
        mediaQuery.addEventListener('change', updateSystemTheme);
        return function () { return mediaQuery.removeEventListener('change', updateSystemTheme); };
    }, [storageKey]);
    var setTheme = function (theme) {
        setState(function (prev) { return (Object.assign(Object.assign({}, prev), { theme: theme })); });
        localStorage.setItem(storageKey, theme);
    };
    useEffect(function () {
        var root = window.document.documentElement;
        var activeTheme = state.theme === 'system' ? state.systemTheme : state.theme;
        root.classList.remove('light', 'dark');
        root.classList.add(activeTheme);
    }, [state.theme, state.systemTheme]);
    return [state.theme, setTheme];
}
