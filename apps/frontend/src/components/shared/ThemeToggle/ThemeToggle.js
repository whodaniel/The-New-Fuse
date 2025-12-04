import { jsx as _jsx } from "react/jsx-runtime";
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
export var ThemeToggle = function () {
    var _a = useState(false), mounted = _a[0], setMounted = _a[1];
    var _b = useTheme(), theme = _b.theme, setTheme = _b.setTheme;
    useEffect(function () { return setMounted(true); }, []);
    if (!mounted)
        return null;
    return (_jsx("button", { "aria-label": "Toggle Dark Mode", type: "button", className: "w-10 h-10 p-3 rounded focus:outline-none", onClick: function () { return setTheme(theme === 'dark' ? 'light' : 'dark'); }, children: mounted && (_jsx("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", fill: "currentColor", stroke: "currentColor", className: "w-4 h-4 text-gray-800 dark:text-gray-200", children: theme === 'dark' ? (_jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M5.636 5.636l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" })) : (_jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" })) })) }));
};
