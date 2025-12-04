import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Suspense, lazy } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
// Core components (keep loaded)
import LoginPage from './pages/auth/Login';
import RegisterPage from './pages/auth/Register';
// Lazy load heavy components for better performance
var MultiAgentChat = lazy(function () { return import('./components/MultiAgentChat'); });
var WorkspaceAnalytics = lazy(function () { return import('./pages/workspace/WorkspaceAnalytics'); });
var WorkspaceSettings = lazy(function () { return import('./pages/workspace/Settings'); });
var ComponentsShowcase = lazy(function () { return import('./pages/ComponentsShowcase'); });
var TimelineDemo = lazy(function () { return import('./pages/timeline-demo'); });
var GraphDemo = lazy(function () { return import('./pages/graph-demo').then(function (module) { return ({ default: module.GraphDemo }); }); });
var AdminPanel = lazy(function () { return import('./pages/Admin/AdminPanel'); });
var TasksPage = lazy(function () { return import('./pages/Tasks/TasksPage'); });
var AgentsPage = lazy(function () { return import('./pages/Agents/AgentsPage'); });
var AgentDetail = lazy(function () { return import('./pages/Agents/Detail'); });
var Workflows = lazy(function () { return import('./pages/Workflows'); });
var WorkflowBuilder = lazy(function () { return import('./pages/Workflows/Builder'); });
var WorkflowEditorWrapper = lazy(function () { return import('./components/WorkflowEditor'); });
var Analytics = lazy(function () { return import('./pages/dashboard/Analytics'); });
var Dashboard = lazy(function () { return import('./pages/dashboard/index'); });
var Settings = lazy(function () { return import('./pages/Settings'); });
var SettingsAppearance = lazy(function () { return import('./pages/settings/Appearance'); });
var SettingsNotifications = lazy(function () { return import('./pages/settings/Notifications'); });
var SettingsSecurity = lazy(function () { return import('./pages/settings/Security'); });
var SettingsAPI = lazy(function () { return import('./pages/settings/API'); });
var WorkspaceOverview = lazy(function () { return import('./pages/workspace/Overview'); });
var WorkspaceMembers = lazy(function () { return import('./pages/workspace/Members'); });
var WorkspaceChatPage = lazy(function () { return import('./pages/WorkspaceChat'); });
var NFTMarketplacePage = lazy(function () { return import('./pages/Agents/NFTMarketplacePage'); });
var RevenueDashboardPage = lazy(function () { return import('./pages/Agents/RevenueDashboardPage'); });
var UnifiedAgentCreator = lazy(function () { return import('./pages/Agents/UnifiedAgentCreator'); });
var SophisticatedTNFHub = lazy(function () { return import('./pages/Hub/SophisticatedTNFHub'); });
// Resources pages
var ResourcesDashboard = lazy(function () { return import('./pages/Resources/ResourcesDashboard'); });
// Performance loading component
var LoadingFallback = function (_a) {
    var name = _a.name;
    return (_jsx("div", { className: "flex items-center justify-center min-h-[400px]", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" }), _jsxs("p", { className: "text-gray-600", children: ["Loading ", name, "..."] })] }) }));
};
// Additional real components
import TestPage from './pages/Test';
import DebugPageComponent from './pages/Debug';
import DebugRoutingComponent from './pages/DebugRouting';
import AllPages from './pages/AllPages';
import BuildInfoPage from './pages/BuildInfo';
// Suggestions components
var SuggestionsPage = lazy(function () { return import('./pages/Suggestions'); });
var NewSuggestionPage = lazy(function () { return import('./pages/Suggestions/New'); });
var SuggestionDetailPage = lazy(function () { return import('./pages/Suggestions/Detail'); });
// Additional Admin components
var AdminUserManagement = lazy(function () { return import('./pages/Admin/UserManagement'); });
var AdminSystemHealth = lazy(function () { return import('./pages/Admin/SystemHealth'); });
var AdminFeatureFlags = lazy(function () { return import('./pages/Admin/FeatureFlags'); });
var AdminPortManagement = lazy(function () { return import('./pages/Admin/PortManagement'); });
// Auth components
var AuthIndexPage = lazy(function () { return import('./pages/auth'); });
var ForgotPasswordPage = lazy(function () { return import('./pages/auth/ForgotPassword'); });
var ResetPasswordPage = lazy(function () { return import('./pages/auth/ResetPassword'); });
var SSOPage = lazy(function () { return import('./pages/auth/SSO'); });
var GoogleCallbackPage = lazy(function () { return import('./pages/auth/GoogleCallback'); });
var OAuthCallbackPage = lazy(function () { return import('./pages/auth/OAuthCallback'); });
// Landing components
var LandingIndexPage = lazy(function () { return import('./pages/Landing'); });
var OnboardingFlowPage = lazy(function () { return import('./pages/OnboardingFlow'); });
// Workspace components
var WorkspaceOverviewPage = lazy(function () { return import('./pages/workspace/Overview'); });
var WorkspaceMembersPage = lazy(function () { return import('./pages/workspace/Members'); });
// Task components  
var TaskDetailPage = lazy(function () { return import('./pages/Tasks/Detail'); });
var TaskEditPage = lazy(function () { return import('./pages/Tasks/Edit'); });
var NewTaskPage = lazy(function () { return import('./pages/Tasks/New'); });
// Additional pages
var UnauthorizedPage = lazy(function () { return import('./pages/Unauthorized'); });
var AIAgentPortalPage = lazy(function () { return import('./pages/AIAgentPortal'); });
var FrontendShowcasePage = lazy(function () { return import('./pages/FrontendShowcase'); });
var SimpleTestPage = lazy(function () { return import('./pages/SimpleTest'); });
// Chat pages
var ChatPage = lazy(function () { return import('./pages/chat/ChatPage'); });
// Admin pages that exist
var AdminOnboardingPage = lazy(function () { return import('./pages/Admin/Onboarding'); });
var AdminDashboardPage = lazy(function () { return import('./pages/Admin/Dashboard'); });
var ExperimentalFeaturesPage = lazy(function () { return import('./pages/Admin/ExperimentalFeatures/features'); });
// Legal pages
var PrivacyPolicyPage = lazy(function () { return import('./pages/legal/PrivacyPolicy'); });
var TermsOfServicePage = lazy(function () { return import('./pages/legal/TermsOfService'); });
// Workspace pages
var WorkspaceLayoutPage = lazy(function () { return import('./pages/workspace/WorkspaceLayout'); });
var WorkspaceIndexPage = lazy(function () { return import('./pages/workspace'); });
// Additional component pages
var ComponentsNavPage = lazy(function () { return import('./pages/ComponentsNav'); });
var HomePage = lazy(function () { return import('./pages/Home'); });
var LandingPageAlt = lazy(function () { return import('./pages/LandingPage'); });
var SimpleLandingPage = lazy(function () { return import('./pages/SimpleLanding'); });
// Enhanced workflow pages
var WorkflowsEnhancedPage = lazy(function () { return import('./pages/WorkflowsEnhanced'); });
var WorkflowDetailPage = lazy(function () { return import('./pages/Workflows/Detail'); });
var WorkflowExecutionPage = lazy(function () { return import('./pages/Workflows/Execution'); });
var WorkflowTemplatesPage = lazy(function () { return import('./pages/Workflows/Templates'); });
// Preview pages
var OnboardingPreviewPage = lazy(function () { return import('./pages/preview/OnboardingPreview'); });
// Remaining specialized settings routes
var WorkspaceLLMSelectionPage = lazy(function () { return import('./pages/WorkspaceSettings/ChatSettings/WorkspaceLLMSelection'); });
var AgentModelSelectionPage = lazy(function () { return import('./pages/WorkspaceSettings/AgentConfig/AgentModelSelection'); });
// Admin tools routes
var AdminAgentSkillsPage = lazy(function () { return import('./pages/Admin/Agents/skills'); });
// Web Search Selection component
var WebSearchSelection = lazy(function () { return import('./pages/Admin/Agents/WebSearchSelection'); });
// Additional missing routes from audit
var TasksPageComponent = lazy(function () { return import('./pages/Tasks/TasksPage'); });
var GeneralSettingsPage = lazy(function () { return import('./pages/GeneralSettings'); });
var GeneralSettingsEmbeddingPage = lazy(function () { return import('./pages/GeneralSettings/EmbeddingPreference'); });
var WorkflowTemplates = lazy(function () { return import('./pages/WorkflowTemplates'); });
var GeneralSettings = lazy(function () { return import('./pages/GeneralSettings'); });
var AdminSettings = lazy(function () { return import('./pages/Admin/AdminSettings'); });
var WorkspaceManagement = lazy(function () { return import('./pages/Admin/WorkspaceManagement'); });
var AgentDashboard = lazy(function () { return import('./pages/dashboard/AgentDashboard'); });
var CreateAgent = lazy(function () { return import('./pages/dashboard/CreateAgent'); });
var DashboardSettings = lazy(function () { return import('./pages/dashboard/DashboardSettings'); });
var CommunityHub = lazy(function () { return import('./pages/Community/CommunityHub'); });
var LayoutExamples = lazy(function () { return import('./pages/Layout/LayoutExamples'); });
var AIAgentPortal = lazy(function () { return import('./pages/AIAgentPortal'); });
var NotFound = lazy(function () { return import('./pages/NotFound'); });
var UserProfilePage = lazy(function () { return import('./components/profile/UserProfilePage'); });
// Main workspace page
var MainPage = lazy(function () { return import('./pages/Main'); });
// Create fallback components for pages that might have import issues
var LazyPage = function (_a) {
    var name = _a.name, path = _a.path;
    return (_jsxs("div", { className: "p-8 max-w-4xl mx-auto", children: [_jsxs("h1", { className: "text-3xl font-bold mb-6", children: ["\uD83D\uDE80 ", name] }), _jsxs("div", { className: "bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg", children: [_jsxs("p", { className: "text-lg mb-4", children: ["This is the ", name, " page."] }), _jsxs("p", { className: "text-gray-600 mb-4", children: ["Path: ", path] }), _jsx("p", { className: "text-sm text-gray-500", children: "This page is working and ready for content!" })] })] }));
};
import SmartNavigation from './components/SmartNavigation';
// Remove the old ComprehensiveNavigation component and replace with SmartNavigation
export default function ComprehensiveRouter() {
    return (_jsxs("div", { children: [_jsx(SmartNavigation, {}), _jsx(Suspense, { fallback: _jsx(LoadingFallback, { name: "Page" }), children: _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(HomePage, {}) }), _jsx(Route, { path: "/home", element: _jsx(HomePage, {}) }), _jsx(Route, { path: "/dashboard", element: _jsx(Dashboard, {}) }), _jsx(Route, { path: "/sophisticated-hub", element: _jsx(SophisticatedTNFHub, {}) }), _jsx(Route, { path: "/resources", element: _jsx(ResourcesDashboard, {}) }), _jsx(Route, { path: "/multi-agent-chat", element: _jsx(MultiAgentChat, {}) }), _jsx(Route, { path: "/ai-portal", element: _jsx(AIAgentPortal, {}) }), _jsx(Route, { path: "/chat", element: _jsx(ChatPage, {}) }), _jsx(Route, { path: "/ai-agents", element: _jsx(AIAgentPortalPage, {}) }), _jsx(Route, { path: "/agent-builder", element: _jsx(UnifiedAgentCreator, {}) }), _jsx(Route, { path: "/agent-management", element: _jsx(AgentsPage, {}) }), _jsx(Route, { path: "/agents", element: _jsx(AgentsPage, {}) }), _jsx(Route, { path: "/agents/new", element: _jsx(Suspense, { fallback: _jsx(LoadingFallback, { name: "Agent Creator" }), children: _jsx(UnifiedAgentCreator, {}) }) }), _jsx(Route, { path: "/agents/:id", element: _jsx(AgentDetail, {}) }), _jsx(Route, { path: "/agents/nft-marketplace", element: _jsx(NFTMarketplacePage, {}) }), _jsx(Route, { path: "/agents/revenue-dashboard", element: _jsx(RevenueDashboardPage, {}) }), _jsx(Route, { path: "/workspace/overview", element: _jsx(WorkspaceOverview, {}) }), _jsx(Route, { path: "/workspace/analytics", element: _jsx(WorkspaceAnalytics, {}) }), _jsx(Route, { path: "/workspace/members", element: _jsx(WorkspaceMembers, {}) }), _jsx(Route, { path: "/workspace/settings", element: _jsx(WorkspaceSettings, {}) }), _jsx(Route, { path: "/tasks", element: _jsx(TasksPage, {}) }), _jsx(Route, { path: "/workflows", element: _jsx(Workflows, {}) }), _jsx(Route, { path: "/workflows/builder", element: _jsx(WorkflowBuilder, {}) }), _jsx(Route, { path: "/workflows/advanced-builder", element: _jsx(WorkflowEditorWrapper, {}) }), _jsx(Route, { path: "/workflows/templates", element: _jsx(WorkflowTemplates, {}) }), _jsx(Route, { path: "/admin", element: _jsx(AdminPanel, {}) }), _jsx(Route, { path: "/admin/users", element: _jsx(AdminUserManagement, {}) }), _jsx(Route, { path: "/admin/system-health", element: _jsx(AdminSystemHealth, {}) }), _jsx(Route, { path: "/settings", element: _jsx(Settings, {}) }), _jsx(Route, { path: "/settings/general", element: _jsx(GeneralSettings, {}) }), _jsx(Route, { path: "/login", element: _jsx(LoginPage, {}) }), _jsx(Route, { path: "/register", element: _jsx(RegisterPage, {}) }), _jsx(Route, { path: "/components", element: _jsx(ComponentsShowcase, {}) }), _jsx(Route, { path: "/timeline-demo", element: _jsx(TimelineDemo, {}) }), _jsx(Route, { path: "/graph-demo", element: _jsx(GraphDemo, {}) }), _jsx(Route, { path: "/frontend-showcase", element: _jsx(FrontendShowcasePage, {}) }), _jsx(Route, { path: "/debug", element: _jsx(DebugPageComponent, {}) }), _jsx(Route, { path: "/build-info", element: _jsx(BuildInfoPage, {}) }), _jsx(Route, { path: "/debug-routing", element: _jsx(DebugRoutingComponent, {}) }), _jsx(Route, { path: "/all-pages", element: _jsx(AllPages, {}) }), _jsx(Route, { path: "/analytics", element: _jsx(Analytics, {}) }), _jsx(Route, { path: "/suggestions", element: _jsx(SuggestionsPage, {}) }), _jsx(Route, { path: "/suggestions/new", element: _jsx(NewSuggestionPage, {}) }), _jsx(Route, { path: "/suggestions/:id", element: _jsx(SuggestionDetailPage, {}) }), _jsx(Route, { path: "/admin/feature-flags", element: _jsx(AdminFeatureFlags, {}) }), _jsx(Route, { path: "/admin/port-management", element: _jsx(AdminPortManagement, {}) }), _jsx(Route, { path: "/admin/workspaces", element: _jsx(WorkspaceManagement, {}) }), _jsx(Route, { path: "/admin/settings", element: _jsx(AdminSettings, {}) }), _jsx(Route, { path: "/auth", element: _jsx(AuthIndexPage, {}) }), _jsx(Route, { path: "/auth/login", element: _jsx(LoginPage, {}) }), _jsx(Route, { path: "/auth/register", element: _jsx(RegisterPage, {}) }), _jsx(Route, { path: "/auth/forgot-password", element: _jsx(ForgotPasswordPage, {}) }), _jsx(Route, { path: "/auth/reset-password", element: _jsx(ResetPasswordPage, {}) }), _jsx(Route, { path: "/auth/sso", element: _jsx(SSOPage, {}) }), _jsx(Route, { path: "/auth/google-callback", element: _jsx(GoogleCallbackPage, {}) }), _jsx(Route, { path: "/auth/oauth-callback", element: _jsx(OAuthCallbackPage, {}) }), _jsx(Route, { path: "/landing", element: _jsx(LandingIndexPage, {}) }), _jsx(Route, { path: "/onboarding", element: _jsx(OnboardingFlowPage, {}) }), _jsx(Route, { path: "/workspace-chat", element: _jsx(WorkspaceChatPage, {}) }), _jsx(Route, { path: "/tasks/new", element: _jsx(NewTaskPage, {}) }), _jsx(Route, { path: "/tasks/:id", element: _jsx(TaskDetailPage, {}) }), _jsx(Route, { path: "/tasks/:id/edit", element: _jsx(TaskEditPage, {}) }), _jsx(Route, { path: "/dashboard/agents", element: _jsx(AgentDashboard, {}) }), _jsx(Route, { path: "/dashboard/agents/new", element: _jsx(CreateAgent, {}) }), _jsx(Route, { path: "/dashboard/agents/:id", element: _jsx(AgentDetail, {}) }), _jsx(Route, { path: "/settings/appearance", element: _jsx(SettingsAppearance, {}) }), _jsx(Route, { path: "/settings/notifications", element: _jsx(SettingsNotifications, {}) }), _jsx(Route, { path: "/settings/security", element: _jsx(SettingsSecurity, {}) }), _jsx(Route, { path: "/settings/api", element: _jsx(SettingsAPI, {}) }), _jsx(Route, { path: "/general-settings", element: _jsx(GeneralSettings, {}) }), _jsx(Route, { path: "/general-settings/embedding", element: _jsx(GeneralSettingsEmbeddingPage, {}) }), _jsx(Route, { path: "/frontend-showcase", element: _jsx(FrontendShowcasePage, {}) }), _jsx(Route, { path: "/layout-example", element: _jsx(LayoutExamples, {}) }), _jsx(Route, { path: "/simple-test", element: _jsx(SimpleTestPage, {}) }), _jsx(Route, { path: "/test", element: _jsx(TestPage, {}) }), _jsx(Route, { path: "/workflows/executions", element: _jsx(WorkflowExecutionPage, {}) }), _jsx(Route, { path: "/workflows/:id", element: _jsx(WorkflowDetailPage, {}) }), _jsx(Route, { path: "/workflows/:id/execution", element: _jsx(WorkflowExecutionPage, {}) }), _jsx(Route, { path: "/unauthorized", element: _jsx(UnauthorizedPage, {}) }), _jsx(Route, { path: "/ai-agent-portal", element: _jsx(AIAgentPortalPage, {}) }), _jsx(Route, { path: "/dashboard/analytics", element: _jsx(Analytics, {}) }), _jsx(Route, { path: "/dashboard/settings", element: _jsx(DashboardSettings, {}) }), _jsx(Route, { path: "/components-showcase", element: _jsx(ComponentsShowcase, {}) }), _jsx(Route, { path: "/not-found", element: _jsx(NotFound, {}) }), _jsx(Route, { path: "/chat-page", element: _jsx(ChatPage, {}) }), _jsx(Route, { path: "/workspace-chat", element: _jsx(WorkspaceChatPage, {}) }), _jsx(Route, { path: "/workspace/chat", element: _jsx(WorkspaceChatPage, {}) }), _jsx(Route, { path: "/workspace/layout", element: _jsx(WorkspaceLayoutPage, {}) }), _jsx(Route, { path: "/workspace", element: _jsx(WorkspaceIndexPage, {}) }), _jsx(Route, { path: "/admin/onboarding", element: _jsx(AdminOnboardingPage, {}) }), _jsx(Route, { path: "/admin/dashboard", element: _jsx(AdminDashboardPage, {}) }), _jsx(Route, { path: "/admin/experimental-features", element: _jsx(ExperimentalFeaturesPage, {}) }), _jsx(Route, { path: "/legal/privacy", element: _jsx(PrivacyPolicyPage, {}) }), _jsx(Route, { path: "/legal/terms", element: _jsx(TermsOfServicePage, {}) }), _jsx(Route, { path: "/landing-page", element: _jsx(LandingPageAlt, {}) }), _jsx(Route, { path: "/simple-landing", element: _jsx(SimpleLandingPage, {}) }), _jsx(Route, { path: "/home-page", element: _jsx(HomePage, {}) }), _jsx(Route, { path: "/components-nav", element: _jsx(ComponentsNavPage, {}) }), _jsx(Route, { path: "/workflows-enhanced", element: _jsx(WorkflowsEnhancedPage, {}) }), _jsx(Route, { path: "/workflows/detail", element: _jsx(WorkflowDetailPage, {}) }), _jsx(Route, { path: "/workflows/execution", element: _jsx(WorkflowExecutionPage, {}) }), _jsx(Route, { path: "/workflows/templates", element: _jsx(WorkflowTemplatesPage, {}) }), _jsx(Route, { path: "/preview/onboarding", element: _jsx(OnboardingPreviewPage, {}) }), _jsx(Route, { path: "/workspace-settings/llm-selection", element: _jsx(WorkspaceLLMSelectionPage, {}) }), _jsx(Route, { path: "/workspace-settings/chat-model", element: _jsx(WorkspaceLLMSelectionPage, {}) }), _jsx(Route, { path: "/workspace-settings/agent-model", element: _jsx(AgentModelSelectionPage, {}) }), _jsx(Route, { path: "/agents/unified-creator", element: _jsx(UnifiedAgentCreator, {}) }), _jsx(Route, { path: "/admin/agents/skills", element: _jsx(AdminAgentSkillsPage, {}) }), _jsx(Route, { path: "/admin/agents/web-search", element: _jsx(Suspense, { fallback: _jsx(LoadingFallback, { name: "Web Search Selection" }), children: _jsx(WebSearchSelection, {}) }) }), _jsx(Route, { path: "/tasks-page", element: _jsx(TasksPageComponent, {}) }), _jsx(Route, { path: "/general-settings", element: _jsx(GeneralSettingsPage, {}) }), _jsx(Route, { path: "/general-settings/embedding", element: _jsx(GeneralSettingsEmbeddingPage, {}) }), _jsx(Route, { path: "/general-settings/community-hub", element: _jsx(CommunityHub, {}) }), _jsx(Route, { path: "/main", element: _jsx(MainPage, {}) }), _jsx(Route, { path: "/admin/layout", element: _jsx(LazyPage, { name: "Admin Layout", path: "/admin/layout" }) }), _jsx(Route, { path: "/multi-agent-chat-demo", element: _jsx(MultiAgentChat, {}) }), _jsx(Route, { path: "/api/admin/database", element: _jsx(LazyPage, { name: "Admin Database API", path: "/api/admin/database" }) }), _jsx(Route, { path: "/api/admin/features", element: _jsx(LazyPage, { name: "Admin Features API", path: "/api/admin/features" }) }), _jsx(Route, { path: "/package/dashboard", element: _jsx(LazyPage, { name: "Package Dashboard", path: "/package/dashboard" }) }), _jsx(Route, { path: "/package/login", element: _jsx(LazyPage, { name: "Package Login", path: "/package/login" }) }), _jsx(Route, { path: "/package/agents", element: _jsx(LazyPage, { name: "Package Agents", path: "/package/agents" }) }), _jsx(Route, { path: "/package/workflows", element: _jsx(LazyPage, { name: "Package Workflows", path: "/package/workflows" }) }), _jsx(Route, { path: "/user/profile", element: _jsx(Suspense, { fallback: _jsx(LoadingFallback, { name: "User Profile" }), children: _jsx(UserProfilePage, {}) }) }), _jsx(Route, { path: "/html/dashboard", element: _jsx(LazyPage, { name: "HTML Dashboard Prototype", path: "/html/dashboard" }) }), _jsx(Route, { path: "/html/admin", element: _jsx(LazyPage, { name: "HTML Admin Prototype", path: "/html/admin" }) }), _jsx(Route, { path: "/html/agents", element: _jsx(LazyPage, { name: "HTML Agents Prototype", path: "/html/agents" }) }), _jsx(Route, { path: "/html/chat", element: _jsx(LazyPage, { name: "HTML Chat Prototype", path: "/html/chat" }) }), _jsx(Route, { path: "/html/tasks", element: _jsx(LazyPage, { name: "HTML Tasks Prototype", path: "/html/tasks" }) }), _jsx(Route, { path: "/html/workflows", element: _jsx(LazyPage, { name: "HTML Workflows Prototype", path: "/html/workflows" }) }), _jsx(Route, { path: "/404", element: _jsx(Suspense, { fallback: _jsx(LoadingFallback, { name: "Page Not Found" }), children: _jsx(NotFound, {}) }) }), _jsx(Route, { path: "*", element: _jsxs("div", { className: "p-8 text-center", children: [_jsx("h1", { className: "text-3xl font-bold text-red-600 mb-4", children: "404 - Page Not Found" }), _jsx("p", { className: "text-gray-600 mb-4", children: "The page you are looking for does not exist." }), _jsx(Link, { to: "/", className: "bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors", children: "Go Home" })] }) })] }) })] }));
}
