import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button } from '../Button';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';
import { MoonIcon, SunIcon } from '@/components/icons';
export function ThemeToggle(_a) {
    var className = _a.className, iconClassName = _a.iconClassName, _b = _a.showLabel, showLabel = _b === void 0 ? false : _b;
    var _c = useTheme(), theme = _c.theme, toggleTheme = _c.toggleTheme;
    var isLight = theme === 'light';
    return (_jsxs(Button, { variant: "ghost", size: "icon", onClick: toggleTheme, className: cn('relative w-9 h-9', className), "aria-label": "Switch to ".concat(isLight ? 'dark' : 'light', " theme"), children: [_jsxs("div", { className: "relative w-5 h-5", children: [_jsx("div", { className: cn('absolute inset-0 transition-opacity', isLight ? 'opacity-0' : 'opacity-100', iconClassName), children: _jsx(MoonIcon, { className: "w-full h-full" }) }), _jsx("div", { className: cn('absolute inset-0 transition-opacity', isLight ? 'opacity-100' : 'opacity-0', iconClassName), children: _jsx(SunIcon, { className: "w-full h-full" }) })] }), showLabel && (_jsx("span", { className: "ml-2 text-sm", children: isLight ? 'Dark Mode' : 'Light Mode' }))] }));
}
