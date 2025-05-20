import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
export const ThemeToggle = () => {
    const [mounted, setMounted] = useState(false);
    const { theme, setTheme } = useTheme();
    useEffect(() => setMounted(true), []);
    if (!mounted)
        return null;
    return (<button aria-label="Toggle Dark Mode" type="button" className="w-10 h-10 p-3 rounded focus:outline-none" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
      {mounted && (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" className="w-4 h-4 text-gray-800 dark:text-gray-200">
          {theme === 'dark' ? (<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M5.636 5.636l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/>) : (<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>)}
        </svg>)}
    </button>);
};
//# sourceMappingURL=ThemeToggle.js.map