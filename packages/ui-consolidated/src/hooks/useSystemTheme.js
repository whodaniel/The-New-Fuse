import { useEffect, useState } from 'react';
export const useSystemTheme = () => {
    // Add proper window type check
    if (typeof window === 'undefined')
        return 'light';
    const [systemTheme, setSystemTheme] = useState('light');
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const updateTheme = (e) => {
            setSystemTheme(e.matches ? 'dark' : 'light');
        };
        updateTheme(mediaQuery);
        mediaQuery.addEventListener('change', updateTheme);
        return () => mediaQuery.removeEventListener('change', updateTheme);
    }, []);
    return systemTheme;
};
//# sourceMappingURL=useSystemTheme.js.map