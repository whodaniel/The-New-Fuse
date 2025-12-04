import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import { Suspense, lazy, useState, useEffect } from 'react';
import MainLayout from './components/layout/MainLayout';
import ProtectedRoute from './components/core/ProtectedRoute';
import PublicRoute from './components/core/PublicRoute';
import Loading from './components/Loading';
// Import directly loaded pages
import TestPage from './pages/Test';
import DebugPage from './pages/Debug';
import DebugRouting from './pages/DebugRouting';
// Lazy-loaded components
var Login = lazy(function () { return import('./pages/auth/Login'); });
var Register = lazy(function () { return import('./pages/auth/Register'); });
var ForgotPassword = lazy(function () { return import('./pages/auth/ForgotPassword'); });
var ResetPassword = lazy(function () { return import('./pages/auth/ResetPassword'); });
var SSO = lazy(function () { return import('./pages/auth/SSO'); });
var Dashboard = lazy(function () { return import('./pages/Dashboard'); });
var Home = lazy(function () { return import('./pages/Home'); });
var AIAgentPortal = lazy(function () { return import('./pages/AIAgentPortal/index'); });
var ModernHub = lazy(function () { return import('./pages/Hub/ModernHub'); });
var SophisticatedTNFHub = lazy(function () { return import('./pages/Hub/SophisticatedTNFHub'); });
// UI Component pages
var ComponentsNav = lazy(function () { return import('./pages/ComponentsNav'); });
var ComponentsShowcase = lazy(function () { return import('./pages/ComponentsShowcase'); });
var LayoutExample = lazy(function () { return import('./pages/LayoutExample'); });
var Chat = lazy(function () { return import('./pages/Chat'); });
var MultiAgentChat = lazy(function () { return import('./pages/MultiAgentChat'); });
// Feature pages
var TimelineDemo = lazy(function () { return import('./pages/TimelineDemo'); });
var GraphDemo = lazy(function () { return import('./pages/graph-demo'); });
var Analytics = lazy(function () { return import('./pages/Analytics'); });
// Workflow pages
var WorkflowRoutes = lazy(function () { return import('./routes/WorkflowRoutes'); });
// Admin pages
var AdminDashboard = lazy(function () { return import('./pages/Admin/Dashboard'); });
var Users = lazy(function () { return import('./pages/Admin/Users'); });
var Workspaces = lazy(function () { return import('./pages/Admin/Workspaces'); });
var SystemHealth = lazy(function () { return import('./pages/Admin/SystemHealth'); });
var AdminSettings = lazy(function () { return import('./pages/Admin/Settings'); });
var PortManagement = lazy(function () { return import('./pages/Admin/PortManagement'); });
// Settings pages
var General = lazy(function () { return import('./pages/settings/General'); });
var Appearance = lazy(function () { return import('./pages/settings/Appearance'); });
var API = lazy(function () { return import('./pages/settings/API'); });
var Security = lazy(function () { return import('./pages/settings/Security'); });
var Notifications = lazy(function () { return import('./pages/settings/Notifications'); });
var EmbeddingPreference = lazy(function () { return import('./pages/GeneralSettings/EmbeddingPreference'); });
// Workspace pages
var WorkspaceOverview = lazy(function () { return import('./pages/workspace/Overview'); });
var WorkspaceMembers = lazy(function () { return import('./pages/workspace/Members'); });
var WorkspaceAnalytics = lazy(function () { return import('./pages/workspace/Analytics'); });
var WorkspaceSettings = lazy(function () { return import('./pages/workspace/Settings'); });
// Legal pages
var PrivacyPolicy = lazy(function () { return import('./pages/legal/PrivacyPolicy'); });
var TermsOfService = lazy(function () { return import('./pages/legal/TermsOfService'); });
// Onboarding pages
var OnboardingFlow = lazy(function () { return import('./pages/OnboardingFlow'); });
// Simple error boundary component
function ErrorFallback(_a) {
    var error = _a.error;
    return (_jsxs("div", { className: "min-h-screen flex flex-col items-center justify-center p-4 bg-red-50", children: [_jsx("h1", { className: "text-2xl font-bold text-red-600 mb-4", children: "Something went wrong" }), _jsx("p", { className: "text-gray-800 mb-4", children: "We encountered an error while loading the application." }), _jsx("pre", { className: "bg-gray-100 p-4 rounded-md overflow-auto max-w-full", children: error.message }), _jsx("button", { type: "button", className: "mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors", onClick: function () { return window.location.href = '/'; }, children: "Go to Home Page" })] }));
}
export default function Router() {
    var location = useLocation();
    var _a = useState(null), error = _a[0], setError = _a[1];
    // Reset error when location changes
    useEffect(function () {
        setError(null);
    }, [location.pathname]);
    // If there's an error, show the error fallback
    if (error) {
        return _jsx(ErrorFallback, { error: error });
    }
    return (_jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(Suspense, { fallback: _jsx(Loading, {}), children: _jsx(Home, {}) }) }), _jsxs(Route, { element: _jsx(MainLayout, {}), children: [_jsx(Route, { path: "/test", element: _jsx(TestPage, {}) }), _jsx(Route, { path: "/debug", element: _jsx(DebugPage, {}) }), _jsx(Route, { path: "/debug-routing", element: _jsx(DebugRouting, {}) }), _jsx(Route, { path: "/home", element: _jsx(Suspense, { fallback: _jsx(Loading, {}), children: _jsx(Home, {}) }) }), _jsx(Route, { path: "/ui", element: _jsx(Suspense, { fallback: _jsx(Loading, {}), children: _jsx(ComponentsNav, {}) }) }), _jsx(Route, { path: "/components", element: _jsx(Suspense, { fallback: _jsx(Loading, {}), children: _jsx(ComponentsShowcase, {}) }) }), _jsx(Route, { path: "/layout-example", element: _jsx(Suspense, { fallback: _jsx(Loading, {}), children: _jsx(LayoutExample, {}) }) }), _jsx(Route, { path: "/chat", element: _jsx(Suspense, { fallback: _jsx(Loading, {}), children: _jsx(Chat, {}) }) }), _jsx(Route, { path: "/multi-agent-chat", element: _jsx(Suspense, { fallback: _jsx(Loading, {}), children: _jsx(MultiAgentChat, {}) }) }), _jsxs(Route, { path: "auth", element: _jsx(PublicRoute, {}), children: [_jsx(Route, { path: "login", element: _jsx(Suspense, { fallback: _jsx(Loading, {}), children: _jsx(Login, {}) }) }), _jsx(Route, { path: "register", element: _jsx(Suspense, { fallback: _jsx(Loading, {}), children: _jsx(Register, {}) }) }), _jsx(Route, { path: "forgot-password", element: _jsx(Suspense, { fallback: _jsx(Loading, {}), children: _jsx(ForgotPassword, {}) }) }), _jsx(Route, { path: "reset-password/:token", element: _jsx(Suspense, { fallback: _jsx(Loading, {}), children: _jsx(ResetPassword, {}) }) }), _jsx(Route, { path: "sso/:provider", element: _jsx(Suspense, { fallback: _jsx(Loading, {}), children: _jsx(SSO, {}) }) })] }), _jsxs(Route, { path: "legal", children: [_jsx(Route, { path: "privacy-policy", element: _jsx(Suspense, { fallback: _jsx(Loading, {}), children: _jsx(PrivacyPolicy, {}) }) }), _jsx(Route, { path: "terms-of-service", element: _jsx(Suspense, { fallback: _jsx(Loading, {}), children: _jsx(TermsOfService, {}) }) })] }), _jsx(Route, { path: "timeline-demo", element: _jsx(Suspense, { fallback: _jsx(Loading, {}), children: _jsx(TimelineDemo, {}) }) }), _jsx(Route, { path: "graph-demo", element: _jsx(Suspense, { fallback: _jsx(Loading, {}), children: _jsx(GraphDemo, {}) }) }), _jsx(Route, { path: "test", element: _jsx(TestPage, {}) }), _jsxs(Route, { element: _jsx(ProtectedRoute, {}), children: [_jsx(Route, { path: "hub", element: _jsx(Suspense, { fallback: _jsx(Loading, {}), children: _jsx(ModernHub, {}) }) }), _jsx(Route, { path: "sophisticated-hub", element: _jsx(Suspense, { fallback: _jsx(Loading, {}), children: _jsx(SophisticatedTNFHub, {}) }) }), _jsx(Route, { path: "dashboard", element: _jsx(Suspense, { fallback: _jsx(Loading, {}), children: _jsx(Dashboard, {}) }) }), _jsx(Route, { path: "analytics", element: _jsx(Suspense, { fallback: _jsx(Loading, {}), children: _jsx(Analytics, {}) }) }), _jsx(Route, { path: "ai-portal", element: _jsx(Suspense, { fallback: _jsx(Loading, {}), children: _jsx(AIAgentPortal, {}) }) }), _jsx(Route, { path: "onboarding", element: _jsx(Suspense, { fallback: _jsx(Loading, {}), children: _jsx(OnboardingFlow, {}) }) }), _jsx(Route, { path: "workflows/*", element: _jsx(Suspense, { fallback: _jsx(Loading, {}), children: _jsx(WorkflowRoutes, {}) }) }), _jsxs(Route, { path: "admin", children: [_jsx(Route, { index: true, element: _jsx(Navigate, { to: "dashboard", replace: true }) }), _jsx(Route, { path: "dashboard", element: _jsx(Suspense, { fallback: _jsx(Loading, {}), children: _jsx(AdminDashboard, {}) }) }), _jsx(Route, { path: "users", element: _jsx(Suspense, { fallback: _jsx(Loading, {}), children: _jsx(Users, {}) }) }), _jsx(Route, { path: "workspaces", element: _jsx(Suspense, { fallback: _jsx(Loading, {}), children: _jsx(Workspaces, {}) }) }), _jsx(Route, { path: "system-health", element: _jsx(Suspense, { fallback: _jsx(Loading, {}), children: _jsx(SystemHealth, {}) }) }), _jsx(Route, { path: "settings", element: _jsx(Suspense, { fallback: _jsx(Loading, {}), children: _jsx(AdminSettings, {}) }) }), _jsx(Route, { path: "ports", element: _jsx(Suspense, { fallback: _jsx(Loading, {}), children: _jsx(PortManagement, {}) }) })] }), _jsxs(Route, { path: "settings", children: [_jsx(Route, { index: true, element: _jsx(Navigate, { to: "general", replace: true }) }), _jsx(Route, { path: "general", element: _jsx(Suspense, { fallback: _jsx(Loading, {}), children: _jsx(General, {}) }) }), _jsx(Route, { path: "appearance", element: _jsx(Suspense, { fallback: _jsx(Loading, {}), children: _jsx(Appearance, {}) }) }), _jsx(Route, { path: "api", element: _jsx(Suspense, { fallback: _jsx(Loading, {}), children: _jsx(API, {}) }) }), _jsx(Route, { path: "security", element: _jsx(Suspense, { fallback: _jsx(Loading, {}), children: _jsx(Security, {}) }) }), _jsx(Route, { path: "notifications", element: _jsx(Suspense, { fallback: _jsx(Loading, {}), children: _jsx(Notifications, {}) }) }), _jsx(Route, { path: "embedding", element: _jsx(Suspense, { fallback: _jsx(Loading, {}), children: _jsx(EmbeddingPreference, {}) }) })] }), _jsxs(Route, { path: "workspace/:workspaceId", children: [_jsx(Route, { index: true, element: _jsx(Navigate, { to: "overview", replace: true }) }), _jsx(Route, { path: "overview", element: _jsx(Suspense, { fallback: _jsx(Loading, {}), children: _jsx(WorkspaceOverview, {}) }) }), _jsx(Route, { path: "members", element: _jsx(Suspense, { fallback: _jsx(Loading, {}), children: _jsx(WorkspaceMembers, {}) }) }), _jsx(Route, { path: "analytics", element: _jsx(Suspense, { fallback: _jsx(Loading, {}), children: _jsx(WorkspaceAnalytics, {}) }) }), _jsx(Route, { path: "settings", element: _jsx(Suspense, { fallback: _jsx(Loading, {}), children: _jsx(WorkspaceSettings, {}) }) })] })] }), _jsx(Route, { path: "*", element: _jsxs("div", { className: "min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50", children: [_jsx("h1", { className: "text-3xl font-bold mb-4 text-gray-800", children: "Page Not Found" }), _jsx("p", { className: "text-gray-600 mb-8", children: "The page you're looking for doesn't exist or has been moved." }), _jsxs("div", { className: "flex gap-4", children: [_jsx(Link, { to: "/", className: "px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors", children: "Go Home" }), _jsx(Link, { to: "/debug", className: "px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors", children: "Debug Info" })] })] }) })] })] }));
}
