import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RootLayout = RootLayout;
import react_router_dom_1 from 'react-router-dom';
import theme_toggle_1 from '../common/theme-toggle';
import scroll_area_1 from '../ui/scroll-area';
import nav_menu_1 from './nav-menu';
import route_context_1 from '../../contexts/route-context';
function RootLayout() {
    var pageTitle = (0, route_context_1.useRoute)().pageTitle;
    return (_jsxs("div", { className: "flex h-screen bg-white dark:bg-neutral-950", children: [_jsxs("aside", { className: "w-64 border-r border-neutral-200 dark:border-neutral-800", children: [_jsxs("div", { className: "flex h-16 items-center justify-between px-4 border-b border-neutral-200 dark:border-neutral-800", children: [_jsx("h2", { className: "text-lg font-semibold text-neutral-900 dark:text-neutral-50", children: "Agent Factory" }), _jsx(theme_toggle_1.ThemeToggle, {})] }), _jsx(scroll_area_1.ScrollArea, { className: "h-[calc(100vh-4rem)]", children: _jsx("div", { className: "p-4", children: _jsx(nav_menu_1.NavMenu, {}) }) })] }), _jsxs("main", { className: "flex-1 flex flex-col", children: [_jsx("div", { className: "h-16 border-b border-neutral-200 dark:border-neutral-800 px-8 flex items-center", children: _jsx("h1", { className: "text-lg font-semibold text-neutral-900 dark:text-neutral-50", children: pageTitle }) }), _jsx("div", { className: "flex-1 overflow-auto p-8", children: _jsx(react_router_dom_1.Outlet, {}) })] })] }));
}
