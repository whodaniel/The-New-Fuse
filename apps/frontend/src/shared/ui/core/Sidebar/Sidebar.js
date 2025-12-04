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
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../Button';
import { SidebarItem } from './SidebarItem';
import { cn } from '@/lib/utils';
export function Sidebar(_a) {
    var items = _a.items, _b = _a.bottomItems, bottomItems = _b === void 0 ? [] : _b, activeView = _a.activeView, onViewChange = _a.onViewChange, className = _a.className, _c = _a.expanded, expanded = _c === void 0 ? false : _c, onExpandedChange = _a.onExpandedChange, _d = _a.width, width = _d === void 0 ? {
        expanded: 'w-64',
        collapsed: 'w-16'
    } : _d;
    var handleItemClick = function (item) {
        if (item.onClick) {
            item.onClick();
        }
        if (item.view && onViewChange) {
            onViewChange(item.view);
        }
    };
    return (_jsxs("div", { className: cn('flex flex-col h-full bg-background border-r transition-all duration-300', expanded ? width.expanded : width.collapsed, className), children: [_jsx("div", { className: "flex flex-col flex-grow p-2 space-y-2", children: items.map(function (item, index) { return (_jsx(SidebarItem, __assign({}, item, { active: item.view === activeView, expanded: expanded, onClick: function () { return handleItemClick(item); } }), index)); }) }), _jsxs("div", { className: "p-2 space-y-2", children: [bottomItems.map(function (item, index) { return (_jsx(SidebarItem, __assign({}, item, { active: item.view === activeView, expanded: expanded, onClick: function () { return handleItemClick(item); } }), index)); }), onExpandedChange && (_jsx(Button, { variant: "ghost", size: "icon", onClick: function () { return onExpandedChange(!expanded); }, className: "w-full justify-center", children: expanded ? (_jsx(ChevronLeft, { className: "h-5 w-5" })) : (_jsx(ChevronRight, { className: "h-5 w-5" })) }))] })] }));
}
