import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from 'react';
import { cn } from '../../utils';
/**
 * Layout component for creating a standard page layout with header, sidebar, and footer
 *
 * @example
 * // Basic usage
 * <Layout>
 *   <p>Content goes here</p>
 * </Layout>
 *
 * // With custom sidebar and header
 * <Layout
 *   sidebar={<CustomSidebar />}
 *   header={<CustomHeader />}
 * >
 *   <p>Content goes here</p>
 * </Layout>
 *
 * // With navigation
 * <Layout
 *   navigation={[
 *     { label: 'Home', href: '/' },
 *     { label: 'About', href: '/about' },
 *   ]}
 *   currentPath="/"
 *   onNavigate={(href) => navigate(href)}
 * >
 *   <p>Content goes here</p>
 * </Layout>
 */
const Layout = React.forwardRef(({ className, children, sidebar = true, header = true, footer = true, navigation = [], currentPath = '', user, onNavigate, onLogout, onProfile, onSettings, footerLinks = [], ...props }, ref) => {
    const [sidebarOpen, setSidebarOpen] = React.useState(false);
    // Default header component
    const defaultHeader = (_jsxs("header", { className: "bg-background border-b h-16 flex items-center justify-between px-4", children: [_jsxs("div", { className: "flex items-center", children: [_jsxs("button", { type: "button", className: "lg:hidden mr-2 p-2 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground", onClick: () => setSidebarOpen(!sidebarOpen), children: [_jsx("span", { className: "sr-only", children: "Open sidebar" }), _jsx("svg", { className: "h-6 w-6", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M4 6h16M4 12h16M4 18h16" }) })] }), _jsx("div", { className: "text-xl font-semibold", children: "The New Fuse" })] }), user && (_jsxs("div", { className: "flex items-center gap-4", children: [_jsxs("div", { className: "flex items-center gap-2", children: [user.avatar ? (_jsx("img", { src: user.avatar, alt: user.name || 'User', className: "h-8 w-8 rounded-full" })) : (_jsx("div", { className: "h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center", children: user.name?.charAt(0) || 'U' })), _jsxs("div", { className: "hidden md:block", children: [_jsx("div", { className: "text-sm font-medium", children: user.name }), _jsx("div", { className: "text-xs text-muted-foreground", children: user.email })] })] }), _jsx("div", { className: "relative", children: _jsxs("button", { type: "button", className: "p-2 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground", onClick: onSettings, children: [_jsx("span", { className: "sr-only", children: "Settings" }), _jsxs("svg", { className: "h-5 w-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg", children: [_jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" }), _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M15 12a3 3 0 11-6 0 3 3 0 016 0z" })] })] }) }), _jsxs("button", { type: "button", className: "p-2 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground", onClick: onLogout, children: [_jsx("span", { className: "sr-only", children: "Logout" }), _jsx("svg", { className: "h-5 w-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" }) })] })] }))] }));
    // Default sidebar component
    const defaultSidebar = (_jsxs("aside", { className: cn('fixed inset-y-0 left-0 z-40 w-64 bg-background border-r transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-auto lg:z-auto', sidebarOpen ? 'translate-x-0' : '-translate-x-full'), children: [_jsxs("div", { className: "h-16 flex items-center justify-between px-4 border-b", children: [_jsx("div", { className: "text-xl font-semibold", children: "The New Fuse" }), _jsxs("button", { type: "button", className: "lg:hidden p-2 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground", onClick: () => setSidebarOpen(false), children: [_jsx("span", { className: "sr-only", children: "Close sidebar" }), _jsx("svg", { className: "h-6 w-6", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M6 18L18 6M6 6l12 12" }) })] })] }), _jsx("nav", { className: "p-4 space-y-1", children: navigation.map((item) => (_jsxs("a", { href: item.href, className: cn('flex items-center px-4 py-2 text-sm font-medium rounded-md', currentPath === item.href
                        ? 'bg-primary text-primary-foreground'
                        : 'text-foreground hover:bg-accent hover:text-accent-foreground'), onClick: (e) => {
                        e.preventDefault();
                        onNavigate?.(item.href);
                        setSidebarOpen(false);
                    }, children: [item.icon && _jsx("span", { className: "mr-3", children: item.icon }), item.label] }, item.key || item.href))) })] }));
    // Default footer component
    const defaultFooter = (_jsx("footer", { className: "bg-background border-t py-4 px-4", children: _jsxs("div", { className: "flex flex-col md:flex-row justify-between items-center", children: [_jsxs("div", { className: "text-sm text-muted-foreground", children: ["\u00A9 ", new Date().getFullYear(), " The New Fuse. All rights reserved."] }), footerLinks.length > 0 && (_jsx("div", { className: "flex space-x-4 mt-4 md:mt-0", children: footerLinks.map((link) => (_jsx("a", { href: link.href, className: "text-sm text-muted-foreground hover:text-foreground", onClick: (e) => {
                            e.preventDefault();
                            onNavigate?.(link.href);
                        }, children: link.label }, link.href))) }))] }) }));
    return (_jsxs("div", { ref: ref, className: cn('min-h-screen bg-background flex flex-col', className), ...props, children: [header && (typeof header === 'boolean' ? defaultHeader : header), _jsxs("div", { className: "flex flex-1 overflow-hidden", children: [sidebar && (typeof sidebar === 'boolean' ? defaultSidebar : sidebar), _jsx("main", { className: "flex-1 overflow-auto", children: _jsx("div", { className: "container mx-auto py-6 px-4 sm:px-6 lg:px-8", children: children }) })] }), footer && (typeof footer === 'boolean' ? defaultFooter : footer), sidebarOpen && (_jsx("div", { className: "fixed inset-0 z-30 bg-black bg-opacity-50 lg:hidden", onClick: () => setSidebarOpen(false) }))] }));
});
Layout.displayName = 'Layout';
export { Layout };
