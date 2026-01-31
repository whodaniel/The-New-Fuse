import { Suspense, lazy } from 'react';
import { Link, Route, Routes, useLocation } from 'react-router-dom';
import { PremiumLayout } from './layouts/PremiumLayout'; // Import PremiumLayout
import { PublicLayout } from './layouts/PublicLayout';

// Core components (keep loaded)
import LoginPage from './pages/auth/Login';
import RegisterPage from './pages/auth/Register';

import RequireAuth from './components/RequireAuth';
import RequirePermission from './components/auth/RequirePermission';

// Lazy load heavy components for better performance
const MultiAgentChat = lazy(() => import('./components/MultiAgentChat'));
const WorkspaceAnalytics = lazy(() => import('./pages/workspace/WorkspaceAnalytics'));
const WorkspaceSettings = lazy(() => import('./pages/workspace/Settings'));
const AdminPanel = lazy(() => import('./pages/Admin/AdminPanel'));
const ComponentsShowcase = lazy(() => import('./pages/ComponentsShowcase'));
const TimelineDemo = lazy(() => import('./pages/timeline-demo'));
const GraphDemo = lazy(() =>
  import('./pages/graph-demo').then((module) => ({ default: module.GraphDemo }))
);
const TasksPage = lazy(() => import('./pages/Tasks/TasksPage'));
const AgencyDashboard = lazy(() => import('./pages/Agency/AgencyDashboard'));
const AgencyOnboarding = lazy(() => import('./pages/Agency/AgencyOnboarding'));
const MCPHub = lazy(() => import('./pages/mcp/MCPHub'));
const A2AControl = lazy(() => import('./pages/A2AControl'));
const KnowledgeHub = lazy(() => import('./pages/KnowledgeHub'));
const ExecutionConsole = lazy(() => import('./pages/workflow-pages/ExecutionConsole'));
const AgentIdentity = lazy(() => import('./pages/Agents/AgentIdentity'));
const SystemObservatory = lazy(() => import('./pages/SystemObservatory'));
const SystemHealth = lazy(() => import('./pages/Admin/SystemHealth'));
const AgentsPage = lazy(() => import('./pages/AgentsRevolution')); // REVOLUTIONARY NEW DESIGN
const AgentDetail = lazy(() => import('./pages/Agents/Detail'));
const Workflows = lazy(() => import('./pages/Workflows.tsx'));
const WorkflowResultsViewer = lazy(() => import('./pages/workflow-pages/Results'));
const WorkflowBuilder = lazy(() => import('./pages/workflow-pages/Builder'));
const WorkflowEditorWrapper = lazy(() => import('./components/WorkflowEditor'));
const Analytics = lazy(() => import('./pages/dashboard/Analytics'));
const Dashboard = lazy(() =>
  import('./components/Dashboard').then((module) => ({ default: module.Dashboard }))
); // Updated to point to updated component
const Settings = lazy(() => import('./pages/Settings'));
const SettingsAppearance = lazy(() => import('./pages/settings/Appearance'));
const SettingsNotifications = lazy(() => import('./pages/settings/Notifications'));
const SettingsSecurity = lazy(() => import('./pages/settings/Security'));
const SettingsAPI = lazy(() => import('./pages/settings/API'));
const WorkspaceOverview = lazy(() => import('./pages/workspace/Overview'));
const WorkspaceMembers = lazy(() => import('./pages/workspace/Members'));
const WorkspaceChatPage = lazy(() => import('./pages/WorkspaceChat/index'));
const UnifiedAgentCreator = lazy(() => import('./pages/Agents/UnifiedAgentCreator'));

// Resources pages
const ResourcesDashboard = lazy(() => import('./pages/Resources/ResourcesDashboard'));

// Performance loading component
const LoadingFallback = ({ name }: { name: string }) => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="text-center">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-gray-600">Loading {name}...</p>
    </div>
  </div>
);

// Additional real components
import SmartNavigation from './components/SmartNavigation';
import AllPages from './pages/AllPages';

// Additional Admin components
const AdminUserManagement = lazy(() => import('./pages/Admin/UserManagement'));
const AdminFeatureFlags = lazy(() => import('./pages/Admin/FeatureFlags'));
const AdminPortManagement = lazy(() => import('./pages/Admin/PortManagement'));

// Comprehensive Admin Pages (Full-featured versions for SUPER_ADMIN)
const ComprehensiveAdminDashboard = lazy(() => import('./pages/Admin/ComprehensiveAdminDashboard'));
const UserManagementFull = lazy(() => import('./pages/Admin/UserManagementFull'));
const SystemMetricsDashboard = lazy(() => import('./pages/Admin/SystemMetricsDashboard'));
const AgentManagementFull = lazy(() => import('./pages/Admin/AgentManagementFull'));
const DatabaseAdminPanel = lazy(() => import('./pages/Admin/DatabaseAdminPanel'));
const APIAnalyticsFull = lazy(() => import('./pages/Admin/APIAnalyticsFull'));
const ConfigurationManagement = lazy(() => import('./pages/Admin/ConfigurationManagement'));
const AuditLogViewer = lazy(() => import('./pages/Admin/AuditLogViewer'));
const BackupRestore = lazy(() => import('./pages/Admin/BackupRestore'));

// Auth components
const AuthIndexPage = lazy(() => import('./pages/auth'));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPassword'));
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPassword'));
const SSOPage = lazy(() => import('./pages/auth/SSO'));
const GoogleCallbackPage = lazy(() => import('./pages/auth/GoogleCallback'));
const OAuthCallbackPage = lazy(() => import('./pages/auth/OAuthCallback'));
const UnstoppableDomainsCallbackPage = lazy(
  () => import('./pages/auth/UnstoppableDomainsCallback')
);

// Landing components
const LandingRevolutionPage = lazy(() => import('./pages/LandingRevolution'));
const OnboardingFlowPage = lazy(() => import('./pages/OnboardingFlow'));
const PricingPage = lazy(() => import('./pages/Pricing'));
const CommunityHubPage = lazy(() => import('./pages/Community/CommunityHub'));
const SupportPage = lazy(() => import('./pages/Support'));
const BrandIdentityPage = lazy(() => import('./pages/BrandIdentity'));
const DocsPage = lazy(() => import('./pages/Docs'));
const BlogPage = lazy(() => import('./pages/Blog').then((module) => ({ default: module.Blog })));

// AI Agent Onboarding - Critical for autonomous agent self-registration
const AIAgentOnboardingPage = lazy(() =>
  import('./components/onboarding/AIAgentOnboarding').then((module) => ({
    default: ({ onComplete = () => {} }: { onComplete?: (data: unknown) => void }) => (
      <module.AIAgentOnboarding onComplete={onComplete} />
    ),
  }))
);

// Agent Self-Registration Page - For both humans and AI agents to onboard
const AgentOnboardPage = lazy(() => import('./pages/Agents/Onboard'));

// Workspace components

// Task components
const TaskDetailPage = lazy(() => import('./pages/Tasks/Detail'));
const TaskEditPage = lazy(() => import('./pages/Tasks/Edit'));
const NewTaskPage = lazy(() => import('./pages/Tasks/New'));

// Additional pages
const UnauthorizedPage = lazy(() => import('./pages/Unauthorized'));
const AIAgentRegistration = lazy(() => import('./pages/AIAgentPortal/index'));

// Chat pages
const ChatPage = lazy(() => import('./pages/chat/ChatPage'));

// Legal pages

// Workspace pages

// Additional component pages

// Enhanced workflow pages
const WorkflowsEnhancedPage = lazy(() => import('./pages/WorkflowsEnhanced'));
const WorkflowDetailPage = lazy(() => import('./pages/workflow-pages/Detail'));
const WorkflowExecutionPage = lazy(() => import('./pages/workflow-pages/Execution'));
const WorkflowTemplatesPage = lazy(() => import('./pages/workflow-pages/Templates'));

// Preview pages
const OnboardingPreviewPage = lazy(() => import('./pages/preview/OnboardingPreview'));

// Remaining specialized settings routes
const WorkspaceLLMSelectionPage = lazy(
  () => import('./pages/WorkspaceSettings/ChatSettings/WorkspaceLLMSelection')
);
const AgentModelSelectionPage = lazy(
  () => import('./pages/WorkspaceSettings/AgentConfig/AgentModelSelection')
);

// Admin tools routes
const AdminAgentSkillsPage = lazy(() => import('./pages/Admin/Agents/skills'));

// Web Search Selection component
const WebSearchSelection = lazy(() => import('./pages/Admin/Agents/WebSearchSelection'));

// Additional missing routes from audit
const GeneralSettingsEmbeddingPage = lazy(
  () => import('./pages/GeneralSettings/EmbeddingPreference')
);
const GeneralSettings = lazy(() => import('./pages/GeneralSettings/index'));
const AdminSettings = lazy(() => import('./pages/Admin/AdminSettings'));
const WorkspaceManagement = lazy(() => import('./pages/Admin/WorkspaceManagement'));
const AgentDashboard = lazy(() => import('./pages/dashboard/AgentDashboard'));
const DashboardSettings = lazy(() => import('./pages/dashboard/DashboardSettings'));
const AIAgentDashboard = lazy(() => import('./pages/AIAgentDashboard'));
const NotFound = lazy(() => import('./pages/NotFound'));
const UserProfilePage = lazy(() => import('./components/profile/UserProfilePage'));

// Main workspace page
const MainPage = lazy(() => import('./pages/Main'));

// Live View - Real-time AI browser activity viewer
const LiveViewPage = lazy(() => import('./pages/LiveView'));

// AI Command Center - Multiple AI chat interfaces in one view

const AICommandCenterStreaming = lazy(
  () => import('./pages/AICommandCenter/AICommandCenterStreaming')
);

// Prompt Builder
const PromptBuilder = lazy(() => import('./features/prompt-builder/PromptBuilder'));

// Create fallback components for pages that might have import issues
const LazyPage = ({ name, path }: { name: string; path: string }) => (
  <div className="p-8 max-w-4xl mx-auto">
    <h1 className="text-3xl font-bold mb-6">🚀 {name}</h1>
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
      <p className="text-lg mb-4">This is the {name} page.</p>
      <p className="text-gray-600 mb-4">Path: {path}</p>
      <p className="text-sm text-gray-500">This page is working and ready for content!</p>
    </div>
  </div>
);

// Remove the old ComprehensiveNavigation component and replace with SmartNavigation
export default function ComprehensiveRouter() {
  const location = useLocation();
  const isPublicRoute =
    [
      '/',
      '/login',
      '/register',
      '/landing',
      '/home',
      '/pricing',
      '/community',
      '/support',
      '/contact',
      '/brand',
      '/blog',
      '/design-system',
    ].includes(location.pathname) ||
    location.pathname.startsWith('/auth') ||
    location.pathname.startsWith('/legal') ||
    location.pathname.startsWith('/onboarding') ||
    location.pathname === '/404';

  // Routes that have their own complete layout and shouldn't be wrapped in PremiumLayout
  const hasOwnLayout = ['/workflows/builder'].includes(location.pathname);

  // Use PremiumLayout for authenticated routes, except those with their own layout
  let Layout: React.ComponentType<any> = PremiumLayout;
  if (
    isPublicRoute &&
    !location.pathname.startsWith('/auth') &&
    !location.pathname.startsWith('/onboarding') &&
    !['/404', '/login', '/register'].includes(location.pathname)
  ) {
    Layout = PublicLayout;
  } else if (isPublicRoute || hasOwnLayout) {
    Layout = ({ children }) => <>{children}</>;
  }

  return (
    <div>
      {/* Conditional Navigation - only show SmartNavigation on public pages if needed,
           and explicitly hide it on Auth, Onboarding, and 404 pages for a clean UX */}
      {isPublicRoute &&
        !location.pathname.startsWith('/auth') &&
        !location.pathname.startsWith('/onboarding') &&
        !['/404', '/login', '/register'].includes(location.pathname) &&
        // Logic handled by PublicLayout now, but kept here for non-PublicLayout routes (like Auth)
        Layout !== PublicLayout && <SmartNavigation />}

      <Layout>
        <Suspense fallback={<LoadingFallback name="Page" />}>
          <Routes>
            {/* Core Routes */}
            <Route path="/" element={<LandingRevolutionPage />} />
            <Route path="/home" element={<AllPages />} />

            {/* Protected Core Routes */}
            <Route
              path="/dashboard"
              element={
                <RequireAuth>
                  <Dashboard />
                </RequireAuth>
              }
            />

            {/* Resources Marketplace */}
            <Route path="/resources" element={<ResourcesDashboard />} />

            {/* Functional Routes */}
            <Route path="/multi-agent-chat" element={<MultiAgentChat />} />
            <Route path="/ai-portal" element={<AIAgentDashboard />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/ai-agents" element={<AIAgentRegistration />} />
            <Route path="/agent-builder" element={<UnifiedAgentCreator />} />
            <Route path="/agent-management" element={<AgentsPage />} />
            <Route path="/agents" element={<AgentsPage />} />
            <Route
              path="/agents/new"
              element={
                <Suspense fallback={<LoadingFallback name="Agent Creator" />}>
                  <UnifiedAgentCreator />
                </Suspense>
              }
            />
            <Route path="/agents/:id" element={<AgentDetail />} />
            <Route path="/agents/:id/identity" element={<AgentIdentity />} />
            <Route path="/observatory" element={<SystemObservatory />} />
            <Route
              path="/agents/onboard"
              element={
                <Suspense fallback={<LoadingFallback name="Agent Onboarding" />}>
                  <AgentOnboardPage />
                </Suspense>
              }
            />
            <Route path="/workspace/overview" element={<WorkspaceOverview />} />
            <Route path="/workspace/analytics" element={<WorkspaceAnalytics />} />
            <Route path="/workspace/members" element={<WorkspaceMembers />} />
            <Route path="/workspace/settings" element={<WorkspaceSettings />} />
            <Route path="/tasks" element={<TasksPage />} />
            {/* Workflow Routes */}
            <Route path="/workflows" element={<Workflows />} />
            <Route path="/workflows/builder" element={<WorkflowBuilder />} />
            <Route path="/workflows/executions" element={<WorkflowExecutionPage />} />
            <Route path="/workflows/:id" element={<WorkflowDetailPage />} />
            <Route path="/workflows/:id/results" element={<WorkflowResultsViewer />} />
            <Route path="/workflows/console" element={<ExecutionConsole />} />
            <Route path="/workflows/advanced-builder" element={<WorkflowEditorWrapper />} />
            <Route path="/workflows/templates" element={<WorkflowTemplatesPage />} />

            {/* Prompt Builder */}
            <Route
              path="/prompt-builder"
              element={
                <Suspense fallback={<LoadingFallback name="Prompt Builder" />}>
                  <PromptBuilder />
                </Suspense>
              }
            />

            <Route path="/workflows-enhanced" element={<WorkflowsEnhancedPage />} />
            <Route path="/workflows/detail" element={<WorkflowDetailPage />} />
            <Route path="/workflows/execution" element={<WorkflowExecutionPage />} />

            {/* Master Admin Routes - Requires SUPER_ADMIN role */}
            <Route
              path="/admin"
              element={
                <RequirePermission roles={['SUPER_ADMIN']}>
                  <ComprehensiveAdminDashboard />
                </RequirePermission>
              }
            />
            <Route
              path="/admin/user-management"
              element={
                <RequirePermission roles={['SUPER_ADMIN']}>
                  <UserManagementFull />
                </RequirePermission>
              }
            />
            <Route
              path="/admin/system-metrics"
              element={
                <RequirePermission roles={['SUPER_ADMIN']}>
                  <SystemMetricsDashboard />
                </RequirePermission>
              }
            />
            <Route
              path="/admin/agent-management"
              element={
                <RequirePermission roles={['SUPER_ADMIN']}>
                  <AgentManagementFull />
                </RequirePermission>
              }
            />
            <Route
              path="/admin/database"
              element={
                <RequirePermission roles={['SUPER_ADMIN']}>
                  <DatabaseAdminPanel />
                </RequirePermission>
              }
            />
            <Route
              path="/admin/api-analytics"
              element={
                <RequirePermission roles={['SUPER_ADMIN']}>
                  <APIAnalyticsFull />
                </RequirePermission>
              }
            />
            <Route
              path="/admin/configuration"
              element={
                <RequirePermission roles={['SUPER_ADMIN']}>
                  <ConfigurationManagement />
                </RequirePermission>
              }
            />
            <Route
              path="/admin/audit-logs"
              element={
                <RequirePermission roles={['SUPER_ADMIN']}>
                  <AuditLogViewer />
                </RequirePermission>
              }
            />
            <Route
              path="/admin/backup-restore"
              element={
                <RequirePermission roles={['SUPER_ADMIN']}>
                  <BackupRestore />
                </RequirePermission>
              }
            />
            <Route
              path="/admin/system-health"
              element={
                <RequirePermission roles={['SUPER_ADMIN']}>
                  <SystemHealth />
                </RequirePermission>
              }
            />
            <Route
              path="/admin/feature-flags"
              element={
                <RequirePermission roles={['SUPER_ADMIN']}>
                  <AdminFeatureFlags />
                </RequirePermission>
              }
            />
            <Route
              path="/admin/port-management"
              element={
                <RequirePermission roles={['SUPER_ADMIN']}>
                  <AdminPortManagement />
                </RequirePermission>
              }
            />
            <Route
              path="/admin/workspaces"
              element={
                <RequirePermission roles={['SUPER_ADMIN']}>
                  <WorkspaceManagement />
                </RequirePermission>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <RequirePermission roles={['SUPER_ADMIN']}>
                  <AdminSettings />
                </RequirePermission>
              }
            />

            {/* Legacy admin routes (kept for backwards compatibility) */}
            <Route
              path="/admin/users"
              element={
                <RequirePermission roles={['SUPER_ADMIN']}>
                  <AdminUserManagement />
                </RequirePermission>
              }
            />

            {/* Agency Routes - Requires AGENCY_OWNER/AGENCY_ADMIN/AGENCY_MANAGER */}
            <Route
              path="/agency/dashboard"
              element={
                <RequirePermission roles={['AGENCY_OWNER', 'AGENCY_ADMIN', 'AGENCY_MANAGER']}>
                  <AgencyDashboard />
                </RequirePermission>
              }
            />
            <Route path="/agency/onboard" element={<AgencyOnboarding />} />

            {/* Other routes */}
            <Route path="/mcp-hub" element={<MCPHub />} />
            <Route path="/knowledge-hub" element={<KnowledgeHub />} />
            <Route path="/a2a-control" element={<A2AControl />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/settings/general" element={<GeneralSettings />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/all-pages" element={<AllPages />} />
            <Route path="/analytics" element={<Analytics />} />

            {/* Enhanced Auth Routes */}
            <Route path="/auth" element={<AuthIndexPage />} />
            <Route path="/auth/login" element={<LoginPage />} />
            <Route path="/auth/register" element={<RegisterPage />} />
            <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
            <Route path="/auth/sso" element={<SSOPage />} />
            <Route path="/auth/google-callback" element={<GoogleCallbackPage />} />
            <Route path="/auth/oauth-callback" element={<OAuthCallbackPage />} />
            <Route path="/auth/unstoppable-callback" element={<UnstoppableDomainsCallbackPage />} />

            {/* Enhanced Landing Routes */}
            <Route path="/landing" element={<LandingRevolutionPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/community" element={<CommunityHubPage />} />
            <Route path="/support" element={<SupportPage />} />
            <Route path="/contact" element={<SupportPage />} />
            <Route path="/onboarding" element={<OnboardingFlowPage />} />
            <Route path="/docs" element={<DocsPage />} />
            <Route path="/docs/*" element={<DocsPage />} />
            {/* Brand Identity / Design System */}
            <Route path="/brand" element={<BrandIdentityPage />} />
            <Route path="/design-system" element={<BrandIdentityPage />} />
            <Route path="/blog" element={<BlogPage />} />

            {/* AI Agent Onboarding - Critical for autonomous agent self-registration (ULTIMATE_UX_DESIGNER_BRIEF) */}
            <Route
              path="/onboarding/ai-agent"
              element={
                <Suspense fallback={<LoadingFallback name="AI Agent Onboarding" />}>
                  <AIAgentOnboardingPage />
                </Suspense>
              }
            />

            {/* Enhanced Workspace Routes - Fixed duplications */}
            <Route path="/workspace-chat" element={<WorkspaceChatPage />} />

            {/* Enhanced Task Routes */}
            <Route path="/tasks/new" element={<NewTaskPage />} />
            <Route path="/tasks/:id" element={<TaskDetailPage />} />
            <Route path="/tasks/:id/edit" element={<TaskEditPage />} />

            {/* Enhanced Dashboard Routes */}
            <Route path="/dashboard/agents" element={<AgentDashboard />} />
            <Route path="/dashboard/agents/new" element={<UnifiedAgentCreator />} />
            <Route path="/dashboard/agents/:id" element={<AgentDetail />} />

            {/* Enhanced Settings Routes */}
            <Route path="/settings/appearance" element={<SettingsAppearance />} />
            <Route path="/settings/notifications" element={<SettingsNotifications />} />
            <Route path="/settings/security" element={<SettingsSecurity />} />
            <Route path="/settings/api" element={<SettingsAPI />} />
            <Route path="/general-settings" element={<GeneralSettings />} />
            <Route path="/general-settings/embedding" element={<GeneralSettingsEmbeddingPage />} />

            {/* Additional Routes */}
            <Route path="/unauthorized" element={<UnauthorizedPage />} />
            <Route path="/ai-agent-portal" element={<AIAgentRegistration />} />

            {/* Critical Missing Routes */}
            <Route path="/dashboard/analytics" element={<Analytics />} />
            <Route path="/dashboard/settings" element={<DashboardSettings />} />
            <Route path="/not-found" element={<NotFound />} />

            {/* Preview Routes */}
            <Route path="/preview/onboarding" element={<OnboardingPreviewPage />} />

            {/* Remaining Specialized Settings Routes */}
            <Route
              path="/workspace-settings/llm-selection"
              element={<WorkspaceLLMSelectionPage />}
            />
            <Route path="/workspace-settings/chat-model" element={<WorkspaceLLMSelectionPage />} />
            <Route
              path="/workspace-settings/agent-model"
              element={
                <AgentModelSelectionPage
                  provider="default"
                  workspace={{ agentModel: 'default' }}
                  setHasChanges={() => {}}
                />
              }
            />

            {/* Admin Tools Routes */}
            <Route path="/admin/agents/skills" element={<AdminAgentSkillsPage />} />
            <Route
              path="/admin/agents/web-search"
              element={
                <Suspense fallback={<LoadingFallback name="Web Search Selection" />}>
                  <WebSearchSelection />
                </Suspense>
              }
            />

            {/* Main workspace page */}
            <Route path="/main" element={<MainPage />} />

            {/* Live View - Real-time AI browser activity */}
            <Route
              path="/live-view"
              element={
                <Suspense fallback={<LoadingFallback name="Live View" />}>
                  <LiveViewPage />
                </Suspense>
              }
            />

            {/* AI Command Center - Multiple AI chats in iframes */}
            <Route
              path="/ai-command-center"
              element={
                <Suspense fallback={<LoadingFallback name="AI Command Center" />}>
                  <AICommandCenterStreaming />
                </Suspense>
              }
            />

            {/* AI Command Center Streaming (Explicit route) */}
            <Route
              path="/ai-command-center-streaming"
              element={
                <Suspense fallback={<LoadingFallback name="AI Command Center Streaming" />}>
                  <AICommandCenterStreaming />
                </Suspense>
              }
            />

            <Route
              path="/profile"
              element={
                <Suspense fallback={<LoadingFallback name="User Profile" />}>
                  <UserProfilePage />
                </Suspense>
              }
            />
            <Route
              path="/user/profile"
              element={
                <Suspense fallback={<LoadingFallback name="User Profile" />}>
                  <UserProfilePage />
                </Suspense>
              }
            />

            {/* Error Handling */}
            <Route
              path="/404"
              element={
                <Suspense fallback={<LoadingFallback name="Page Not Found" />}>
                  <NotFound />
                </Suspense>
              }
            />
            <Route
              path="*"
              element={
                <div className="p-8 text-center">
                  <h1 className="text-3xl font-bold text-red-600 mb-4">404 - Page Not Found</h1>
                  <p className="text-gray-600 mb-4">The page you are looking for does not exist.</p>
                  <Link
                    to="/"
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                  >
                    Go Home
                  </Link>
                </div>
              }
            />
          </Routes>
        </Suspense>
      </Layout>
    </div>
  );
}
