import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { useLayout } from '../../../contexts/LayoutContext';
import { Home, LayoutDashboard, Settings, Users, Bot, BarChart, Menu, GitBranch, Lightbulb } from 'lucide-react';
var navigation = [
    { name: 'Home', href: '/home', icon: Home },
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'AI Portal', href: '/ai-portal', icon: Bot },
    { name: 'Workflows', href: '/workflows', icon: GitBranch },
    { name: 'Suggestions', href: '/suggestions', icon: Lightbulb },
    { name: 'Analytics', href: '/analytics', icon: BarChart },
    { name: 'Team', href: '/team', icon: Users },
    { name: 'Settings', href: '/settings', icon: Settings },
];
export function Sidebar(_a) {
    var _b = _a.className, className = _b === void 0 ? '' : _b;
    var navigate = useNavigate();
    var location = useLocation();
    var _c = useLayout(), layout = _c.layout, toggleSidebar = _c.toggleSidebar;
    return (_jsxs("div", { className: "border-r bg-card flex flex-col ".concat(className), children: [_jsx("div", { className: "p-4 border-b", children: _jsx(Button, { variant: "ghost", size: "icon", onClick: toggleSidebar, className: "mb-2", children: _jsx(Menu, { className: "h-4 w-4" }) }) }), _jsx("nav", { className: "flex-1", children: _jsx("div", { className: "px-2 py-4 space-y-1", children: navigation.map(function (item) {
                        var isActive = location.pathname.startsWith(item.href);
                        return (_jsxs(Button, { variant: isActive ? "secondary" : "ghost", className: "w-full justify-start", onClick: function () { return navigate(item.href); }, children: [_jsx(item.icon, { className: "mr-2 h-4 w-4" }), layout.sidebarOpen && _jsx("span", { children: item.name })] }, item.name));
                    }) }) })] }));
}
