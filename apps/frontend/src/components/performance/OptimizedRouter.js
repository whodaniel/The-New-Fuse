var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Lazy, AdvancedLoadingFallback, preloadCriticalComponent } from '../components/performance/AdvancedLazy';
import { usePerformanceMonitor } from '../utils/performanceMonitor';
// Core components (keep loaded for immediate use)
import LoginPage from '../pages/auth/Login';
import RegisterPage from '../pages/auth/Register';
// Preload critical components
var preloadComponents = function () {
    // Preload most used pages
    preloadCriticalComponent(function () { return import('../pages/dashboard/index'); });
    preloadCriticalComponent(function () { return import('../pages/Home'); });
    preloadCriticalComponent(function () { return import('../components/MultiAgentChat'); });
};
// Route-based code splitting with performance tracking
var PerformanceTrackedRoute = function (_a) {
    var Component = _a.component, routeName = _a.routeName, props = __rest(_a, ["component", "routeName"]);
    usePerformanceMonitor("Route: ".concat(routeName));
    return (_jsx(Lazy, { importFunc: function () { return Promise.resolve({ default: Component }); }, fallbackName: routeName, showProgress: true }));
};
// Lazy loaded pages organized by category
var CorePages = {
    // Authentication (critical for first load)
    auth: {
        ForgotPassword: lazy(function () { return import('../pages/auth/ForgotPassword'); }),
        ResetPassword: lazy(function () { return import('../pages/auth/ResetPassword'); }),
        SSOPage: lazy(function () { return import('../pages/auth/SSO'); }),
        GoogleCallback: lazy(function () { return import('../pages/auth/GoogleCallback'); }),
        OAuthCallback: lazy(function () { return import('../pages/auth/OAuthCallback'); }),
    },
    // Dashboard and main features
    dashboard: {
        Analytics: lazy(function () { return import('../pages/dashboard/Analytics'); }),
        AgentDashboard: lazy(function () { return import('../pages/dashboard/AgentDashboard'); }),
        CreateAgent: lazy(function () { return import('../pages/dashboard/CreateAgent'); }),
        DashboardSettings: lazy(function () { return import('../pages/dashboard/DashboardSettings'); }),
    },
    // Agent management
    agents: {
        AgentsPage: lazy(function () { return import('../pages/Agents/AgentsPage'); }),
        AgentDetail: lazy(function () { return import('../pages/Agents/Detail'); }),
        UnifiedAgentCreator: lazy(function () { return import('../pages/Agents/UnifiedAgentCreator'); }),
        NFTMarketplacePage: lazy(function () { return import('../pages/Agents/NFTMarketplacePage'); }),
        RevenueDashboardPage: lazy(function () { return import('../pages/Agents/RevenueDashboardPage'); }),
    },
    // Workflow and automation
    workflows: {
        Workflows: lazy(function () { return import('../pages/Workflows'); }),
        WorkflowBuilder: lazy(function () { return import('../pages/Workflows/Builder'); }),
        WorkflowDetail: lazy(function () { return import('../pages/Workflows/Detail'); }),
        WorkflowExecution: lazy(function () { return import('../pages/Workflows/Execution'); }),
        WorkflowTemplates: lazy(function () { return import('../pages/Workflows/Templates'); }),
    },
    // Admin and management
    admin: {
        AdminPanel: lazy(function () { return import('../pages/Admin/AdminPanel'); }),
        UserManagement: lazy(function () { return import('../pages/Admin/UserManagement'); }),
        SystemHealth: lazy(function () { return import('../pages/Admin/SystemHealth'); }),
        FeatureFlags: lazy(function () { return import('../pages/Admin/FeatureFlags'); }),
        PortManagement: lazy(function () { return import('../pages/Admin/PortManagement'); }),
        Onboarding: lazy(function () { return import('../pages/Admin/Onboarding'); }),
        Dashboard: lazy(function () { return import('../pages/Admin/Dashboard'); }),
        ExperimentalFeatures: lazy(function () { return import('../pages/Admin/ExperimentalFeatures/features'); }),
        Settings: lazy(function () { return import('../pages/Admin/AdminSettings'); }),
        WorkspaceManagement: lazy(function () { return import('../pages/Admin/WorkspaceManagement'); }),
    },
    // Settings and configuration
    settings: {
        Settings: lazy(function () { return import('../pages/Settings'); }),
        GeneralSettings: lazy(function () { return import('../pages/GeneralSettings'); }),
        Appearance: lazy(function () { return import('../pages/settings/Appearance'); }),
        Notifications: lazy(function () { return import('../pages/settings/Notifications'); }),
        Security: lazy(function () { return import('../pages/settings/Security'); }),
        API: lazy(function () { return import('../pages/settings/API'); }),
        EmbeddingPreference: lazy(function () { return import('../pages/GeneralSettings/EmbeddingPreference'); }),
    },
    // Chat and communication
    chat: {
        ChatPage: lazy(function () { return import('../pages/chat/ChatPage'); }),
        WorkspaceChat: lazy(function () { return import('../pages/WorkspaceChat'); }),
    },
    // Workspace management
    workspace: {
        Overview: lazy(function () { return import('../pages/workspace/Overview'); }),
        Analytics: lazy(function () { return import('../pages/workspace/WorkspaceAnalytics'); }),
        Members: lazy(function () { return import('../pages/workspace/Members'); }),
        Settings: lazy(function () { return import('../pages/workspace/Settings'); }),
        Layout: lazy(function () { return import('../pages/workspace/WorkspaceLayout'); }),
    },
    // Tasks and projects
    tasks: {
        TasksPage: lazy(function () { return import('../pages/Tasks/TasksPage'); }),
        TaskDetail: lazy(function () { return import('../pages/Tasks/Detail'); }),
        TaskEdit: lazy(function () { return import('../pages/Tasks/Edit'); }),
        NewTask: lazy(function () { return import('../pages/Tasks/New'); }),
    },
    // Suggestions and feedback
    suggestions: {
        Suggestions: lazy(function () { return import('../pages/Suggestions'); }),
        NewSuggestion: lazy(function () { return import('../pages/Suggestions/New'); }),
        SuggestionDetail: lazy(function () { return import('../pages/Suggestions/Detail'); }),
    },
    // Landing and onboarding
    landing: {
        Landing: lazy(function () { return import('../pages/Landing'); }),
        OnboardingFlow: lazy(function () { return import('../pages/OnboardingFlow'); }),
        Preview: lazy(function () { return import('../pages/preview/OnboardingPreview'); }),
    },
    // UI and components
    ui: {
        ComponentsShowcase: lazy(function () { return import('../pages/ComponentsShowcase'); }),
        ComponentsNav: lazy(function () { return import('../pages/ComponentsNav'); }),
        FrontendShowcase: lazy(function () { return import('../pages/FrontendShowcase'); }),
        LayoutExamples: lazy(function () { return import('../pages/Layout/LayoutExamples'); }),
        TimelineDemo: lazy(function () { return import('../pages/TimelineDemo'); }),
    },
    // Specialized features
    specialized: {
        AIAgentPortal: lazy(function () { return import('../pages/AIAgentPortal'); }),
        SophisticatedTNFHub: lazy(function () { return import('../pages/Hub/SophisticatedTNFHub'); }),
        MultiAgentChat: lazy(function () { return import('../components/MultiAgentChat'); }),
        CommunityHub: lazy(function () { return import('../pages/Community/CommunityHub'); }),
        WorkflowTemplates: lazy(function () { return import('../pages/WorkflowTemplates'); }),
    },
    // System and debug
    system: {
        Debug: lazy(function () { return import('../pages/Debug'); }),
        DebugRouting: lazy(function () { return import('../pages/DebugRouting'); }),
        BuildInfo: lazy(function () { return import('../pages/BuildInfo'); }),
        Test: lazy(function () { return import('../pages/Test'); }),
        SimpleTest: lazy(function () { return import('../pages/SimpleTest'); }),
        AllPages: lazy(function () { return import('../pages/AllPages'); }),
        NotFound: lazy(function () { return import('../pages/NotFound'); }),
        Unauthorized: lazy(function () { return import('../pages/Unauthorized'); }),
    },
    // Legal
    legal: {
        PrivacyPolicy: lazy(function () { return import('../pages/legal/PrivacyPolicy'); }),
        TermsOfService: lazy(function () { return import('../pages/legal/TermsOfService'); }),
    },
};
// Route groups for better organization
var RouteGroups = {
    // Core routes - load immediately
    core: [
        { path: '/', name: 'Home', component: lazy(function () { return import('../pages/Home'); }) },
        { path: '/home', name: 'Home', component: lazy(function () { return import('../pages/Home'); }) },
        { path: '/dashboard', name: 'Dashboard', component: lazy(function () { return import('../pages/dashboard/index'); }) },
    ],
    // Authentication routes
    auth: [
        { path: '/login', component: LoginPage },
        { path: '/register', component: RegisterPage },
        { path: '/auth', component: CorePages.landing.Landing },
        { path: '/auth/login', component: LoginPage },
        { path: '/auth/register', component: RegisterPage },
    ],
    // User routes
    user: [
        { path: '/multi-agent-chat', component: CorePages.specialized.MultiAgentChat },
        { path: '/chat', component: CorePages.chat.ChatPage },
        { path: '/chat-page', component: CorePages.chat.ChatPage },
        { path: '/workspace-chat', component: CorePages.chat.WorkspaceChat },
    ],
    // Admin routes
    admin: [
        { path: '/admin', component: CorePages.admin.AdminPanel },
        { path: '/admin/users', component: CorePages.admin.UserManagement },
        { path: '/admin/system-health', component: CorePages.admin.SystemHealth },
        { path: '/admin/feature-flags', component: CorePages.admin.FeatureFlags },
        { path: '/admin/port-management', component: CorePages.admin.PortManagement },
        { path: '/admin/onboarding', component: CorePages.admin.Onboarding },
        { path: '/admin/dashboard', component: CorePages.admin.Dashboard },
        { path: '/admin/experimental-features', component: CorePages.admin.ExperimentalFeatures },
        { path: '/admin/settings', component: CorePages.admin.Settings },
        { path: '/admin/workspaces', component: CorePages.admin.WorkspaceManagement },
    ],
    // Feature routes
    features: [
        { path: '/agents', component: CorePages.agents.AgentsPage },
        { path: '/agents/new', component: CorePages.agents.UnifiedAgentCreator },
        { path: '/agents/:id', component: CorePages.agents.AgentDetail },
        { path: '/agents/nft-marketplace', component: CorePages.agents.NFTMarketplacePage },
        { path: '/agents/revenue-dashboard', component: CorePages.agents.RevenueDashboardPage },
        { path: '/workflows', component: CorePages.workflows.Workflows },
        { path: '/workflows/builder', component: CorePages.workflows.WorkflowBuilder },
        { path: '/workflows/:id', component: CorePages.workflows.WorkflowDetail },
        { path: '/workflows/:id/execution', component: CorePages.workflows.WorkflowExecution },
        { path: '/workflows/templates', component: CorePages.workflows.WorkflowTemplates },
        { path: '/tasks', component: CorePages.tasks.TasksPage },
        { path: '/tasks/new', component: CorePages.tasks.NewTask },
        { path: '/tasks/:id', component: CorePages.tasks.TaskDetail },
        { path: '/tasks/:id/edit', component: CorePages.tasks.TaskEdit },
        { path: '/suggestions', component: CorePages.suggestions.Suggestions },
        { path: '/suggestions/new', component: CorePages.suggestions.NewSuggestion },
        { path: '/suggestions/:id', component: CorePages.suggestions.SuggestionDetail },
    ],
    // Workspace routes
    workspace: [
        { path: '/workspace/overview', component: CorePages.workspace.Overview },
        { path: '/workspace/analytics', component: CorePages.workspace.Analytics },
        { path: '/workspace/members', component: CorePages.workspace.Members },
        { path: '/workspace/settings', component: CorePages.workspace.Settings },
        { path: '/workspace/layout', component: CorePages.workspace.Layout },
    ],
    // Settings routes
    settings: [
        { path: '/settings', component: CorePages.settings.Settings },
        { path: '/settings/general', component: CorePages.settings.GeneralSettings },
        { path: '/settings/appearance', component: CorePages.settings.Appearance },
        { path: '/settings/notifications', component: CorePages.settings.Notifications },
        { path: '/settings/security', component: CorePages.settings.Security },
        { path: '/settings/api', component: CorePages.settings.API },
        { path: '/general-settings', component: CorePages.settings.GeneralSettings },
        { path: '/general-settings/embedding', component: CorePages.settings.EmbeddingPreference },
    ],
    // Specialized routes
    specialized: [
        { path: '/ai-portal', component: CorePages.specialized.AIAgentPortal },
        { path: '/ai-agents', component: CorePages.specialized.AIAgentPortal },
        { path: '/agent-builder', component: CorePages.agents.UnifiedAgentCreator },
        { path: '/agent-management', component: CorePages.agents.AgentsPage },
        { path: '/sophisticated-hub', component: CorePages.specialized.SophisticatedTNFHub },
        { path: '/workflows-enhanced', component: CorePages.workflows.Workflows },
        { path: '/community-hub', component: CorePages.specialized.CommunityHub },
    ],
    // UI and demo routes
    ui: [
        { path: '/components', component: CorePages.ui.ComponentsShowcase },
        { path: '/components-showcase', component: CorePages.ui.ComponentsShowcase },
        { path: '/components-nav', component: CorePages.ui.ComponentsNav },
        { path: '/frontend-showcase', component: CorePages.ui.FrontendShowcase },
        { path: '/layout-example', component: CorePages.ui.LayoutExamples },
        { path: '/timeline-demo', component: CorePages.ui.TimelineDemo },
    ],
    // System routes
    system: [
        { path: '/debug', component: CorePages.system.Debug },
        { path: '/debug-routing', component: CorePages.system.DebugRouting },
        { path: '/build-info', component: CorePages.system.BuildInfo },
        { path: '/test', component: CorePages.system.Test },
        { path: '/simple-test', component: CorePages.system.SimpleTest },
        { path: '/all-pages', component: CorePages.system.AllPages },
        { path: '/unauthorized', component: CorePages.system.Unauthorized },
        { path: '/404', component: CorePages.system.NotFound },
    ],
    // Landing and onboarding routes
    landing: [
        { path: '/landing', component: CorePages.landing.Landing },
        { path: '/onboarding', component: CorePages.landing.OnboardingFlow },
        { path: '/preview/onboarding', component: CorePages.landing.Preview },
    ],
};
// Main optimized router component
var OptimizedRouter = function () {
    React.useEffect(function () {
        // Preload critical components after initial load
        var timer = setTimeout(preloadComponents, 1000);
        return function () { return clearTimeout(timer); };
    }, []);
    return (_jsxs("div", { children: [_jsx(SmartNavigation, {}), _jsx(Suspense, { fallback: _jsx(AdvancedLoadingFallback, { name: "Page", showProgress: true }), children: _jsxs(Routes, { children: [RouteGroups.core.map(function (_a) {
                            var path = _a.path, Component = _a.component, name = _a.name;
                            return (_jsx(Route, { path: path, element: _jsx(PerformanceTrackedRoute, { component: Component, routeName: name || path }) }, path));
                        }), __spreadArray(__spreadArray(__spreadArray([], RouteGroups.auth, true), RouteGroups.user, true), RouteGroups.features, true).map(function (_a) {
                            var path = _a.path, Component = _a.component;
                            return (_jsx(Route, { path: path, element: _jsx(Lazy, { importFunc: function () { return Promise.resolve({ default: Component }); }, fallbackName: path, showProgress: false }) }, path));
                        }), RouteGroups.admin.map(function (_a) {
                            var path = _a.path, Component = _a.component;
                            return (_jsx(Route, { path: path, element: _jsx(Lazy, { importFunc: function () { return Promise.resolve({ default: Component }); }, fallbackName: "Admin: ".concat(path), showProgress: true }) }, path));
                        }), RouteGroups.workspace.map(function (_a) {
                            var path = _a.path, Component = _a.component;
                            return (_jsx(Route, { path: path, element: _jsx(Lazy, { importFunc: function () { return Promise.resolve({ default: Component }); }, fallbackName: "Workspace: ".concat(path), showProgress: false }) }, path));
                        }), RouteGroups.settings.map(function (_a) {
                            var path = _a.path, Component = _a.component;
                            return (_jsx(Route, { path: path, element: _jsx(Lazy, { importFunc: function () { return Promise.resolve({ default: Component }); }, fallbackName: "Settings: ".concat(path), showProgress: false }) }, path));
                        }), RouteGroups.specialized.map(function (_a) {
                            var path = _a.path, Component = _a.component;
                            return (_jsx(Route, { path: path, element: _jsx(Lazy, { importFunc: function () { return Promise.resolve({ default: Component }); }, fallbackName: path, showProgress: true }) }, path));
                        }), RouteGroups.ui.map(function (_a) {
                            var path = _a.path, Component = _a.component;
                            return (_jsx(Route, { path: path, element: _jsx(Lazy, { importFunc: function () { return Promise.resolve({ default: Component }); }, fallbackName: path, showProgress: false }) }, path));
                        }), RouteGroups.system.map(function (_a) {
                            var path = _a.path, Component = _a.component;
                            return (_jsx(Route, { path: path, element: _jsx(Lazy, { importFunc: function () { return Promise.resolve({ default: Component }); }, fallbackName: "System: ".concat(path), showProgress: false }) }, path));
                        }), RouteGroups.landing.map(function (_a) {
                            var path = _a.path, Component = _a.component;
                            return (_jsx(Route, { path: path, element: _jsx(Lazy, { importFunc: function () { return Promise.resolve({ default: Component }); }, fallbackName: "Landing: ".concat(path), showProgress: false }) }, path));
                        }), _jsx(Route, { path: "*", element: _jsxs("div", { className: "p-8 text-center", children: [_jsx("h1", { className: "text-3xl font-bold text-red-600 mb-4", children: "404 - Page Not Found" }), _jsx("p", { className: "text-gray-600 mb-4", children: "The page you are looking for does not exist." }), _jsx("button", { onClick: function () { return window.location.href = '/'; }, className: "bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors", children: "Go Home" })] }) })] }) })] }));
};
// Import SmartNavigation component (assuming it exists in components)
import SmartNavigation from './SmartNavigation';
export default OptimizedRouter;
export { CorePages, RouteGroups };
