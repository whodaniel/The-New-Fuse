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
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Home, Monitor, Code, Settings, Users, BarChart3, MessageSquare, Zap, Globe, Chrome, ArrowRight, Play, Sparkles, Terminal, Layers, Database } from 'lucide-react';
var PageLink = function (_a) {
    var to = _a.to, title = _a.title, description = _a.description, Icon = _a.icon, status = _a.status, _b = _a.external, external = _b === void 0 ? false : _b;
    var statusColors = {
        live: 'bg-green-100 text-green-800',
        demo: 'bg-yellow-100 text-yellow-800',
        new: 'bg-blue-100 text-blue-800'
    };
    var content = (_jsx(Card, { className: "group hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-white to-gray-50 hover:from-gray-50 hover:to-white cursor-pointer", children: _jsxs(CardContent, { className: "p-6", children: [_jsxs("div", { className: "flex items-start justify-between mb-4", children: [_jsx("div", { className: "w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300", children: _jsx(Icon, { className: "h-6 w-6 text-white" }) }), _jsx(Badge, { className: "".concat(statusColors[status], " text-xs font-medium"), children: status })] }), _jsx("h3", { className: "text-lg font-semibold mb-2 text-gray-900 group-hover:text-blue-600 transition-colors", children: title }), _jsx("p", { className: "text-gray-600 text-sm leading-relaxed mb-4", children: description }), _jsxs("div", { className: "flex items-center text-blue-600 text-sm font-medium group-hover:text-blue-700 transition-colors", children: [_jsx("span", { children: "Open Page" }), _jsx(ArrowRight, { className: "ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" })] })] }) }));
    if (external) {
        return (_jsx("a", { href: to, target: "_blank", rel: "noopener noreferrer", className: "block", children: content }));
    }
    return (_jsx(Link, { to: to, className: "block", children: content }));
};
var FrontendShowcase = function () {
    var appPages = [
        {
            to: '/home',
            title: 'Home Dashboard',
            description: 'Main application home with navigation and overview',
            icon: Home,
            status: 'live'
        },
        {
            to: '/dashboard',
            title: 'Analytics Dashboard',
            description: 'User dashboard with analytics and metrics',
            icon: BarChart3,
            status: 'live'
        },
        {
            to: '/chat',
            title: 'Chat Interface',
            description: 'AI chat interface with multi-agent support',
            icon: MessageSquare,
            status: 'live'
        },
        {
            to: '/multi-agent-chat',
            title: 'Multi-Agent Chat',
            description: 'Advanced multi-agent conversation interface',
            icon: Users,
            status: 'live'
        },
        {
            to: '/ai-portal',
            title: 'AI Agent Portal',
            description: 'Browse and interact with AI agents',
            icon: Zap,
            status: 'live'
        },
        {
            to: '/admin/dashboard',
            title: 'Admin Dashboard',
            description: 'Administrative controls and system management',
            icon: Settings,
            status: 'live'
        }
    ];
    var demoPages = [
        {
            to: '/timeline-demo',
            title: 'Timeline Demo',
            description: 'Interactive timeline component demonstration',
            icon: Layers,
            status: 'demo'
        },
        {
            to: '/graph-demo',
            title: 'Graph Demo',
            description: 'Interactive graph visualization demo',
            icon: Database,
            status: 'demo'
        },
        {
            to: '/ui',
            title: 'UI Components',
            description: 'Component library and design system showcase',
            icon: Monitor,
            status: 'demo'
        },
        {
            to: '/components',
            title: 'Component Showcase',
            description: 'Detailed component examples and usage',
            icon: Code,
            status: 'demo'
        }
    ];
    var devPages = [
        {
            to: '/test',
            title: 'Test Page',
            description: 'Simple test page for routing verification',
            icon: Play,
            status: 'demo'
        },
        {
            to: '/debug',
            title: 'Debug Info',
            description: 'Development debug information and tools',
            icon: Terminal,
            status: 'demo'
        },
        {
            to: '/debug-routing',
            title: 'Route Debug',
            description: 'Routing debug and navigation testing',
            icon: Globe,
            status: 'demo'
        }
    ];
    var staticPages = [
        {
            to: 'http://localhost:3001/static/',
            title: 'HTML Showcase Index',
            description: 'Static HTML demonstration pages index',
            icon: Code,
            status: 'demo',
            external: true
        },
        {
            to: 'http://localhost:3001/static/pages/dashboard.html',
            title: 'Static Dashboard',
            description: 'Static HTML dashboard layout',
            icon: Monitor,
            status: 'demo',
            external: true
        },
        {
            to: 'http://localhost:3001/static/pages/chat.html',
            title: 'Static Chat',
            description: 'Static HTML chat interface',
            icon: MessageSquare,
            status: 'demo',
            external: true
        }
    ];
    return (_jsx("div", { className: "min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100", children: _jsxs("div", { className: "container mx-auto px-4 py-8", children: [_jsxs("div", { className: "text-center mb-12", children: [_jsx("div", { className: "inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl mb-6", children: _jsx(Sparkles, { className: "h-8 w-8 text-white" }) }), _jsx("h1", { className: "text-4xl font-bold text-gray-900 mb-4", children: "The New Fuse Frontend Showcase" }), _jsx("p", { className: "text-xl text-gray-600 max-w-2xl mx-auto", children: "Explore all the frontend pages and components built with React, TypeScript, and Tailwind CSS. Powered by PNPM package manager for efficient dependency management." })] }), _jsx("div", { className: "bg-white/80 backdrop-blur-sm border border-white/20 rounded-xl p-6 mb-8 shadow-lg", children: _jsxs("div", { className: "flex items-center justify-center space-x-6 text-sm text-gray-600", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("div", { className: "w-2 h-2 bg-green-500 rounded-full animate-pulse" }), _jsx("span", { children: "Server Running" })] }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(Terminal, { className: "h-4 w-4" }), _jsx("span", { children: "PNPM Package Manager" })] }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(Chrome, { className: "h-4 w-4" }), _jsx("span", { children: "localhost:3001" })] })] }) }), _jsxs("section", { className: "mb-12", children: [_jsxs("h2", { className: "text-2xl font-bold text-gray-900 mb-6 flex items-center", children: [_jsx(Home, { className: "mr-3 h-6 w-6 text-blue-600" }), "Main Application Pages"] }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", children: appPages.map(function (page, index) { return (_jsx(PageLink, __assign({}, page), index)); }) })] }), _jsxs("section", { className: "mb-12", children: [_jsxs("h2", { className: "text-2xl font-bold text-gray-900 mb-6 flex items-center", children: [_jsx(Play, { className: "mr-3 h-6 w-6 text-purple-600" }), "Interactive Demos"] }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", children: demoPages.map(function (page, index) { return (_jsx(PageLink, __assign({}, page), index)); }) })] }), _jsxs("section", { className: "mb-12", children: [_jsxs("h2", { className: "text-2xl font-bold text-gray-900 mb-6 flex items-center", children: [_jsx(Terminal, { className: "mr-3 h-6 w-6 text-green-600" }), "Development Tools"] }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", children: devPages.map(function (page, index) { return (_jsx(PageLink, __assign({}, page), index)); }) })] }), _jsxs("section", { className: "mb-12", children: [_jsxs("h2", { className: "text-2xl font-bold text-gray-900 mb-6 flex items-center", children: [_jsx(Code, { className: "mr-3 h-6 w-6 text-orange-600" }), "Static HTML Showcase"] }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", children: staticPages.map(function (page, index) { return (_jsx(PageLink, __assign({}, page), index)); }) })] }), _jsx("footer", { className: "text-center py-8 border-t border-gray-200", children: _jsx("p", { className: "text-gray-600", children: "Built with \u2764\uFE0F using React, TypeScript, Tailwind CSS, and PNPM Package Manager" }) })] }) }));
};
export default FrontendShowcase;
