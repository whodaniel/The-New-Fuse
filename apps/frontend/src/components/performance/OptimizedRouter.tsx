import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Lazy, AdvancedLoadingFallback, preloadCriticalComponent } from '../components/performance/AdvancedLazy';
import { usePerformanceMonitor } from '../utils/performanceMonitor';

// Core components (keep loaded for immediate use)
import LoginPage from '../pages/auth/Login';
import RegisterPage from '../pages/auth/Register';

// Preload critical components
const preloadComponents = () => {
  // Preload most used pages
  preloadCriticalComponent(() => import('../pages/dashboard/index'));
  preloadCriticalComponent(() => import('../pages/Home'));
  preloadCriticalComponent(() => import('../components/MultiAgentChat'));
};

// Route-based code splitting with performance tracking
const PerformanceTrackedRoute = ({ 
  component: Component, 
  routeName, 
  ...props 
}: {
  component: React.ComponentType<any>;
  routeName: string;
  [key: string]: any;
}) => {
  usePerformanceMonitor(`Route: ${routeName}`);
  
  return (
    <Lazy
      importFunc={() => Promise.resolve({ default: Component })}
      fallbackName={routeName}
      showProgress={true}
    />
  );
};

// Lazy loaded pages organized by category
const CorePages = {
  // Authentication (critical for first load)
  auth: {
    ForgotPassword: lazy(() => import('../pages/auth/ForgotPassword')),
    ResetPassword: lazy(() => import('../pages/auth/ResetPassword')),
    SSOPage: lazy(() => import('../pages/auth/SSO')),
    GoogleCallback: lazy(() => import('../pages/auth/GoogleCallback')),
    OAuthCallback: lazy(() => import('../pages/auth/OAuthCallback')),
  },
  
  // Dashboard and main features
  dashboard: {
    Analytics: lazy(() => import('../pages/dashboard/Analytics')),
    AgentDashboard: lazy(() => import('../pages/dashboard/AgentDashboard')),
    CreateAgent: lazy(() => import('../pages/dashboard/CreateAgent')),
    DashboardSettings: lazy(() => import('../pages/dashboard/DashboardSettings')),
  },

  // Agent management
  agents: {
    AgentsPage: lazy(() => import('../pages/Agents/AgentsPage')),
    AgentDetail: lazy(() => import('../pages/Agents/Detail')),
    UnifiedAgentCreator: lazy(() => import('../pages/Agents/UnifiedAgentCreator')),
    NFTMarketplacePage: lazy(() => import('../pages/Agents/NFTMarketplacePage')),
    RevenueDashboardPage: lazy(() => import('../pages/Agents/RevenueDashboardPage')),
  },

  // Workflow and automation
  workflows: {
    Workflows: lazy(() => import('../pages/Workflows')),
    WorkflowBuilder: lazy(() => import('../pages/Workflows/Builder')),
    WorkflowDetail: lazy(() => import('../pages/Workflows/Detail')),
    WorkflowExecution: lazy(() => import('../pages/Workflows/Execution')),
    WorkflowTemplates: lazy(() => import('../pages/Workflows/Templates')),
  },

  // Admin and management
  admin: {
    AdminPanel: lazy(() => import('../pages/Admin/AdminPanel')),
    UserManagement: lazy(() => import('../pages/Admin/UserManagement')),
    SystemHealth: lazy(() => import('../pages/Admin/SystemHealth')),
    FeatureFlags: lazy(() => import('../pages/Admin/FeatureFlags')),
    PortManagement: lazy(() => import('../pages/Admin/PortManagement')),
    Onboarding: lazy(() => import('../pages/Admin/Onboarding')),
    Dashboard: lazy(() => import('../pages/Admin/Dashboard')),
    ExperimentalFeatures: lazy(() => import('../pages/Admin/ExperimentalFeatures/features')),
    Settings: lazy(() => import('../pages/Admin/AdminSettings')),
    WorkspaceManagement: lazy(() => import('../pages/Admin/WorkspaceManagement')),
  },

  // Settings and configuration
  settings: {
    Settings: lazy(() => import('../pages/Settings')),
    GeneralSettings: lazy(() => import('../pages/GeneralSettings')),
    Appearance: lazy(() => import('../pages/settings/Appearance')),
    Notifications: lazy(() => import('../pages/settings/Notifications')),
    Security: lazy(() => import('../pages/settings/Security')),
    API: lazy(() => import('../pages/settings/API')),
    EmbeddingPreference: lazy(() => import('../pages/GeneralSettings/EmbeddingPreference')),
  },

  // Chat and communication
  chat: {
    ChatPage: lazy(() => import('../pages/chat/ChatPage')),
    WorkspaceChat: lazy(() => import('../pages/WorkspaceChat')),
  },

  // Workspace management
  workspace: {
    Overview: lazy(() => import('../pages/workspace/Overview')),
    Analytics: lazy(() => import('../pages/workspace/WorkspaceAnalytics')),
    Members: lazy(() => import('../pages/workspace/Members')),
    Settings: lazy(() => import('../pages/workspace/Settings')),
    Layout: lazy(() => import('../pages/workspace/WorkspaceLayout')),
  },

  // Tasks and projects
  tasks: {
    TasksPage: lazy(() => import('../pages/Tasks/TasksPage')),
    TaskDetail: lazy(() => import('../pages/Tasks/Detail')),
    TaskEdit: lazy(() => import('../pages/Tasks/Edit')),
    NewTask: lazy(() => import('../pages/Tasks/New')),
  },

  // Suggestions and feedback
  suggestions: {
    Suggestions: lazy(() => import('../pages/Suggestions')),
    NewSuggestion: lazy(() => import('../pages/Suggestions/New')),
    SuggestionDetail: lazy(() => import('../pages/Suggestions/Detail')),
  },

  // Landing and onboarding
  landing: {
    Landing: lazy(() => import('../pages/Landing')),
    OnboardingFlow: lazy(() => import('../pages/OnboardingFlow')),
    Preview: lazy(() => import('../pages/preview/OnboardingPreview')),
  },

  // UI and components
  ui: {
    ComponentsShowcase: lazy(() => import('../pages/ComponentsShowcase')),
    ComponentsNav: lazy(() => import('../pages/ComponentsNav')),
    FrontendShowcase: lazy(() => import('../pages/FrontendShowcase')),
    LayoutExamples: lazy(() => import('../pages/Layout/LayoutExamples')),
    TimelineDemo: lazy(() => import('../pages/TimelineDemo')),
  },

  // Specialized features
  specialized: {
    AIAgentPortal: lazy(() => import('../pages/AIAgentPortal')),
    SophisticatedTNFHub: lazy(() => import('../pages/Hub/SophisticatedTNFHub')),
    MultiAgentChat: lazy(() => import('../components/MultiAgentChat')),
    CommunityHub: lazy(() => import('../pages/Community/CommunityHub')),
    WorkflowTemplates: lazy(() => import('../pages/WorkflowTemplates')),
  },

  // System and debug
  system: {
    Debug: lazy(() => import('../pages/Debug')),
    DebugRouting: lazy(() => import('../pages/DebugRouting')),
    BuildInfo: lazy(() => import('../pages/BuildInfo')),
    Test: lazy(() => import('../pages/Test')),
    SimpleTest: lazy(() => import('../pages/SimpleTest')),
    AllPages: lazy(() => import('../pages/AllPages')),
    NotFound: lazy(() => import('../pages/NotFound')),
    Unauthorized: lazy(() => import('../pages/Unauthorized')),
  },

  // Legal
  legal: {
    PrivacyPolicy: lazy(() => import('../pages/legal/PrivacyPolicy')),
    TermsOfService: lazy(() => import('../pages/legal/TermsOfService')),
  },
};

// Route groups for better organization
const RouteGroups = {
  // Core routes - load immediately
  core: [
    { path: '/', name: 'Home', component: lazy(() => import('../pages/Home')) },
    { path: '/home', name: 'Home', component: lazy(() => import('../pages/Home')) },
    { path: '/dashboard', name: 'Dashboard', component: lazy(() => import('../pages/dashboard/index')) },
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
const OptimizedRouter: React.FC = () => {
  React.useEffect(() => {
    // Preload critical components after initial load
    const timer = setTimeout(preloadComponents, 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div>
      <SmartNavigation />
      <Suspense fallback={<AdvancedLoadingFallback name="Page" showProgress={true} />}>
        <Routes>
          {/* Core routes - immediate load */}
          {RouteGroups.core.map(({ path, component: Component, name }) => (
            <Route
              key={path}
              path={path}
              element={
                <PerformanceTrackedRoute
                  component={Component}
                  routeName={name || path}
                />
              }
            />
          ))}

          {/* Feature routes with lazy loading */}
          {[...RouteGroups.auth, ...RouteGroups.user, ...RouteGroups.features].map(({ path, component: Component }) => (
            <Route
              key={path}
              path={path}
              element={
                <Lazy
                  importFunc={() => Promise.resolve({ default: Component })}
                  fallbackName={path}
                  showProgress={false}
                />
              }
            />
          ))}

          {/* Admin routes - higher priority for admin users */}
          {RouteGroups.admin.map(({ path, component: Component }) => (
            <Route
              key={path}
              path={path}
              element={
                <Lazy
                  importFunc={() => Promise.resolve({ default: Component })}
                  fallbackName={`Admin: ${path}`}
                  showProgress={true}
                />
              }
            />
          ))}

          {/* Workspace routes */}
          {RouteGroups.workspace.map(({ path, component: Component }) => (
            <Route
              key={path}
              path={path}
              element={
                <Lazy
                  importFunc={() => Promise.resolve({ default: Component })}
                  fallbackName={`Workspace: ${path}`}
                  showProgress={false}
                />
              }
            />
          ))}

          {/* Settings routes */}
          {RouteGroups.settings.map(({ path, component: Component }) => (
            <Route
              key={path}
              path={path}
              element={
                <Lazy
                  importFunc={() => Promise.resolve({ default: Component })}
                  fallbackName={`Settings: ${path}`}
                  showProgress={false}
                />
              }
            />
          ))}

          {/* Specialized routes */}
          {RouteGroups.specialized.map(({ path, component: Component }) => (
            <Route
              key={path}
              path={path}
              element={
                <Lazy
                  importFunc={() => Promise.resolve({ default: Component })}
                  fallbackName={path}
                  showProgress={true}
                />
              }
            />
          ))}

          {/* UI routes */}
          {RouteGroups.ui.map(({ path, component: Component }) => (
            <Route
              key={path}
              path={path}
              element={
                <Lazy
                  importFunc={() => Promise.resolve({ default: Component })}
                  fallbackName={path}
                  showProgress={false}
                />
              }
            />
          ))}

          {/* System routes */}
          {RouteGroups.system.map(({ path, component: Component }) => (
            <Route
              key={path}
              path={path}
              element={
                <Lazy
                  importFunc={() => Promise.resolve({ default: Component })}
                  fallbackName={`System: ${path}`}
                  showProgress={false}
                />
              }
            />
          ))}

          {/* Landing routes */}
          {RouteGroups.landing.map(({ path, component: Component }) => (
            <Route
              key={path}
              path={path}
              element={
                <Lazy
                  importFunc={() => Promise.resolve({ default: Component })}
                  fallbackName={`Landing: ${path}`}
                  showProgress={false}
                />
              }
            />
          ))}

          {/* 404 fallback */}
          <Route
            path="*"
            element={
              <div className="p-8 text-center">
                <h1 className="text-3xl font-bold text-red-600 mb-4">404 - Page Not Found</h1>
                <p className="text-gray-600 mb-4">The page you are looking for does not exist.</p>
                <button 
                  onClick={() => window.location.href = '/'}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                >
                  Go Home
                </button>
              </div>
            }
          />
        </Routes>
      </Suspense>
    </div>
  );
};

// Import SmartNavigation component (assuming it exists in components)
import SmartNavigation from './SmartNavigation';

export default OptimizedRouter;
export { CorePages, RouteGroups };