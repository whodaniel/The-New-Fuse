export {}
exports.ThemeProvider = ThemeProvider;
exports.useTheme = useTheme;
import react_1 from 'react';
const ThemeContext = (0, react_1.createContext)(undefined);
function ThemeProvider({ children }): any {
    const [theme, setTheme] = (0, react_1.useState)(() => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme)
            return savedTheme;
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    });
    (0, react_1.useEffect)(() => {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(theme);
        localStorage.setItem('theme', theme);
    }, [theme]);
    const toggleTheme = (): any => {
        setTheme((prev: any) => prev === 'light' ? 'dark' : 'light');
    };
    return (<ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>);
}
function useTheme(): any {
    const context = (0, react_1.useContext)(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
export {};
//# sourceMappingURL=theme-context.js.map