import { jsx as _jsx } from "react/jsx-runtime";
import { lazy, Suspense } from 'react';
import { Navigate } from 'react-router-dom';
import Loading from './components/ui/loading';
import AuthLayout from './layouts/AuthLayout';
import MainLayout from './layouts/MainLayout';
import AdminLayout from './layouts/AdminLayout';
import SettingsLayout from './layouts/SettingsLayout';
import HelpLayout from './layouts/HelpLayout';
// Auth pages
var Login = lazy(function () { return import('./pages/Auth/Login.js'); });
var Register = lazy(function () { return import('./pages/Auth/Register.js'); });
var ForgotPassword = lazy(function () { return import('./pages/Auth/ForgotPassword.js'); });
var ResetPassword = lazy(function () { return import('./pages/Auth/ResetPassword.js'); });
var VerifyEmail = lazy(function () { return import('./pages/Auth/VerifyEmail.js'); });
// Dashboard pages
var Dashboard = lazy(function () { return import('./pages/Dashboard.js'); });
var Analytics = lazy(function () { return import('./pages/Analytics.js'); });
var Activity = lazy(function () { return import('./pages/Activity.js'); });
var Notifications = lazy(function () { return import('./pages/Notifications.js'); });
// Agent pages
var Agents = lazy(function () { return import('./pages/Agents.js'); });
var AgentDetail = lazy(function () { return import('./pages/Agents/Detail.js'); });
var NewAgent = lazy(function () { return import('./pages/Agents/New.js'); });
var EditAgent = lazy(function () { return import('./pages/Agents/Edit.js'); });
var AgentLogs = lazy(function () { return import('./pages/Agents/Logs.js'); });
var AgentMonitoring = lazy(function () { return import('./pages/Agents/Monitoring.js'); });
var AgentMarketplace = lazy(function () { return import('./pages/Agents/Marketplace.js'); });
// Task pages
var Tasks = lazy(function () { return import('./pages/Tasks.js'); });
var TaskDetail = lazy(function () { return import('./pages/Tasks/Detail.js'); });
var NewTask = lazy(function () { return import('./pages/Tasks/New.js'); });
var EditTask = lazy(function () { return import('./pages/Tasks/Edit.js'); });
var TaskBoard = lazy(function () { return import('./pages/Tasks/Board.js'); });
var TaskCalendar = lazy(function () { return import('./pages/Tasks/Calendar.tsx'); });
var TaskReports = lazy(function () { return import('./pages/Tasks/Reports.js'); });
// Workflow pages
var Workflows = lazy(function () { return import('./pages/Workflows.js'); });
var WorkflowDetail = lazy(function () { return import('./pages/Workflows/Detail.js'); });
var WorkflowBuilder = lazy(function () { return import('./pages/Workflows/Builder.js'); });
var WorkflowExecution = lazy(function () { return import('./pages/Workflows/Execution.js'); });
var WorkflowTemplates = lazy(function () { return import('./pages/Workflows/Templates.js'); });
// Suggestion pages
var Suggestions = lazy(function () { return import('./pages/Suggestions.js'); });
var SuggestionDetail = lazy(function () { return import('./pages/Suggestions/Detail.js'); });
var NewSuggestion = lazy(function () { return import('./pages/Suggestions/New.js'); });
var EditSuggestion = lazy(function () { return import('./pages/Suggestions/Edit.js'); });
// Integration pages
var APIKeys = lazy(function () { return import('./pages/Integration/APIKeys.js'); });
var Webhooks = lazy(function () { return import('./pages/Integration/Webhooks.js'); });
var ThirdPartyIntegrations = lazy(function () { return import('./pages/Integration/ThirdParty.js'); });
var APIDocs = lazy(function () { return import('./pages/Integration/APIDocs.js'); });
var APIExplorer = lazy(function () { return import('./pages/Integration/APIExplorer.js'); });
// Admin pages
var UserManagement = lazy(function () { return import('./pages/Admin/Users.js'); });
var TeamManagement = lazy(function () { return import('./pages/Admin/Teams.js'); });
var SystemSettings = lazy(function () { return import('./pages/Admin/Settings.js'); });
var AuditLogs = lazy(function () { return import('./pages/Admin/AuditLogs.js'); });
var UsageStatistics = lazy(function () { return import('./pages/Admin/Usage.js'); });
var Billing = lazy(function () { return import('./pages/Admin/Billing.js'); });
// Settings pages
var UserProfile = lazy(function () { return import('./pages/Settings/Profile.js'); });
var AccountSettings = lazy(function () { return import('./pages/Settings/Account.js'); });
var NotificationPreferences = lazy(function () { return import('./pages/Settings/Notifications.js'); });
var PersonalAPIAccess = lazy(function () { return import('./pages/Settings/APIAccess.js'); });
var TeamMembership = lazy(function () { return import('./pages/Settings/Teams.js'); });
// Help pages
var Documentation = lazy(function () { return import('./pages/Help/Documentation.js'); });
var Tutorials = lazy(function () { return import('./pages/Help/Tutorials.js'); });
var FAQ = lazy(function () { return import('./pages/Help/FAQ.js'); });
var SupportTickets = lazy(function () { return import('./pages/Help/Support.js'); });
var CommunityForum = lazy(function () { return import('./pages/Help/Community.js'); });
// IDE pages
var TheiaIDE = lazy(function () { return import('./pages/IDE/TheiaIDE'); });
// Error pages
var NotFound = lazy(function () { return import('./pages/Error/NotFound.js'); });
var Forbidden = lazy(function () { return import('./pages/Error/Forbidden.js'); });
var ServerError = lazy(function () { return import('./pages/Error/ServerError.js'); });
// Wrap lazy-loaded components with Suspense
var withSuspense = function (Component) {
    return (_jsx(Suspense, { fallback: _jsx(Loading, {}), children: _jsx(Component, {}) }));
};
// Route configuration
var routeConfig = [
    // Public routes
    {
        path: '/',
        element: _jsx(Navigate, { to: "/dashboard", replace: true }),
    },
    // Auth routes
    {
        path: '/',
        element: _jsx(AuthLayout, {}),
        children: [
            {
                path: 'login',
                element: withSuspense(Login),
            },
            {
                path: 'register',
                element: withSuspense(Register),
            },
            {
                path: 'forgot-password',
                element: withSuspense(ForgotPassword),
            },
            {
                path: 'reset-password',
                element: withSuspense(ResetPassword),
            },
            {
                path: 'verify-email',
                element: withSuspense(VerifyEmail),
            },
        ],
    },
    // Main app routes
    {
        path: '/',
        element: _jsx(MainLayout, {}),
        children: [
            // Dashboard routes
            {
                path: 'dashboard',
                element: withSuspense(Dashboard),
            },
            {
                path: 'analytics',
                element: withSuspense(Analytics),
            },
            {
                path: 'activity',
                element: withSuspense(Activity),
            },
            {
                path: 'notifications',
                element: withSuspense(Notifications),
            },
            // Agent routes
            {
                path: 'agents',
                element: withSuspense(Agents),
            },
            {
                path: 'agents/new',
                element: withSuspense(NewAgent),
            },
            {
                path: 'agents/marketplace',
                element: withSuspense(AgentMarketplace),
            },
            {
                path: 'agents/:id',
                element: withSuspense(AgentDetail),
            },
            {
                path: 'agents/:id/edit',
                element: withSuspense(EditAgent),
            },
            {
                path: 'agents/:id/logs',
                element: withSuspense(AgentLogs),
            },
            {
                path: 'agents/:id/monitoring',
                element: withSuspense(AgentMonitoring),
            },
            // Task routes
            {
                path: 'tasks',
                element: withSuspense(Tasks),
            },
            {
                path: 'tasks/new',
                element: withSuspense(NewTask),
            },
            {
                path: 'tasks/board',
                element: withSuspense(TaskBoard),
            },
            {
                path: 'tasks/calendar',
                element: withSuspense(TaskCalendar),
            },
            {
                path: 'tasks/reports',
                element: withSuspense(TaskReports),
            },
            {
                path: 'tasks/:id',
                element: withSuspense(TaskDetail),
            },
            {
                path: 'tasks/:id/edit',
                element: withSuspense(EditTask),
            },
            // Workflow routes
            {
                path: 'workflows',
                element: withSuspense(Workflows),
            },
            {
                path: 'workflows/builder',
                element: withSuspense(WorkflowBuilder),
            },
            {
                path: 'workflows/templates',
                element: withSuspense(WorkflowTemplates),
            },
            {
                path: 'workflows/:id',
                element: withSuspense(WorkflowDetail),
            },
            {
                path: 'workflows/:id/execution',
                element: withSuspense(WorkflowExecution),
            },
            // Suggestion routes
            {
                path: 'suggestions',
                element: withSuspense(Suggestions),
            },
            {
                path: 'suggestions/new',
                element: withSuspense(NewSuggestion),
            },
            {
                path: 'suggestions/:id',
                element: withSuspense(SuggestionDetail),
            },
            {
                path: 'suggestions/:id/edit',
                element: withSuspense(EditSuggestion),
            },
            // Integration routes
            {
                path: 'integration/api-keys',
                element: withSuspense(APIKeys),
            },
            {
                path: 'integration/webhooks',
                element: withSuspense(Webhooks),
            },
            {
                path: 'integration/third-party',
                element: withSuspense(ThirdPartyIntegrations),
            },
            {
                path: 'integration/api-docs',
                element: withSuspense(APIDocs),
            },
            {
                path: 'integration/api-explorer',
                element: withSuspense(APIExplorer),
            },
            // IDE route
            {
                path: 'ide',
                element: withSuspense(TheiaIDE),
            },
        ],
    },
    // Admin routes
    {
        path: '/admin',
        element: _jsx(AdminLayout, {}),
        children: [
            {
                path: 'users',
                element: withSuspense(UserManagement),
            },
            {
                path: 'teams',
                element: withSuspense(TeamManagement),
            },
            {
                path: 'settings',
                element: withSuspense(SystemSettings),
            },
            {
                path: 'audit-logs',
                element: withSuspense(AuditLogs),
            },
            {
                path: 'usage',
                element: withSuspense(UsageStatistics),
            },
            {
                path: 'billing',
                element: withSuspense(Billing),
            },
        ],
    },
    // Settings routes
    {
        path: '/settings',
        element: _jsx(SettingsLayout, {}),
        children: [
            {
                path: 'profile',
                element: withSuspense(UserProfile),
            },
            {
                path: 'account',
                element: withSuspense(AccountSettings),
            },
            {
                path: 'notifications',
                element: withSuspense(NotificationPreferences),
            },
            {
                path: 'api-access',
                element: withSuspense(PersonalAPIAccess),
            },
            {
                path: 'teams',
                element: withSuspense(TeamMembership),
            },
        ],
    },
    // Help routes
    {
        path: '/help',
        element: _jsx(HelpLayout, {}),
        children: [
            {
                path: 'documentation',
                element: withSuspense(Documentation),
            },
            {
                path: 'tutorials',
                element: withSuspense(Tutorials),
            },
            {
                path: 'faq',
                element: withSuspense(FAQ),
            },
            {
                path: 'support',
                element: withSuspense(SupportTickets),
            },
            {
                path: 'community',
                element: withSuspense(CommunityForum),
            },
        ],
    },
    // Error routes
    {
        path: '/404',
        element: withSuspense(NotFound),
    },
    {
        path: '/403',
        element: withSuspense(Forbidden),
    },
    {
        path: '/500',
        element: withSuspense(ServerError),
    },
    {
        path: '*',
        element: _jsx(Navigate, { to: "/404", replace: true }),
    },
];
export default routeConfig;
