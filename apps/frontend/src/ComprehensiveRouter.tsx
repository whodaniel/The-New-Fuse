import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { LEGACY_REDIRECTS } from './config/legacyRedirects';
// Lazy load layouts for code splitting
const PremiumLayout = lazy(() => import('./layouts/PremiumLayout'));
const PublicLayout = lazy(() => import('./layouts/PublicLayout'));

// Core components (keep loaded)
import LoginPage from './pages/auth/Login';
import RegisterPage from './pages/auth/Register';

import ErrorBoundary from './components/ErrorBoundary';
import RequireAuth from './components/RequireAuth';
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
const TNFCommandCenter = lazy(() => import('./pages/TNFCommandCenter'));
const SystemHealth = lazy(() => import('./pages/Admin/SystemHealth'));
const AgentsPage = lazy(() => import('./pages/AgentsRevolution')); // REVOLUTIONARY NEW DESIGN
const AgentDetail = lazy(() => import('./pages/Agents/Detail'));
const Workflows = lazy(() => import('./pages/Workflows.tsx'));
const WorkflowBuilder = lazy(() => import('./pages/workflow-pages/Builder'));
const WorkflowEditorWrapper = lazy(() => import('./components/WorkflowEditor'));
const Analytics = lazy(() => import('./pages/dashboard/Analytics'));
const Dashboard = lazy(() =>
  import('./components/Dashboard').then((module) => ({ default: module.Dashboard }))
);
const Settings = lazy(() => import('./pages/Settings'));
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

// Auth components
const AuthIndexPage = lazy(() => import('./pages/auth'));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPassword'));
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPassword'));
const SSOPage = lazy(() => import('./pages/auth/SSO'));
const GoogleCallbackPage = lazy(() => import('./pages/auth/GoogleCallback'));
const OAuthCallbackPage = lazy(() => import('./pages/auth/OAuthCallback'));

// Landing components
const LandingRevolutionPage = lazy(() => import('./pages/LandingRevolution'));
const FeaturesPage = lazy(() => import('./pages/Features'));
const OnboardingFlowPage = lazy(() => import('./pages/OnboardingFlow'));
const PricingPage = lazy(() => import('./pages/Pricing'));
const CommunityHubPage = lazy(() => import('./pages/Community/CommunityHub'));
const SupportPage = lazy(() => import('./pages/Support'));
const BrandIdentityPage = lazy(() => import('./pages/BrandIdentity'));
const DocsPage = lazy(() => import('./pages/Docs'));
const BlogPage = lazy(() => import('./pages/Blog').then((module) => ({ default: module.Blog })));
const ConnectExtensionPage = lazy(() => import('./pages/ConnectExtension'));

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
const DashboardSettings = lazy(() => import('./pages/dashboard/DashboardSettings'));
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
      '/product-map',
      '/capabilities',
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
              {/* Core Routes */}
              <Route path="/" element={<LandingRevolutionPage />} />
              <Route path="/home" element={<AllPages />} />
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
                  <RequireAuth>
                    <Dashboard />
                  </RequireAuth>
                }
              />
              <Route
                path="/sophisticated-hub"
                element={
                  <RequireAuth>
                    <SophisticatedTNFHub />
                  </RequireAuth>
                }
              />
              <Route
                path="/hub"
                element={
                  <RequireAuth>
                    <Suspense fallback={<LoadingFallback name="Hub" />}>
                      <ModernHub />
                    </Suspense>
                  </RequireAuth>
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
                    <RequirePermission roles={['ADMIN', 'SUPER_ADMIN']}>
                      <MarketplaceDashboard />
                    </RequirePermission>
                  </RequireAuth>
                }
              />

              {/* Resources Marketplace */}
              <Route
                path="/resources"
                element={
                  <RequireAuth>
                    <ResourcesDashboard />
                  </RequireAuth>
                }
              />

              {/* All routes using LazyPage for now to avoid import issues */}
              <Route
                path="/multi-agent-chat"
                element={
                  <RequireAuth>
                    <MultiAgentChat />
                  </RequireAuth>
                }
              />
              <Route
                path="/ai-portal"
                element={
                  <RequireAuth>
                    <AIAgentDashboard />
                  </RequireAuth>
                }
              />
              <Route
                path="/chat"
                element={
                  <RequireAuth>
                    <ChatPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/ai-agents"
                element={
                  <RequireAuth>
                    <AIAgentRegistration />
                  </RequireAuth>
                }
              />
              <Route
                path="/agent-builder"
                element={
                  <RequireAuth>
                    <UnifiedAgentCreator />
                  </RequireAuth>
                }
              />
              <Route
                path="/agent-management"
                element={
                  <RequireAuth>
                    <ErrorBoundary>
                      <AgentsPage />
                    </ErrorBoundary>
                  </RequireAuth>
                }
              />
              <Route
                path="/agents"
                element={
                  <RequireAuth>
                    <ErrorBoundary>
                      <AgentsPage />
                    </ErrorBoundary>
                  </RequireAuth>
                }
              />
              <Route
                path="/agents/new"
                element={
                  <RequireAuth>
                    <Suspense fallback={<LoadingFallback name="Agent Creator" />}>
                      <UnifiedAgentCreator />
                    </Suspense>
                  </RequireAuth>
                }
              />
              <Route
                path="/agents/:id"
                element={
                  <RequireAuth>
                    <AgentDetail />
                  </RequireAuth>
                }
              />
              <Route
                path="/agents/:id/identity"
                element={
                  <RequireAuth>
                    <AgentIdentity />
                  </RequireAuth>
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
                    <TNFCommandCenter />
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
                  <RequireAuth>
                    <NFTMarketplacePage />
                  </RequireAuth>
                }
              />
              <Route
                path="/agents/revenue-dashboard"
                element={
                  <RequireAuth>
                    <RevenueDashboardPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/workspace/overview"
                element={
                  <RequireAuth>
                    <WorkspaceOverview />
                  </RequireAuth>
                }
              />
              <Route
                path="/workspace/analytics"
                element={
                  <RequireAuth>
                    <WorkspaceAnalytics />
                  </RequireAuth>
                }
              />
              <Route
                path="/workspace/members"
                element={
                  <RequireAuth>
                    <WorkspaceMembers />
                  </RequireAuth>
                }
              />
              <Route
                path="/workspace/settings"
                element={
                  <RequireAuth>
                    <WorkspaceSettings />
                  </RequireAuth>
                }
              />
              <Route
                path="/tasks"
                element={
                  <RequireAuth>
                    <TasksPage />
                  </RequireAuth>
                }
              />
              {/* Workflow Routes */}
              <Route
                path="/workflows"
                element={
                  <RequireAuth>
                    <Workflows />
                  </RequireAuth>
                }
              />
              <Route
                path="/workflows/builder"
                element={
                  <RequireAuth>
                    <WorkflowBuilder />
                  </RequireAuth>
                }
              />
              <Route
                path="/workflows/executions"
                element={
                  <RequireAuth>
                    <WorkflowExecutionPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/workflows/:id"
                element={
                  <RequireAuth>
                    <WorkflowDetailPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/workflows/:id/execution"
                element={
                  <RequireAuth>
                    <WorkflowExecutionPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/workflows/console"
                element={
                  <RequireAuth>
                    <ExecutionConsole />
                  </RequireAuth>
                }
              />
              <Route
                path="/workflows/advanced-builder"
                element={
                  <RequireAuth>
                    <WorkflowEditorWrapper />
                  </RequireAuth>
                }
              />
              <Route
                path="/workflows/templates"
                element={
                  <RequireAuth>
                    <WorkflowTemplatesPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/workflows-enhanced"
                element={
                  <RequireAuth>
                    <WorkflowsEnhancedPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/workflows/detail"
                element={
                  <RequireAuth>
                    <WorkflowDetailPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/workflows/execution"
                element={
                  <RequireAuth>
                    <WorkflowExecutionPage />
                  </RequireAuth>
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
                  <RequirePermission roles={['AGENCY_OWNER', 'AGENCY_ADMIN', 'AGENCY_MANAGER']}>
                    <AgencyDashboard />
                  </RequirePermission>
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
                  <RequireAuth>
                    <MCPHub />
                  </RequireAuth>
                }
              />
              <Route
                path="/knowledge-hub"
                element={
                  <RequireAuth>
                    <KnowledgeHub />
                  </RequireAuth>
                }
              />
              <Route
                path="/a2a-control"
                element={
                  <RequireAuth>
                    <A2AControl />
                  </RequireAuth>
                }
              />
              <Route
                path="/settings"
                element={
                  <RequireAuth>
                    <Settings />
                  </RequireAuth>
                }
              />
              <Route
                path="/settings/general"
                element={
                  <RequireAuth>
                    <GeneralSettings />
                  </RequireAuth>
                }
              />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route
                path="/components"
                element={
                  <RequireAuth>
                    <ComponentsShowcase />
                  </RequireAuth>
                }
              />
              <Route
                path="/timeline-demo"
                element={
                  <RequireAuth>
                    <TimelineDemo />
                  </RequireAuth>
                }
              />
              <Route
                path="/graph-demo"
                element={
                  <RequireAuth>
                    <GraphDemo />
                  </RequireAuth>
                }
              />
              <Route
                path="/frontend-showcase"
                element={
                  <RequireAuth>
                    <FrontendShowcasePage />
                  </RequireAuth>
                }
              />
              <Route
                path="/debug"
                element={
                  <RequireAuth>
                    <DebugPageComponent />
                  </RequireAuth>
                }
              />
              <Route
                path="/build-info"
                element={
                  <RequireAuth>
                    <BuildInfoPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/debug-routing"
                element={
                  <RequireAuth>
                    <DebugRoutingComponent />
                  </RequireAuth>
                }
              />
              <Route
                path="/all-pages"
                element={
                  <RequireAuth>
                    <AllPages />
                  </RequireAuth>
                }
              />
              <Route
                path="/analytics"
                element={
                  <RequireAuth>
                    <Analytics />
                  </RequireAuth>
                }
              />

              {/* Suggestions Routes */}
              <Route
                path="/suggestions"
                element={
                  <RequireAuth>
                    <SuggestionsPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/suggestions/new"
                element={
                  <RequireAuth>
                    <NewSuggestionPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/suggestions/:id"
                element={
                  <RequireAuth>
                    <SuggestionDetailPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/goals"
                element={
                  <RequireAuth>
                    <GoalsPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/goals/:id"
                element={
                  <RequireAuth>
                    <GoalDetailPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/plans"
                element={
                  <RequireAuth>
                    <PlansPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/plans/:id"
                element={
                  <RequireAuth>
                    <PlanDetailPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/timeline"
                element={
                  <RequireAuth>
                    <TimelinePage />
                  </RequireAuth>
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
              <Route path="/landing" element={<LandingRevolutionPage />} />
              <Route path="/features" element={<FeaturesPage />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/community" element={<CommunityHubPage />} />
              <Route path="/support" element={<SupportPage />} />
              <Route path="/contact" element={<SupportPage />} />
              <Route path="/onboarding" element={<OnboardingFlowPage />} />
              <Route path="/docs" element={<DocsPage />} />
              <Route path="/docs/*" element={<DocsPage />} />
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
                  <RequireAuth>
                    <WorkspaceChatPage />
                  </RequireAuth>
                }
              />

              {/* Enhanced Task Routes */}
              <Route
                path="/tasks/new"
                element={
                  <RequireAuth>
                    <NewTaskPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/tasks/:id"
                element={
                  <RequireAuth>
                    <TaskDetailPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/tasks/:id/edit"
                element={
                  <RequireAuth>
                    <TaskEditPage />
                  </RequireAuth>
                }
              />

              {/* Enhanced Dashboard Routes */}
              <Route
                path="/dashboard/agents"
                element={
                  <RequireAuth>
                    <AgentDashboard />
                  </RequireAuth>
                }
              />
              <Route
                path="/dashboard/agents/new"
                element={
                  <RequireAuth>
                    <UnifiedAgentCreator />
                  </RequireAuth>
                }
              />
              <Route
                path="/dashboard/agents/:id"
                element={
                  <RequireAuth>
                    <AgentDetail />
                  </RequireAuth>
                }
              />

              {/* Enhanced Settings Routes */}
              <Route
                path="/settings/appearance"
                element={
                  <RequireAuth>
                    <SettingsAppearance />
                  </RequireAuth>
                }
              />
              <Route
                path="/settings/notifications"
                element={
                  <RequireAuth>
                    <SettingsNotifications />
                  </RequireAuth>
                }
              />
              <Route
                path="/settings/security"
                element={
                  <RequireAuth>
                    <SettingsSecurity />
                  </RequireAuth>
                }
              />
              <Route
                path="/settings/api"
                element={
                  <RequireAuth>
                    <SettingsAPI />
                  </RequireAuth>
                }
              />
              <Route
                path="/general-settings"
                element={
                  <RequireAuth>
                    <GeneralSettings />
                  </RequireAuth>
                }
              />
              <Route
                path="/general-settings/embedding"
                element={
                  <RequireAuth>
                    <GeneralSettingsEmbeddingPage />
                  </RequireAuth>
                }
              />

              {/* Enhanced Component Routes */}
              <Route
                path="/frontend-showcase"
                element={
                  <RequireAuth>
                    <FrontendShowcasePage />
                  </RequireAuth>
                }
              />
              <Route
                path="/layout-example"
                element={
                  <RequireAuth>
                    <LayoutExamples />
                  </RequireAuth>
                }
              />
              <Route
                path="/simple-test"
                element={
                  <RequireAuth>
                    <SimpleTestPage />
                  </RequireAuth>
                }
              />

              {/* Additional Routes */}
              <Route
                path="/test"
                element={
                  <RequireAuth>
                    <TestPage />
                  </RequireAuth>
                }
              />
              <Route path="/unauthorized" element={<UnauthorizedPage />} />
              <Route
                path="/ai-agent-portal"
                element={
                  <RequireAuth>
                    <AIAgentRegistration />
                  </RequireAuth>
                }
              />

              {/* Critical Missing Routes */}
              <Route
                path="/dashboard/analytics"
                element={
                  <RequireAuth>
                    <Analytics />
                  </RequireAuth>
                }
              />
              <Route
                path="/dashboard/settings"
                element={
                  <RequireAuth>
                    <DashboardSettings />
                  </RequireAuth>
                }
              />
              <Route
                path="/components-showcase"
                element={
                  <RequireAuth>
                    <ComponentsShowcase />
                  </RequireAuth>
                }
              />
              <Route path="/not-found" element={<NotFound />} />

              {/* Preview Routes */}
              <Route path="/preview/onboarding" element={<OnboardingPreviewPage />} />

              {/* Remaining Specialized Settings Routes */}
              <Route
                path="/workspace-settings/llm-selection"
                element={<WorkspaceLLMSelectionPage />}
              />
              <Route
                path="/workspace-settings/chat-model"
                element={<WorkspaceLLMSelectionPage />}
              />
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
              <Route path="/main" element={<MainPage />} />

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
                element={<LazyPage name="Admin Layout" path="/admin/layout" />}
              />
              <Route path="/multi-agent-chat-demo" element={<MultiAgentChat />} />
              <Route
                path="/api/admin/database"
                element={<LazyPage name="Admin Database API" path="/api/admin/database" />}
              />
              <Route
                path="/api/admin/features"
                element={<LazyPage name="Admin Features API" path="/api/admin/features" />}
              />
              <Route
                path="/package/dashboard"
                element={<LazyPage name="Package Dashboard" path="/package/dashboard" />}
              />
              <Route
                path="/package/login"
                element={<LazyPage name="Package Login" path="/package/login" />}
              />
              <Route
                path="/package/agents"
                element={<LazyPage name="Package Agents" path="/package/agents" />}
              />
              <Route
                path="/package/workflows"
                element={<LazyPage name="Package Workflows" path="/package/workflows" />}
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

              {/* HTML prototype routes (for reference) */}
              <Route
                path="/html/dashboard"
                element={<LazyPage name="HTML Dashboard Prototype" path="/html/dashboard" />}
              />
              <Route
                path="/html/admin"
                element={<LazyPage name="HTML Admin Prototype" path="/html/admin" />}
              />
              <Route
                path="/html/agents"
                element={<LazyPage name="HTML Agents Prototype" path="/html/agents" />}
              />
              <Route
                path="/html/chat"
                element={<LazyPage name="HTML Chat Prototype" path="/html/chat" />}
              />
              <Route
                path="/html/tasks"
                element={<LazyPage name="HTML Tasks Prototype" path="/html/tasks" />}
              />
              <Route
                path="/html/workflows"
                element={<LazyPage name="HTML Workflows Prototype" path="/html/workflows" />}
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
