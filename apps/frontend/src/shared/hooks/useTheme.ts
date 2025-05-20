export function useTheme(storageKey = 'ui-theme'): any {
    const [state, setState] = useState({
        theme: 'system',
        systemTheme: 'light',
    });
    useEffect(() => {
        const savedTheme = localStorage.getItem(storageKey);
        if (savedTheme) {
            setState(prev => (Object.assign(Object.assign({}, prev), { theme: savedTheme })));
        }
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const updateSystemTheme = (e): any => {
            setState(prev => (Object.assign(Object.assign({}, prev), { systemTheme: e.matches ? 'dark' : 'light' })));
        };
        updateSystemTheme(mediaQuery);
        mediaQuery.addEventListener('change', updateSystemTheme);
        return () => mediaQuery.removeEventListener('change', updateSystemTheme);
    }, [storageKey]);
    const setTheme = (theme): any => {
        setState(prev => (Object.assign(Object.assign({}, prev), { theme })));
        localStorage.setItem(storageKey, theme);
    };
    useEffect(() => {
        const root = window.document.documentElement;
        const activeTheme = state.theme === 'system' ? state.systemTheme : state.theme;
        root.classList.remove('light', 'dark');
        root.classList.add(activeTheme);
    }, [state.theme, state.systemTheme]);
    return [state.theme, setTheme];
}
//# sourceMappingURL=useTheme.js.map