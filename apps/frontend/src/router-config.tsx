import React, { lazy, Suspense } from 'react';
import { Navigate } from 'react-router-dom';
import Loading from './components/ui/loading.js';
import AuthLayout from './layouts/AuthLayout.js';
import MainLayout from './layouts/MainLayout.js';
import AdminLayout from './layouts/AdminLayout.js';
import SettingsLayout from './layouts/SettingsLayout.js';
import HelpLayout from './layouts/HelpLayout.js';

// Auth pages
const Login = lazy(() => import('./pages/Auth/Login.js'));
const Register = lazy(() => import('./pages/Auth/Register.js'));
const ForgotPassword = lazy(() => import('./pages/Auth/ForgotPassword.js'));
const ResetPassword = lazy(() => import('./pages/Auth/ResetPassword.js'));
const VerifyEmail = lazy(() => import('./pages/Auth/VerifyEmail.js'));

// Dashboard pages
const Dashboard = lazy(() => import('./pages/Dashboard.js'));
const Analytics = lazy(() => import('./pages/Analytics.js'));
const Activity = lazy(() => import('./pages/Activity.js'));
const Notifications = lazy(() => import('./pages/Notifications.js'));

// Agent pages
const Agents = lazy(() => import('./pages/Agents.js'));
const AgentDetail = lazy(() => import('./pages/Agents/Detail.js'));
const NewAgent = lazy(() => import('./pages/Agents/New.js'));
const EditAgent = lazy(() => import('./pages/Agents/Edit.js'));
const AgentLogs = lazy(() => import('./pages/Agents/Logs.js'));
const AgentMonitoring = lazy(() => import('./pages/Agents/Monitoring.js'));
const AgentMarketplace = lazy(() => import('./pages/Agents/Marketplace.js'));

// Task pages
const Tasks = lazy(() => import('./pages/Tasks.js'));
const TaskDetail = lazy(() => import('./pages/Tasks/Detail.js'));
const NewTask = lazy(() => import('./pages/Tasks/New.js'));
const EditTask = lazy(() => import('./pages/Tasks/Edit.js'));
const TaskBoard = lazy(() => import('./pages/Tasks/Board.js'));
const TaskCalendar = lazy(() => import('./pages/Tasks/Calendar.js'));
const TaskReports = lazy(() => import('./pages/Tasks/Reports.js'));

// Workflow pages
const Workflows = lazy(() => import('./pages/Workflows.js'));
const WorkflowDetail = lazy(() => import('./pages/Workflows/Detail.js'));
const WorkflowBuilder = lazy(() => import('./pages/Workflows/Builder.js'));
const WorkflowExecution = lazy(() => import('./pages/Workflows/Execution.js'));
const WorkflowTemplates = lazy(() => import('./pages/Workflows/Templates.js'));

// Suggestion pages
const Suggestions = lazy(() => import('./pages/Suggestions.js'));
const SuggestionDetail = lazy(() => import('./pages/Suggestions/Detail.js'));
const NewSuggestion = lazy(() => import('./pages/Suggestions/New.js'));
const EditSuggestion = lazy(() => import('./pages/Suggestions/Edit.js'));

// Integration pages
const APIKeys = lazy(() => import('./pages/Integration/APIKeys.js'));
const Webhooks = lazy(() => import('./pages/Integration/Webhooks.js'));
const ThirdPartyIntegrations = lazy(() => import('./pages/Integration/ThirdParty.js'));
const APIDocs = lazy(() => import('./pages/Integration/APIDocs.js'));
const APIExplorer = lazy(() => import('./pages/Integration/APIExplorer.js'));

// Admin pages
const UserManagement = lazy(() => import('./pages/Admin/Users.js'));
const TeamManagement = lazy(() => import('./pages/Admin/Teams.js'));
const SystemSettings = lazy(() => import('./pages/Admin/Settings.js'));
const AuditLogs = lazy(() => import('./pages/Admin/AuditLogs.js'));
const UsageStatistics = lazy(() => import('./pages/Admin/Usage.js'));
const Billing = lazy(() => import('./pages/Admin/Billing.js'));

// Settings pages
const UserProfile = lazy(() => import('./pages/Settings/Profile.js'));
const AccountSettings = lazy(() => import('./pages/Settings/Account.js'));
const NotificationPreferences = lazy(() => import('./pages/Settings/Notifications.js'));
const PersonalAPIAccess = lazy(() => import('./pages/Settings/APIAccess.js'));
const TeamMembership = lazy(() => import('./pages/Settings/Teams.js'));

// Help pages
const Documentation = lazy(() => import('./pages/Help/Documentation.js'));
const Tutorials = lazy(() => import('./pages/Help/Tutorials.js'));
const FAQ = lazy(() => import('./pages/Help/FAQ.js'));
const SupportTickets = lazy(() => import('./pages/Help/Support.js'));
const CommunityForum = lazy(() => import('./pages/Help/Community.js'));

// Error pages
const NotFound = lazy(() => import('./pages/Error/NotFound.js'));
const Forbidden = lazy(() => import('./pages/Error/Forbidden.js'));
const ServerError = lazy(() => import('./pages/Error/ServerError.js'));

// Wrap lazy-loaded components with Suspense
const withSuspense = (Component: React.LazyExoticComponent<React.ComponentType<any>>) => {
  return (
    <Suspense fallback={<Loading />}>
      <Component />
    </Suspense>
  );
};

// Route configuration
const routeConfig = [
  // Public routes
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />,
  },

  // Auth routes
  {
    path: '/',
    element: <AuthLayout />,
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
    element: <MainLayout />,
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
    ],
  },

  // Admin routes
  {
    path: '/admin',
    element: <AdminLayout />,
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
    element: <SettingsLayout />,
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
    element: <HelpLayout />,
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
    element: <Navigate to="/404" replace />,
  },
];

export default routeConfig;
