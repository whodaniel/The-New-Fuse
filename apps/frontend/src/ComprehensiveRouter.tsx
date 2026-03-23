import { Suspense, lazy, type ReactNode } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { LEGACY_REDIRECTS } from './config/legacyRedirects';
// Lazy load layouts for code splitting
const PerpetualStatus = lazy(() => import('../pages/PerpetualStatus'));
const LaunchpadDashboard = lazy(() => import('../pages/LaunchpadDashboard'));
const PremiumLayout = lazy(() => import('./layouts/PremiumLayout'));
const PublicLayout = lazy(() => import('./layouts/PublicLayout'));

// Core components (keep loaded)
import LoginPage from './pages/auth/Login';
import RegisterPage from './pages/auth/Register';

import ErrorBoundary from './components/ErrorBoundary';
import RequireAuth from './components/RequireAuth';
import RequireMembership from './components/auth/RequireMembership';
import RequirePermission from './components/auth/RequirePermission';

// Lazy load heavy components for better performance
const MultiAgentChat = lazy(() => import('./components/MultiAgentChat'));
const WorkspaceAnalytics = lazy(() => import('./pages/workspace/WorkspaceAnalytics'));
const WorkspaceSettings = lazy(() => import('./pages/workspace/Settings'));
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
const CommandCore = lazy(() => import('./pages/CommandCore'));
const SystemHealth = lazy(() => import('./pages/Admin/SystemHealth'));
const SpacesOverview = lazy(() => import('./pages/Spaces/SpacesOverview'));
const AgentsPage = lazy(() => import('./pages/AgentsRevolution')); // REVOLUTIONARY NEW DESIGN
const AgentDetail = lazy(() => import('./pages/Agents/Detail'));
const Workflows = lazy(() => import('./pages/Workflows.tsx'));
const WorkflowBuilder = lazy(() => import('./pages/workflow-pages/Builder'));
const WorkflowEditorWrapper = lazy(() => import('./components/WorkflowEditor'));
const Analytics = lazy(() => import('./pages/dashboard/Analytics'));
const Dashboard = lazy(() => import('./pages/dashboard/TNFConsoleDashboard'));
const Settings = lazy(() => import('./pages/Settings'));
const SettingsGeneral = lazy(() => import('./pages/settings/General'));
const SettingsAppearance = lazy(() => import('./pages/settings/Appearance'));
const SettingsNotifications = lazy(() => import('./pages/settings/Notifications'));
const SettingsSecurity = lazy(() => import('./pages/settings/Security'));
const SettingsAPI = lazy(() => import('./pages/settings/API'));
const WorkspaceOverview = lazy(() => import('./pages/workspace/Overview'));
const WorkspaceMembers = lazy(() => import('./pages/workspace/Members'));
const WorkspaceChatPage = lazy(() => import('./pages/WorkspaceChat/index'));
const NFTMarketplacePage = lazy(() => import('./pages/Agents/NFTMarketplacePage'));
const RevenueDashboardPage = lazy(() => import('./pages/Agents/RevenueDashboardPage'));
const UnifiedAgentCreator = lazy(() => import('./pages/Agents/UnifiedAgentCreator'));
const SophisticatedTNFHub = lazy(() => import('./pages/Hub/SophisticatedTNFHub'));
const ModernHub = lazy(() => import('./pages/Hub/ModernHub'));

// Resources pages
const ResourcesDashboard = lazy(() => import('./pages/Resources/ResourcesDashboard'));
const MarketplaceDashboard = lazy(() => import('./pages/Marketplace'));
const MarketplacePublicPage = lazy(() => import('./pages/Marketplace/MarketplacePublicPage'));

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
import AllPages from './pages/AllPages';
import BuildInfoPage from './pages/BuildInfo';
import DebugPageComponent from './pages/Debug';
import DebugRoutingComponent from './pages/DebugRouting';
import TestPage from './pages/Test';

// Suggestions components
const SuggestionsPage = lazy(() => import('./pages/Suggestions'));
const NewSuggestionPage = lazy(() => import('./pages/Suggestions/New'));
const SuggestionDetailPage = lazy(() => import('./pages/Suggestions/Detail'));
const GoalsPage = lazy(() => import('./pages/Goals'));
const GoalDetailPage = lazy(() => import('./pages/Goals/Detail'));
const PlansPage = lazy(() => import('./pages/Plans'));
const PlanDetailPage = lazy(() => import('./pages/Plans/Detail'));
const TimelinePage = lazy(() => import('./pages/Timeline'));
const MacroTimelinePage = lazy(() => import('./pages/Timeline/MacroTimelinePage'));
const TimelineModulePage = lazy(() => import('./pages/Timeline/TimelineModulePage'));

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
const OpenClawSecurity = lazy(() => import('./pages/Admin/OpenClawSecurity'));
const SuperAdminControlPanel = lazy(() => import('./pages/Admin/SuperAdminControlPanel'));
const NexusVisualizer = lazy(() => import('./pages/SystemObservatory'));

// Auth components
const AuthIndexPage = lazy(() => import('./pages/auth/index'));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPassword'));
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPassword'));
const SSOPage = lazy(() => import('./pages/auth/SSO'));
const GoogleCallbackPage = lazy(() => import('./pages/auth/GoogleCallback'));
const OAuthCallbackPage = lazy(() => import('./pages/auth/OAuthCallback'));

// Landing components archived to static HTML
const OnboardingFlowPage = lazy(() => import('./pages/OnboardingFlow'));
const CommunityHubPage = lazy(() => import('./pages/Community/CommunityHub'));
const SupportPage = lazy(() => import('./pages/Support'));
const BrandIdentityPage = lazy(() => import('./pages/BrandIdentity'));
const DocsPage = lazy(() => import('./pages/Docs'));
const BlogPage = lazy(() => import('./pages/Blog').then((module) => ({ default: module.Blog })));
const ConnectExtensionPage = lazy(() => import('./pages/ConnectExtension'));
const MembershipPage = lazy(() => import('./pages/Membership'));
const VisualizationsPage = lazy(() => import('./pages/Visualizations'));
const TerminalGraphPage = lazy(() => import('./pages/TerminalGraph'));

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
const FrontendShowcasePage = lazy(() => import('./pages/FrontendShowcase'));
const SimpleTestPage = lazy(() => import('./pages/SimpleTest'));

// Chat pages
const ChatPage = lazy(() => import('./pages/chat/ChatPage'));

// Legal pages
const PrivacyPolicyPage = lazy(() => import('./pages/legal/PrivacyPolicy'));
const TermsOfServicePage = lazy(() => import('./pages/legal/TermsOfService'));

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
const LayoutExamples = lazy(() => import('./pages/Layout/LayoutExamples'));
const AIAgentDashboard = lazy(() => import('./pages/AIAgentDashboard'));
const NotFound = lazy(() => import('./pages/NotFound'));
const UserProfilePage = lazy(() => import('./components/profile/UserProfilePage'));

// Main workspace page
const MainPage = lazy(() => import('./pages/Main'));

// Live View - Real-time AI browser activity viewer
const LiveViewPage = lazy(() => import('./pages/LiveView'));

// AI Command Center - Multiple AI chat interfaces in one view
const AICommandCenter = lazy(() => import('./pages/AICommandCenter'));

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

const SmartNavigation = lazy(() => import('./components/SmartNavigation'));

// Redirect component to force reload to static HTML pages
const RedirectToStatic = ({ to }: { to: string }) => {
  if (typeof window !== 'undefined') {
    window.location.href = to;
  }
  return null;
};

const MarketplaceRootRoute = () => {
  if (typeof window === 'undefined') {
    return <RedirectToStatic to="/" />;
  }

  const host = window.location.hostname;
  const isMarketplaceHost = host === 'marketplace.thenewfuse.com';

  return isMarketplaceHost ? (
    <Suspense fallback={<LoadingFallback name="Marketplace" />}>
      <MarketplacePublicPage />
    </Suspense>
  ) : (
    <RedirectToStatic to="/" />
  );
};

const RequireMemberAccess = ({ children }: { children: ReactNode }) => (
  <RequireAuth>
    <RequireMembership>{children}</RequireMembership>
  </RequireAuth>
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
      '/marketplace',
      '/visualizations',
      '/visualizations/terminals',
      '/terminals',
      '/product-map',
      '/capabilities',
      '/design-system',
      '/app.html',
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
      {/* Primary Universal Navigation */}
      <Suspense fallback={<div className="h-16 bg-slate-950 border-b border-white/10" />}>
        {!location.pathname.startsWith('/auth') &&
          !location.pathname.startsWith('/onboarding') &&
          !['/404', '/login', '/register'].includes(location.pathname) &&
          !hasOwnLayout &&
          isPublicRoute && <SmartNavigation />}
      </Suspense>

      <Suspense fallback={<LoadingFallback name="Layout" />}>
        <Layout>
          <Suspense fallback={<LoadingFallback name="Page" />}>
            <Routes>
              {/* Core Routes - Root switches based on hostname (marketplace vs main landing) */}
              <Route path="/" element={<MarketplaceRootRoute />} />
              <Route path="/app.html" element={<Navigate to="/dashboard" replace />} />
              <Route path="/home" element={<RedirectToStatic to="/" />} />
              {LEGACY_REDIRECTS.map((redirect) => (
                <Route
                  key={`legacy-redirect:${redirect.from}`}
                  path={redirect.from}
                  element={<Navigate to={redirect.to} replace />}
                />
              ))}

              {/* Protected Core Routes */}
              <Route
                path="/dashboard"
                element={
                  <RequireMemberAccess>
                    <Dashboard />
                  </RequireMemberAccess>
                }
              />
              <Route
                path="/dashboard/architecture"
                element={
                  <RequireMemberAccess>
                    <Dashboard />
                  </RequireMemberAccess>
                }
              />
              <Route
                path="/dashboard/observability"
                element={
                  <RequireMemberAccess>
                    <Dashboard />
                  </RequireMemberAccess>
                }
              />
              <Route
                path="/dashboard/logs"
                element={
                  <RequireMemberAccess>
                    <Dashboard />
                  </RequireMemberAccess>
                }
              />
              <Route
                path="/sophisticated-hub"
                element={
                  <RequireMemberAccess>
                    <SophisticatedTNFHub />
                  </RequireMemberAccess>
                }
              />
              <Route
                path="/launchpad" element={<LaunchpadDashboard />} />
              <Route path="/hub"
                element={
                  <RequireMemberAccess>
                    <Suspense fallback={<LoadingFallback name="Hub" />}>
                      <ModernHub />
                    </Suspense>
                  </RequireMemberAccess>
                }
              />

              {/* Public Marketplace */}
              <Route path="/marketplace" element={<MarketplacePublicPage />} />
              <Route path="/product-map" element={<MarketplacePublicPage />} />
              <Route path="/capabilities" element={<MarketplacePublicPage />} />
              <Route path="/platform" element={<Navigate to="/product-map" replace />} />

              {/* Admin Marketplace Console */}
              <Route
                path="/admin/marketplace"
                element={
                  <RequireAuth>
                    <RequirePermission roles={['SUPER_ADMIN']}>
                      <MarketplaceDashboard />
                    </RequirePermission>
                  </RequireAuth>
                }
              />

              {/* Resources Marketplace */}
              <Route
                path="/resources"
                element={
                  <RequireMemberAccess>
                    <ResourcesDashboard />
                  </RequireMemberAccess>
                }
              />

              {/* All routes using LazyPage for now to avoid import issues */}
              <Route
                path="/multi-agent-chat"
                element={
                  <RequireMemberAccess>
                    <MultiAgentChat />
                  </RequireMemberAccess>
                }
              />
              <Route
                path="/ai-portal"
                element={
                  <RequireMemberAccess>
                    <AIAgentDashboard />
                  </RequireMemberAccess>
                }
              />
              <Route
                path="/chat"
                element={
                  <RequireMemberAccess>
                    <ChatPage />
                  </RequireMemberAccess>
                }
              />
              <Route
                path="/ai-agents"
                element={
                  <RequireMemberAccess>
                    <AIAgentRegistration />
                  </RequireMemberAccess>
                }
              />
              <Route
                path="/agent-builder"
                element={
                  <RequireMemberAccess>
                    <UnifiedAgentCreator />
                  </RequireMemberAccess>
                }
              />
              <Route
                path="/agent-management"
                element={
                  <RequireMemberAccess>
                    <ErrorBoundary>
                      <AgentsPage />
                    </ErrorBoundary>
                  </RequireMemberAccess>
                }
              />
              <Route
                path="/agents"
                element={
                  <RequireMemberAccess>
                    <ErrorBoundary>
                      <AgentsPage />
                    </ErrorBoundary>
                  </RequireMemberAccess>
                }
              />
              <Route
                path="/agents/new"
                element={
                  <RequireMemberAccess>
                    <Suspense fallback={<LoadingFallback name="Agent Creator" />}>
                      <UnifiedAgentCreator />
                    </Suspense>
                  </RequireMemberAccess>
                }
              />
              <Route
                path="/agents/:id"
                element={
                  <RequireMemberAccess>
                    <AgentDetail />
                  </RequireMemberAccess>
                }
              />
              <Route
                path="/agents/:id/identity"
                element={
                  <RequireMemberAccess>
                    <AgentIdentity />
                  </RequireMemberAccess>
                }
              />
              <Route
                path="/observatory"
                element={
                  <RequirePermission roles={['SUPER_ADMIN']}>
                    <SystemObservatory />
                  </RequirePermission>
                }
              />
              <Route
                path="/command-center"
                element={
                  <RequirePermission roles={['SUPER_ADMIN']}>
                    <CommandCore />
                  </RequirePermission>
                }
              />
              <Route
                path="/agents/onboard"
                element={
                  <Suspense fallback={<LoadingFallback name="Agent Onboarding" />}>
                    <AgentOnboardPage />
                  </Suspense>
                }
              />
              <Route
                path="/agents/nft-marketplace"
                element={
                  <RequireMemberAccess>
                    <NFTMarketplacePage />
                  </RequireMemberAccess>
                }
              />
              <Route
                path="/agents/revenue-dashboard"
                element={
                  <RequireMemberAccess>
                    <RevenueDashboardPage />
                  </RequireMemberAccess>
                }
              />
              <Route
                path="/workspace/overview"
                element={
                  <RequireMemberAccess>
                    <WorkspaceOverview />
                  </RequireMemberAccess>
                }
              />
              <Route
                path="/workspace/analytics"
                element={
                  <RequireMemberAccess>
                    <WorkspaceAnalytics />
                  </RequireMemberAccess>
                }
              />
              <Route
                path="/workspace/members"
                element={
                  <RequireMemberAccess>
                    <WorkspaceMembers />
                  </RequireMemberAccess>
                }
              />
              <Route
                path="/workspace/settings"
                element={
                  <RequireMemberAccess>
                    <WorkspaceSettings />
                  </RequireMemberAccess>
                }
              />
              <Route
                path="/tasks"
                element={
                  <RequireMemberAccess>
                    <TasksPage />
                  </RequireMemberAccess>
                }
              />
              {/* Workflow Routes */}
              <Route
                path="/workflows"
                element={
                  <RequireMemberAccess>
                    <Workflows />
                  </RequireMemberAccess>
                }
              />
              <Route
                path="/workflows/builder"
                element={
                  <RequireMemberAccess>
                    <WorkflowBuilder />
                  </RequireMemberAccess>
                }
              />
              <Route
                path="/workflows/executions"
                element={
                  <RequireMemberAccess>
                    <WorkflowExecutionPage />
                  </RequireMemberAccess>
                }
              />
              <Route
                path="/workflows/:id"
                element={
                  <RequireMemberAccess>
                    <WorkflowDetailPage />
                  </RequireMemberAccess>
                }
              />
              <Route
                path="/workflows/:id/execution"
                element={
                  <RequireMemberAccess>
                    <WorkflowExecutionPage />
                  </RequireMemberAccess>
                }
              />
              <Route
                path="/workflows/console"
                element={
                  <RequireMemberAccess>
                    <ExecutionConsole />
                  </RequireMemberAccess>
                }
              />
              <Route
                path="/workflows/advanced-builder"
                element={
                  <RequireMemberAccess>
                    <WorkflowEditorWrapper />
                  </RequireMemberAccess>
                }
              />
              <Route
                path="/workflows/templates"
                element={
                  <RequireMemberAccess>
                    <WorkflowTemplatesPage />
                  </RequireMemberAccess>
                }
              />
              <Route
                path="/workflows-enhanced"
                element={
                  <RequireMemberAccess>
                    <WorkflowsEnhancedPage />
                  </RequireMemberAccess>
                }
              />
              <Route
                path="/workflows/detail"
                element={
                  <RequireMemberAccess>
                    <WorkflowDetailPage />
                  </RequireMemberAccess>
                }
              />
              <Route
                path="/workflows/execution"
                element={
                  <RequireMemberAccess>
                    <WorkflowExecutionPage />
                  </RequireMemberAccess>
                }
              />
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
                path="/admin/control-panel"
                element={
                  <RequirePermission roles={['SUPER_ADMIN']}>
                    <SuperAdminControlPanel />
                  </RequirePermission>
                }
              />
              <Route
                path="/nexus"
                element={
                  <RequirePermission roles={['SUPER_ADMIN']}>
                    <Suspense fallback={<LoadingFallback name="Nexus 3D" />}>
                      <NexusVisualizer />
                    </Suspense>
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

              {/* TNF Hosted Spaces */}
              <Route
                path="/spaces"
                element={
                  <RequireMemberAccess>
                    <SpacesOverview />
                  </RequireMemberAccess>
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
                path="/perpetual-status" element={<PerpetualStatus />} />
              <Route path="/admin/workspaces"
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
              <Route
                path="/admin/openclaw-security"
                element={
                  <RequirePermission roles={['SUPER_ADMIN']}>
                    <OpenClawSecurity />
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
                  <RequireAuth>
                    <RequirePermission roles={['AGENCY_OWNER', 'AGENCY_ADMIN', 'AGENCY_MANAGER']}>
                      <AgencyDashboard />
                    </RequirePermission>
                  </RequireAuth>
                }
              />
              <Route
                path="/agency/onboard"
                element={
                  <RequireAuth>
                    <AgencyOnboarding />
                  </RequireAuth>
                }
              />

              {/* Other routes */}
              <Route
                path="/mcp-hub"
                element={
                  <RequireMemberAccess>
                    <MCPHub />
                  </RequireMemberAccess>
                }
              />
              <Route
                path="/knowledge-hub"
                element={
                  <RequireMemberAccess>
                    <KnowledgeHub />
                  </RequireMemberAccess>
                }
              />
              <Route
                path="/a2a-control"
                element={
                  <RequireMemberAccess>
                    <A2AControl />
                  </RequireMemberAccess>
                }
              />
              <Route
                path="/settings"
                element={
                  <RequireMemberAccess>
                    <Settings />
                  </RequireMemberAccess>
                }
              />
              <Route
                path="/settings/general"
                element={
                  <RequireMemberAccess>
                    <SettingsGeneral />
                  </RequireMemberAccess>
                }
              />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route
                path="/components"
                element={
                  <RequireMemberAccess>
                    <ComponentsShowcase />
                  </RequireMemberAccess>
                }
              />
              <Route
                path="/timeline-demo"
                element={
                  <RequireMemberAccess>
                    <TimelineDemo />
                  </RequireMemberAccess>
                }
              />
              <Route
                path="/graph-demo"
                element={
                  <RequireMemberAccess>
                    <GraphDemo />
                  </RequireMemberAccess>
                }
              />
              <Route
                path="/frontend-showcase"
                element={
                  <RequirePermission roles={['SUPER_ADMIN']}>
                    <FrontendShowcasePage />
                  </RequirePermission>
                }
              />
              <Route
                path="/debug"
                element={
                  <RequirePermission roles={['SUPER_ADMIN']}>
                    <DebugPageComponent />
                  </RequirePermission>
                }
              />
              <Route
                path="/build-info"
                element={
                  <RequirePermission roles={['SUPER_ADMIN']}>
                    <BuildInfoPage />
                  </RequirePermission>
                }
              />
              <Route
                path="/debug-routing"
                element={
                  <RequirePermission roles={['SUPER_ADMIN']}>
                    <DebugRoutingComponent />
                  </RequirePermission>
                }
              />
              <Route
                path="/all-pages"
                element={
                  <RequirePermission roles={['SUPER_ADMIN']}>
                    <AllPages />
                  </RequirePermission>
                }
              />
              <Route
                path="/analytics"
                element={
                  <RequireMemberAccess>
                    <Analytics />
                  </RequireMemberAccess>
                }
              />

              {/* Suggestions Routes */}
              <Route
                path="/suggestions"
                element={
                  <RequireMemberAccess>
                    <SuggestionsPage />
                  </RequireMemberAccess>
                }
              />
              <Route
                path="/suggestions/new"
                element={
                  <RequireMemberAccess>
                    <NewSuggestionPage />
                  </RequireMemberAccess>
                }
              />
              <Route
                path="/suggestions/:id"
                element={
                  <RequireMemberAccess>
                    <SuggestionDetailPage />
                  </RequireMemberAccess>
                }
              />
              <Route
                path="/goals"
                element={
                  <RequireMemberAccess>
                    <GoalsPage />
                  </RequireMemberAccess>
                }
              />
              <Route
                path="/goals/:id"
                element={
                  <RequireMemberAccess>
                    <GoalDetailPage />
                  </RequireMemberAccess>
                }
              />
              <Route
                path="/plans"
                element={
                  <RequireMemberAccess>
                    <PlansPage />
                  </RequireMemberAccess>
                }
              />
              <Route
                path="/plans/:id"
                element={
                  <RequireMemberAccess>
                    <PlanDetailPage />
                  </RequireMemberAccess>
                }
              />
              <Route
                path="/timeline"
                element={
                  <RequireMemberAccess>
                    <TimelinePage />
                  </RequireMemberAccess>
                }
              />
              <Route
                path="/macro-timeline"
                element={
                  <RequireMemberAccess>
                    <MacroTimelinePage />
                  </RequireMemberAccess>
                }
              />
              <Route
                path="/timeline/module"
                element={
                  <RequireMemberAccess>
                    <TimelineModulePage />
                  </RequireMemberAccess>
                }
              />

              {/* Admin routes have been consolidated above with permission guards */}

              {/* Enhanced Auth Routes */}
              <Route path="/auth" element={<AuthIndexPage />} />
              <Route path="/auth/login" element={<LoginPage />} />
              <Route path="/auth/register" element={<RegisterPage />} />
              <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
              <Route path="/auth/sso" element={<SSOPage />} />
              <Route path="/auth/google-callback" element={<GoogleCallbackPage />} />
              <Route path="/auth/google/callback" element={<GoogleCallbackPage />} />
              <Route path="/auth/callback" element={<OAuthCallbackPage />} />
              <Route path="/auth/oauth-callback" element={<OAuthCallbackPage />} />

              {/* Enhanced Landing Routes */}
              <Route path="/landing" element={<RedirectToStatic to="/" />} />
              <Route path="/about" element={<Navigate to="/brand" replace />} />
              <Route path="/features" element={<RedirectToStatic to="/#features" />} />
              <Route path="/pricing" element={<RedirectToStatic to="/#pricing" />} />
              <Route path="/community" element={<CommunityHubPage />} />
              <Route path="/membership" element={<MembershipPage />} />
              <Route path="/support" element={<SupportPage />} />
              <Route path="/contact" element={<SupportPage />} />
              <Route path="/onboarding" element={<OnboardingFlowPage />} />
              <Route path="/docs" element={<DocsPage />} />
              <Route path="/docs/*" element={<DocsPage />} />
              <Route path="/visualizations" element={<VisualizationsPage />} />
              <Route path="/visualizations/terminals" element={<TerminalGraphPage />} />
              <Route path="/terminals" element={<TerminalGraphPage />} />
              <Route path="/connect" element={<ConnectExtensionPage />} />
              <Route path="/legal/privacy" element={<PrivacyPolicyPage />} />
              <Route path="/legal/terms" element={<TermsOfServicePage />} />
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
              <Route
                path="/workspace-chat"
                element={
                  <RequireMemberAccess>
                    <WorkspaceChatPage />
                  </RequireMemberAccess>
                }
              />

              {/* Enhanced Task Routes */}
              <Route
                path="/tasks/new"
                element={
                  <RequireMemberAccess>
                    <NewTaskPage />
                  </RequireMemberAccess>
                }
              />
              <Route
                path="/tasks/:id"
                element={
                  <RequireMemberAccess>
                    <TaskDetailPage />
                  </RequireMemberAccess>
                }
              />
              <Route
                path="/tasks/:id/edit"
                element={
                  <RequireMemberAccess>
                    <TaskEditPage />
                  </RequireMemberAccess>
                }
              />

              {/* Enhanced Dashboard Routes */}
              <Route
                path="/dashboard/agents"
                element={
                  <RequireMemberAccess>
                    <AgentDashboard />
                  </RequireMemberAccess>
                }
              />
              <Route
                path="/dashboard/agents/new"
                element={
                  <RequireMemberAccess>
                    <UnifiedAgentCreator />
                  </RequireMemberAccess>
                }
              />
              <Route
                path="/dashboard/agents/:id"
                element={
                  <RequireMemberAccess>
                    <AgentDetail />
                  </RequireMemberAccess>
                }
              />

              {/* Enhanced Settings Routes */}
              <Route
                path="/settings/appearance"
                element={
                  <RequireMemberAccess>
                    <SettingsAppearance />
                  </RequireMemberAccess>
                }
              />
              <Route
                path="/settings/notifications"
                element={
                  <RequireMemberAccess>
                    <SettingsNotifications />
                  </RequireMemberAccess>
                }
              />
              <Route
                path="/settings/security"
                element={
                  <RequireMemberAccess>
                    <SettingsSecurity />
                  </RequireMemberAccess>
                }
              />
              <Route
                path="/settings/api"
                element={
                  <RequireMemberAccess>
                    <SettingsAPI />
                  </RequireMemberAccess>
                }
              />
              <Route
                path="/general-settings"
                element={
                  <RequireMemberAccess>
                    <GeneralSettings />
                  </RequireMemberAccess>
                }
              />
              <Route
                path="/general-settings/embedding"
                element={
                  <RequireMemberAccess>
                    <GeneralSettingsEmbeddingPage />
                  </RequireMemberAccess>
                }
              />

              {/* Enhanced Component Routes */}
              <Route
                path="/frontend-showcase"
                element={
                  <RequirePermission roles={['SUPER_ADMIN']}>
                    <FrontendShowcasePage />
                  </RequirePermission>
                }
              />
              <Route
                path="/layout-example"
                element={
                  <RequirePermission roles={['SUPER_ADMIN']}>
                    <LayoutExamples />
                  </RequirePermission>
                }
              />
              <Route
                path="/simple-test"
                element={
                  <RequirePermission roles={['SUPER_ADMIN']}>
                    <SimpleTestPage />
                  </RequirePermission>
                }
              />

              {/* Additional Routes */}
              <Route
                path="/test"
                element={
                  <RequirePermission roles={['SUPER_ADMIN']}>
                    <TestPage />
                  </RequirePermission>
                }
              />
              <Route path="/unauthorized" element={<UnauthorizedPage />} />
              <Route
                path="/ai-agent-portal"
                element={
                  <RequireMemberAccess>
                    <AIAgentRegistration />
                  </RequireMemberAccess>
                }
              />

              {/* Critical Missing Routes */}
              <Route
                path="/dashboard/analytics"
                element={
                  <RequireMemberAccess>
                    <Analytics />
                  </RequireMemberAccess>
                }
              />
              <Route
                path="/dashboard/settings"
                element={
                  <RequireMemberAccess>
                    <Dashboard />
                  </RequireMemberAccess>
                }
              />
              <Route
                path="/components-showcase"
                element={
                  <RequirePermission roles={['SUPER_ADMIN']}>
                    <ComponentsShowcase />
                  </RequirePermission>
                }
              />
              <Route path="/not-found" element={<NotFound />} />

              {/* Preview Routes */}
              <Route path="/preview/onboarding" element={<OnboardingPreviewPage />} />

              {/* Remaining Specialized Settings Routes */}
              <Route
                path="/workspace-settings/llm-selection"
                element={
                  <RequireMemberAccess>
                    <WorkspaceLLMSelectionPage />
                  </RequireMemberAccess>
                }
              />
              <Route
                path="/workspace-settings/chat-model"
                element={
                  <RequireMemberAccess>
                    <WorkspaceLLMSelectionPage />
                  </RequireMemberAccess>
                }
              />
              <Route
                path="/workspace-settings/agent-model"
                element={
                  <RequireMemberAccess>
                    <AgentModelSelectionPage
                      provider="default"
                      workspace={{ agentModel: 'default' }}
                      setHasChanges={() => {}}
                    />
                  </RequireMemberAccess>
                }
              />

              {/* Admin Tools Routes */}
              <Route
                path="/admin/agents/skills"
                element={
                  <RequirePermission roles={['SUPER_ADMIN']}>
                    <AdminAgentSkillsPage />
                  </RequirePermission>
                }
              />
              <Route
                path="/admin/agents/web-search"
                element={
                  <RequirePermission roles={['SUPER_ADMIN']}>
                    <Suspense fallback={<LoadingFallback name="Web Search Selection" />}>
                      <WebSearchSelection />
                    </Suspense>
                  </RequirePermission>
                }
              />

              {/* Main workspace page */}
              <Route
                path="/main"
                element={
                  <RequireMemberAccess>
                    <MainPage />
                  </RequireMemberAccess>
                }
              />

              {/* Live View - Real-time AI browser activity */}
              <Route
                path="/live-view"
                element={
                  <RequirePermission roles={['SUPER_ADMIN']}>
                    <Suspense fallback={<LoadingFallback name="Live View" />}>
                      <LiveViewPage />
                    </Suspense>
                  </RequirePermission>
                }
              />

              {/* AI Command Center - Multiple AI chats in iframes */}
              <Route
                path="/ai-command-center"
                element={
                  <RequirePermission roles={['SUPER_ADMIN']}>
                    <Suspense fallback={<LoadingFallback name="AI Command Center" />}>
                      <AICommandCenter />
                    </Suspense>
                  </RequirePermission>
                }
              />

              <Route
                path="/admin/layout"
                element={
                  <RequirePermission roles={['SUPER_ADMIN']}>
                    <LazyPage name="Admin Layout" path="/admin/layout" />
                  </RequirePermission>
                }
              />
              <Route
                path="/multi-agent-chat-demo"
                element={
                  <RequirePermission roles={['SUPER_ADMIN']}>
                    <MultiAgentChat />
                  </RequirePermission>
                }
              />
              <Route
                path="/api/admin/database"
                element={
                  <RequirePermission roles={['SUPER_ADMIN']}>
                    <LazyPage name="Admin Database API" path="/api/admin/database" />
                  </RequirePermission>
                }
              />
              <Route
                path="/api/admin/features"
                element={
                  <RequirePermission roles={['SUPER_ADMIN']}>
                    <LazyPage name="Admin Features API" path="/api/admin/features" />
                  </RequirePermission>
                }
              />
              <Route
                path="/package/dashboard"
                element={
                  <RequirePermission roles={['SUPER_ADMIN']}>
                    <LazyPage name="Package Dashboard" path="/package/dashboard" />
                  </RequirePermission>
                }
              />
              <Route
                path="/package/login"
                element={
                  <RequirePermission roles={['SUPER_ADMIN']}>
                    <LazyPage name="Package Login" path="/package/login" />
                  </RequirePermission>
                }
              />
              <Route
                path="/package/agents"
                element={
                  <RequirePermission roles={['SUPER_ADMIN']}>
                    <LazyPage name="Package Agents" path="/package/agents" />
                  </RequirePermission>
                }
              />
              <Route
                path="/package/workflows"
                element={
                  <RequirePermission roles={['SUPER_ADMIN']}>
                    <LazyPage name="Package Workflows" path="/package/workflows" />
                  </RequirePermission>
                }
              />
              <Route
                path="/profile"
                element={
                  <RequireMemberAccess>
                    <Suspense fallback={<LoadingFallback name="User Profile" />}>
                      <UserProfilePage />
                    </Suspense>
                  </RequireMemberAccess>
                }
              />
              <Route
                path="/user/profile"
                element={
                  <RequireMemberAccess>
                    <Suspense fallback={<LoadingFallback name="User Profile" />}>
                      <UserProfilePage />
                    </Suspense>
                  </RequireMemberAccess>
                }
              />

              {/* HTML prototype routes (for reference) */}
              <Route
                path="/html/dashboard"
                element={
                  <RequirePermission roles={['SUPER_ADMIN']}>
                    <LazyPage name="HTML Dashboard Prototype" path="/html/dashboard" />
                  </RequirePermission>
                }
              />
              <Route
                path="/html/admin"
                element={
                  <RequirePermission roles={['SUPER_ADMIN']}>
                    <LazyPage name="HTML Admin Prototype" path="/html/admin" />
                  </RequirePermission>
                }
              />
              <Route
                path="/html/agents"
                element={
                  <RequirePermission roles={['SUPER_ADMIN']}>
                    <LazyPage name="HTML Agents Prototype" path="/html/agents" />
                  </RequirePermission>
                }
              />
              <Route
                path="/html/chat"
                element={
                  <RequirePermission roles={['SUPER_ADMIN']}>
                    <LazyPage name="HTML Chat Prototype" path="/html/chat" />
                  </RequirePermission>
                }
              />
              <Route
                path="/html/tasks"
                element={
                  <RequirePermission roles={['SUPER_ADMIN']}>
                    <LazyPage name="HTML Tasks Prototype" path="/html/tasks" />
                  </RequirePermission>
                }
              />
              <Route
                path="/html/workflows"
                element={
                  <RequirePermission roles={['SUPER_ADMIN']}>
                    <LazyPage name="HTML Workflows Prototype" path="/html/workflows" />
                  </RequirePermission>
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
                  <Suspense fallback={<LoadingFallback name="Page Not Found" />}>
                    <NotFound />
                  </Suspense>
                }
              />
            </Routes>
          </Suspense>
        </Layout>
      </Suspense>
    </div>
  );
}
