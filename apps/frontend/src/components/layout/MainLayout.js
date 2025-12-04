import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Outlet } from 'react-router-dom';
import { useLayout } from '../../contexts/LayoutContext';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Footer } from './Footer';
export default function MainLayout() {
    var layout = useLayout().layout;
    return (_jsxs("div", { className: "min-h-screen bg-background", children: [_jsx(Header, {}), _jsxs("div", { className: "flex h-[calc(100vh-4rem)]", children: [_jsx(Sidebar, { className: layout.sidebarOpen ? 'w-64' : 'w-16' }), _jsx("main", { className: "flex-1 overflow-auto p-6", children: _jsx(Outlet, {}) })] }), _jsx(Footer, {})] }));
}
