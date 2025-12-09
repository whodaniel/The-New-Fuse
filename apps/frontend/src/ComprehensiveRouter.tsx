import { Suspense, lazy } from 'react';
import { Link, Route, Routes, useLocation } from 'react-router-dom';
import { PremiumLayout } from './layouts/PremiumLayout'; // Import PremiumLayout

// Core components (keep loaded)
import LoginPage from './pages/auth/Login';
import RegisterPage from './pages/auth/Register';

// Lazy load heavy components for better performance
const MultiAgentChat = lazy(() => import('./components/MultiAgentChat'));
const WorkspaceAnalytics = lazy(() => import('./pages/workspace/WorkspaceAnalytics'));
const WorkspaceSettings = lazy(() => import('./pages/workspace/Settings'));
const ComponentsShowcase = lazy(() => import('./pages/ComponentsShowcase'));
const TimelineDemo = lazy(() => import('./pages/timeline-demo'));
const GraphDemo = lazy(() =>
  import('./pages/graph-demo').then((module) => ({ default: module.GraphDemo }))
);
const AdminPanel = lazy(() => import('./pages/Admin/AdminPanel'));
const TasksPage = lazy(() => import('./pages/Tasks/TasksPage'));
const AgentsPage = lazy(() => import('./pages/Agents')); // Updated path
const AgentDetail = lazy(() => import('./pages/Agents/Detail'));
const Workflows = lazy(() => import('./pages/Workflows'));
const WorkflowBuilder = lazy(() => import('./pages/workflow-pages/Builder'));
const WorkflowEditorWrapper = lazy(() => import('./components/WorkflowEditor'));
const Analytics = lazy(() => import('./pages/dashboard/Analytics'));
const Dashboard = lazy(() => import('./components/Dashboard').then(module => ({ default: module.Dashboard }))); // Updated to point to updated component
const Settings = lazy(() => import('./pages/Settings'));
const SettingsAppearance = lazy(() => import('./pages/settings/Appearance'));
const SettingsNotifications = lazy(() => import('./pages/settings/Notifications'));
const SettingsSecurity = lazy(() => import('./pages/settings/Security'));
const SettingsAPI = lazy(() => import('./pages/settings/API'));
const WorkspaceOverview = lazy(() => import('./pages/workspace/Overview'));
const WorkspaceMembers = lazy(() => import('./pages/workspace/Members'));
const WorkspaceChatPage = lazy(() => import('./pages/WorkspaceChat'));
const NFTMarketplacePage = lazy(() => import('./pages/Agents/NFTMarketplacePage'));
const RevenueDashboardPage = lazy(() => import('./pages/Agents/RevenueDashboardPage'));
const UnifiedAgentCreator = lazy(() => import('./pages/Agents/UnifiedAgentCreator'));
const SophisticatedTNFHub = lazy(() => import('./pages/Hub/SophisticatedTNFHub'));
const ModernHub = lazy(() => import('./pages/Hub/ModernHub'));

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
import AllPages from './pages/AllPages';
import BuildInfoPage from './pages/BuildInfo';
import DebugPageComponent from './pages/Debug';
import DebugRoutingComponent from './pages/DebugRouting';
import TestPage from './pages/Test';

// Suggestions components
const SuggestionsPage = lazy(() => import('./pages/Suggestions'));
const NewSuggestionPage = lazy(() => import('./pages/Suggestions/New'));
const SuggestionDetailPage = lazy(() => import('./pages/Suggestions/Detail'));

// Additional Admin components
const AdminUserManagement = lazy(() => import('./pages/Admin/UserManagement'));
const AdminSystemHealth = lazy(() => import('./pages/Admin/SystemHealth'));
const AdminFeatureFlags = lazy(() => import('./pages/Admin/FeatureFlags'));
const AdminPortManagement = lazy(() => import('./pages/Admin/PortManagement'));

// Auth components
const AuthIndexPage = lazy(() => import('./pages/auth'));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPassword'));
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPassword'));
const SSOPage = lazy(() => import('./pages/auth/SSO'));
const GoogleCallbackPage = lazy(() => import('./pages/auth/GoogleCallback'));
const OAuthCallbackPage = lazy(() => import('./pages/auth/OAuthCallback'));

// Landing components
const LandingIndexPage = lazy(() => import('./pages/Landing'));
const LandingRedesignedPage = lazy(() => import('./pages/LandingRedesigned'));
const OnboardingFlowPage = lazy(() => import('./pages/OnboardingFlow'));

// Workspace components

// Task components
const TaskDetailPage = lazy(() => import('./pages/Tasks/Detail'));
const TaskEditPage = lazy(() => import('./pages/Tasks/Edit'));
const NewTaskPage = lazy(() => import('./pages/Tasks/New'));

// Additional pages
const UnauthorizedPage = lazy(() => import('./pages/Unauthorized'));
const AIAgentPortalPage = lazy(() => import('./pages/AIAgentPortal'));
const FrontendShowcasePage = lazy(() => import('./pages/FrontendShowcase'));
const SimpleTestPage = lazy(() => import('./pages/SimpleTest'));

// Chat pages
const ChatPage = lazy(() => import('./pages/chat/ChatPage'));

// Admin pages that exist
const AdminOnboardingPage = lazy(() => import('./pages/Admin/Onboarding'));
const AdminDashboardPage = lazy(() => import('./pages/Admin/Dashboard'));
const ExperimentalFeaturesPage = lazy(() =>
  import('./pages/Admin/ExperimentalFeatures/features').then((module) => ({
    default: module.default,
  }))
);

// Legal pages
const PrivacyPolicyPage = lazy(() => import('./pages/legal/PrivacyPolicy'));
const TermsOfServicePage = lazy(() => import('./pages/legal/TermsOfService'));

// Workspace pages
const WorkspaceLayoutPage = lazy(() => import('./pages/workspace/WorkspaceLayout'));
const WorkspaceIndexPage = lazy(() => import('./pages/workspace'));

// Additional component pages
const ComponentsNavPage = lazy(() => import('./pages/ComponentsNav'));
const HomePage = lazy(() => import('./pages/Home'));
const LandingPageAlt = lazy(() =>
  import('./pages/LandingPage').then((module) => ({ default: module.default }))
);
const SimpleLandingPage = lazy(() => import('./pages/SimpleLanding'));

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
const TasksPageComponent = lazy(() => import('./pages/Tasks/TasksPage'));
const GeneralSettingsPage = lazy(() => import('./pages/GeneralSettings'));
const GeneralSettingsEmbeddingPage = lazy(
  () => import('./pages/GeneralSettings/EmbeddingPreference')
);
const WorkflowTemplates = lazy(() => import('./pages/WorkflowTemplates'));
const GeneralSettings = lazy(() => import('./pages/GeneralSettings'));
const AdminSettings = lazy(() => import('./pages/Admin/AdminSettings'));
const WorkspaceManagement = lazy(() => import('./pages/Admin/WorkspaceManagement'));
const AgentDashboard = lazy(() => import('./pages/dashboard/AgentDashboard'));
const DashboardSettings = lazy(() => import('./pages/dashboard/DashboardSettings'));
const CommunityHub = lazy(() => import('./pages/Community/CommunityHub'));
const LayoutExamples = lazy(() => import('./pages/Layout/LayoutExamples'));
const AIAgentPortal = lazy(() => import('./pages/AIAgentPortal'));
const NotFound = lazy(() => import('./pages/NotFound'));
const UserProfilePage = lazy(() => import('./components/profile/UserProfilePage'));

// Main workspace page
const MainPage = lazy(() => import('./pages/Main'));

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

import SmartNavigation from './components/SmartNavigation';

// Remove the old ComprehensiveNavigation component and replace with SmartNavigation
export default function ComprehensiveRouter() {
  const location = useLocation();
  const isPublicRoute = ['/', '/login', '/register', '/landing', '/home'].includes(location.pathname) || location.pathname.startsWith('/auth');

  // Use PremiumLayout for authenticated routes
  const Layout = isPublicRoute ? 'div' : PremiumLayout;

  return (
    <div>
       {/* Conditional Navigation - only show SmartNavigation on public pages if needed,
           or we can let PremiumLayout handle it for auth pages */}
      {isPublicRoute && <SmartNavigation />}

      <Layout>
        <Suspense fallback={<LoadingFallback name="Page" />}>
          <Routes>
            {/* Core Routes */}
            <Route path="/" element={<LandingRedesignedPage />} />
            <Route path="/home" element={<LandingRedesignedPage />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/sophisticated-hub" element={<SophisticatedTNFHub />} />
            <Route
              path="/hub"
              element={
                <Suspense fallback={<LoadingFallback name="Hub" />}>
                  <ModernHub />
                </Suspense>
              }
            />

            {/* Resources Marketplace */}
            <Route path="/resources" element={<ResourcesDashboard />} />

            {/* All routes using LazyPage for now to avoid import issues */}
            <Route path="/multi-agent-chat" element={<MultiAgentChat />} />
            <Route path="/ai-portal" element={<AIAgentPortal />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/ai-agents" element={<AIAgentPortalPage />} />
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
            <Route path="/agents/nft-marketplace" element={<NFTMarketplacePage />} />
            <Route path="/agents/revenue-dashboard" element={<RevenueDashboardPage />} />
            <Route path="/workspace/overview" element={<WorkspaceOverview />} />
            <Route path="/workspace/analytics" element={<WorkspaceAnalytics />} />
            <Route path="/workspace/members" element={<WorkspaceMembers />} />
            <Route path="/workspace/settings" element={<WorkspaceSettings />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/workflows" element={<Workflows />} />
            <Route path="/workflows/builder" element={<WorkflowBuilder />} />
            <Route path="/workflows/advanced-builder" element={<WorkflowEditorWrapper />} />
            <Route path="/workflows/templates" element={<WorkflowTemplates />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/admin/users" element={<AdminUserManagement />} />
            <Route path="/admin/system-health" element={<AdminSystemHealth />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/settings/general" element={<GeneralSettings />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/components" element={<ComponentsShowcase />} />
            <Route path="/timeline-demo" element={<TimelineDemo />} />
            <Route path="/graph-demo" element={<GraphDemo />} />
            <Route path="/frontend-showcase" element={<FrontendShowcasePage />} />
            <Route path="/debug" element={<DebugPageComponent />} />
            <Route path="/build-info" element={<BuildInfoPage />} />
            <Route path="/debug-routing" element={<DebugRoutingComponent />} />
            <Route path="/all-pages" element={<AllPages />} />
            <Route path="/analytics" element={<Analytics />} />

            {/* Suggestions Routes */}
            <Route path="/suggestions" element={<SuggestionsPage />} />
            <Route path="/suggestions/new" element={<NewSuggestionPage />} />
            <Route path="/suggestions/:id" element={<SuggestionDetailPage />} />

            {/* Enhanced Admin Routes - Additional admin features */}
            <Route path="/admin/feature-flags" element={<AdminFeatureFlags />} />
            <Route path="/admin/port-management" element={<AdminPortManagement />} />
            <Route path="/admin/workspaces" element={<WorkspaceManagement />} />
            <Route path="/admin/settings" element={<AdminSettings />} />

            {/* Enhanced Auth Routes */}
            <Route path="/auth" element={<AuthIndexPage />} />
            <Route path="/auth/login" element={<LoginPage />} />
            <Route path="/auth/register" element={<RegisterPage />} />
            <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
            <Route path="/auth/sso" element={<SSOPage />} />
            <Route path="/auth/google-callback" element={<GoogleCallbackPage />} />
            <Route path="/auth/oauth-callback" element={<OAuthCallbackPage />} />

            {/* Enhanced Landing Routes */}
            <Route path="/landing" element={<LandingIndexPage />} />
            <Route path="/onboarding" element={<OnboardingFlowPage />} />

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

            {/* Enhanced Component Routes */}
            <Route path="/frontend-showcase" element={<FrontendShowcasePage />} />
            <Route path="/layout-example" element={<LayoutExamples />} />
            <Route path="/simple-test" element={<SimpleTestPage />} />

            {/* Additional Routes */}
            <Route path="/test" element={<TestPage />} />
            <Route path="/workflows/executions" element={<WorkflowExecutionPage />} />
            <Route path="/workflows/:id" element={<WorkflowDetailPage />} />
            <Route path="/workflows/:id/execution" element={<WorkflowExecutionPage />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />
            <Route path="/ai-agent-portal" element={<AIAgentPortalPage />} />

            {/* Critical Missing Routes */}
            <Route path="/dashboard/analytics" element={<Analytics />} />
            <Route path="/dashboard/settings" element={<DashboardSettings />} />
            <Route path="/components-showcase" element={<ComponentsShowcase />} />
            <Route path="/not-found" element={<NotFound />} />

            {/* High Priority Missing Routes - Using Actual Components */}
            <Route path="/chat-page" element={<ChatPage />} />
            <Route path="/workspace-chat" element={<WorkspaceChatPage />} />
            <Route path="/workspace/chat" element={<WorkspaceChatPage />} />
            <Route path="/workspace/layout" element={<WorkspaceLayoutPage />} />
            <Route path="/workspace" element={<WorkspaceIndexPage />} />

            {/* Admin Routes - Existing Components */}
            <Route path="/admin/onboarding" element={<AdminOnboardingPage />} />
            <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
            <Route path="/admin/experimental-features" element={<ExperimentalFeaturesPage />} />

            {/* Legal Pages - Actual Components */}
            <Route path="/legal/privacy" element={<PrivacyPolicyPage />} />
            <Route path="/legal/terms" element={<TermsOfServicePage />} />

            {/* Enhanced Landing Pages */}
            <Route path="/landing-page" element={<LandingPageAlt />} />
            <Route path="/simple-landing" element={<SimpleLandingPage />} />
            <Route path="/home-page" element={<HomePage />} />

            {/* Component Navigation */}
            <Route path="/components-nav" element={<ComponentsNavPage />} />

            {/* Enhanced Workflow Routes */}
            <Route path="/workflows-enhanced" element={<WorkflowsEnhancedPage />} />
            <Route path="/workflows/detail" element={<WorkflowDetailPage />} />
            <Route path="/workflows/execution" element={<WorkflowExecutionPage />} />
            <Route path="/workflows/templates" element={<WorkflowTemplatesPage />} />

            {/* Preview Routes */}
            <Route path="/preview/onboarding" element={<OnboardingPreviewPage />} />

            {/* Remaining Specialized Settings Routes */}
            <Route path="/workspace-settings/llm-selection" element={<WorkspaceLLMSelectionPage />} />
            <Route path="/workspace-settings/chat-model" element={<WorkspaceLLMSelectionPage />} />
            <Route
              path="/workspace-settings/agent-model"
              element={
                <AgentModelSelectionPage
                  agentModel="default"
                  provider="default"
                  workspace="default"
                  setHasChanges={() => {}}
                />
              }
            />

            {/* Agent-Specific Routes */}
            <Route path="/agents/unified-creator" element={<UnifiedAgentCreator />} />

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

            {/* Additional Missing Routes from Audit */}
            <Route path="/tasks-page" element={<TasksPageComponent />} />
            <Route path="/general-settings" element={<GeneralSettingsPage />} />
            <Route path="/general-settings/embedding" element={<GeneralSettingsEmbeddingPage />} />
            <Route path="/general-settings/community-hub" element={<CommunityHub />} />

            {/* Main workspace page */}
            <Route path="/main" element={<MainPage />} />

            {/* Additional missing routes */}
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
