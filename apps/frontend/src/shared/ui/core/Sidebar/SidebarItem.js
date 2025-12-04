import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button } from '../Button';
import { Tooltip } from '../Tooltip';
import { cn } from '@/lib/utils';
export function SidebarItem(_a) {
    var Icon = _a.icon, label = _a.label, onClick = _a.onClick, view = _a.view, disabled = _a.disabled, tooltip = _a.tooltip, active = _a.active, expanded = _a.expanded;
    var content = (_jsxs(Button, { variant: active ? 'default' : 'ghost', size: expanded ? 'default' : 'icon', onClick: onClick, disabled: disabled, className: cn('w-full justify-start gap-2', expanded ? 'px-4' : 'px-2', active && 'bg-primary/10 hover:bg-primary/20'), children: [_jsx(Icon, { className: cn('h-5 w-5', active && 'text-primary') }), expanded && _jsx("span", { children: label })] }));
    if (tooltip && !expanded) {
        return (_jsx(Tooltip, { content: tooltip, side: "right", children: content }));
    }
    return content;
}
