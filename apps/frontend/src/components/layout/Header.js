import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from 'react-router-dom';
import { useLayout } from '../../contexts/LayoutContext';
import { useTheme } from '../../providers/ThemeProvider';
import { useAuth } from '../../providers/AuthProvider';
import { Menu, Sun, Moon } from 'lucide-react';
export function Header() {
    var toggleSidebar = useLayout().toggleSidebar;
    var _a = useTheme(), theme = _a.theme, setTheme = _a.setTheme;
    var _b = useAuth(), user = _b.user, logout = _b.logout;
    var toggleTheme = function () {
        setTheme(theme === 'light' ? 'dark' : 'light');
    };
    return (_jsx("header", { className: "bg-background border-b border-border h-16 flex items-center px-4 sticky top-0 z-10", children: _jsxs("div", { className: "flex items-center justify-between w-full", children: [_jsxs("div", { className: "flex items-center", children: [_jsx("button", { onClick: toggleSidebar, className: "p-2 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground", "aria-label": "Toggle sidebar", children: _jsx(Menu, { className: "h-6 w-6" }) }), _jsx(Link, { to: "/", className: "ml-4 text-xl font-bold text-primary", children: "The New Fuse" })] }), _jsxs("div", { className: "flex items-center space-x-4", children: [_jsx("button", { onClick: toggleTheme, className: "p-2 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground", "aria-label": "Toggle theme", children: theme === 'dark' ? (_jsx(Sun, { className: "h-6 w-6" })) : (_jsx(Moon, { className: "h-6 w-6" })) }), user ? (_jsxs("div", { className: "flex items-center", children: [_jsx("span", { className: "mr-2 text-sm text-muted-foreground", children: user.displayName || user.email }), _jsx("button", { onClick: function () { return logout(); }, className: "px-3 py-1 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90", children: "Logout" })] })) : (_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(Link, { to: "/auth/login", className: "px-3 py-1 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90", children: "Login" }), _jsx(Link, { to: "/auth/register", className: "px-3 py-1 text-sm border border-primary text-primary rounded-md hover:bg-primary/10", children: "Register" })] }))] })] }) }));
}
