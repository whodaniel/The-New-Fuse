import React, { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
// import { LandingRedesigned } from './pages/LandingRedesigned';
// import { Landing } from './pages/Landing';
// import { LandingPage } from './pages/LandingPage';
import { useAuth } from './hooks/useAuth';

// Lazy-loaded components
const Dashboard = lazy(() => import('./pages/dashboard/index'));
const AIPortal = lazy(() => import('./pages/AIAgentPortal'));
const Workflows = lazy(() => import('./pages/Workflows'));
const Analytics = lazy(() => import('./pages/dashboard/Analytics'));
const Settings = lazy(() => import('./pages/Settings'));
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const NotFound = lazy(() => import('./pages/404'));

// Fairtable Components
const FairtableDashboard = lazy(() => import('./pages/fairtable/FairtableDashboard'));

// Web3 & Blockchain Components
const NFTMarketplace = lazy(() => import('./pages/web3/NFTMarketplace'));

// Workflow Components
const WorkflowBuilder = lazy(() => import('./pages/workflow-pages/WorkflowBuilder'));

// Admin & Security Components
const UserManagement = lazy(() => import('./pages/Admin/UserManagement'));
const SecurityDashboard = lazy(() => import('./pages/Admin/SecurityDashboard'));
const SystemMonitoring = lazy(() => import('./pages/Admin/SystemMonitoring'));
const FeatureFlags = lazy(() => import('./pages/Admin/FeatureFlags'));

// Memory & Metrics Components
const MemoryInspector = lazy(() => import('./pages/MemoryInspector'));
const MetricsDashboard = lazy(() => import('./pages/MetricsDashboard'));

// --- Restored Components from ComprehensiveRouter ---

// Agents & Chat
const UnifiedAgentCreator = lazy(() => import('./pages/Agents/UnifiedAgentCreator'));
const AgentsPage = lazy(() => import('./pages/Agents/AgentsPage'));
const AgentDetail = lazy(() => import('./pages/Agents/Detail'));
const MultiAgentChat = lazy(() => import('./components/MultiAgentChat'));
const ChatPage = lazy(() => import('./pages/chat/ChatPage'));

// Workspace
const WorkspaceAnalytics = lazy(() => import('./pages/workspace/WorkspaceAnalytics'));
const WorkspaceOverview = lazy(() => import('./pages/workspace/Overview'));
const WorkspaceMembers = lazy(() => import('./pages/workspace/Members'));
const WorkspaceChat = lazy(() => import('./pages/WorkspaceChat'));

// Tasks
const TasksPage = lazy(() => import('./pages/Tasks/TasksPage'));
const NewTaskPage = lazy(() => import('./pages/Tasks/New'));
const TaskDetailPage = lazy(() => import('./pages/Tasks/Detail'));
const TaskEditPage = lazy(() => import('./pages/Tasks/Edit'));

// Suggestions
const SuggestionsPage = lazy(() => import('./pages/Suggestions/index'));
const NewSuggestionPage = lazy(() => import('./pages/Suggestions/New'));
const SuggestionDetailPage = lazy(() => import('./pages/Suggestions/Detail'));

// Admin Extended
const AdminPanel = lazy(() => import('./pages/Admin/AdminPanel'));
const AdminPortManagement = lazy(() => import('./pages/Admin/PortManagement'));
const AdminSystemHealth = lazy(() => import('./pages/Admin/SystemHealth'));
const AdminAgentSkills = lazy(() => import('./pages/Admin/Agents/skills'));
const AdminWebSearch = lazy(() => import('./pages/Admin/Agents/WebSearchSelection'));

// Workflow Extended
const WorkflowTemplates = lazy(() => import('./pages/workflow-pages/Templates'));
const WorkflowExecution = lazy(() => import('./pages/workflow-pages/Execution'));
const WorkflowDetail = lazy(() => import('./pages/workflow-pages/Detail'));

// Resources & Showcases
const ResourcesDashboard = lazy(() => import('./pages/Resources/ResourcesDashboard'));
const ComponentsShowcase = lazy(() => import('./pages/ComponentsShowcase'));
const FrontendShowcase = lazy(() => import('./pages/FrontendShowcase'));
const UserProfilePage = lazy(() => import('./components/profile/UserProfilePage'));

// Loading component
const Loading = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
  </div>
);

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <Loading />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  return <>{children}</>;
};

// Public route component (accessible only when NOT authenticated)
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <Loading />;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

const LandingRedesigned = lazy(() => import('./pages/LandingRedesigned'));

export function AppRoutes() {
  return (
    <Routes>
      {/* Public landing page */}
      <Route
        path="/"
        element={
          <Suspense fallback={<Loading />}>
            <LandingRedesigned />
          </Suspense>
        }
      />

      {/* Auth routes */}
      <Route path="/auth">
        <Route
          path="login"
          element={
            <PublicRoute>
              <Suspense fallback={<Loading />}>
                <Login />
              </Suspense>
            </PublicRoute>
          }
        />
        <Route
          path="register"
          element={
            <PublicRoute>
              <Suspense fallback={<Loading />}>
                <Register />
              </Suspense>
            </PublicRoute>
          }
        />
        <Route
          path="forgot-password"
          element={
            <PublicRoute>
              <Suspense fallback={<Loading />}>
                <ForgotPassword />
              </Suspense>
            </PublicRoute>
          }
        />
      </Route>

      {/* Protected routes under MainLayout */}
      <Route element={<MainLayout />}>
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Suspense fallback={<Loading />}>
                <Dashboard />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/ai-portal"
          element={
            <ProtectedRoute>
              <Suspense fallback={<Loading />}>
                <AIPortal />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/workflows"
          element={
            <ProtectedRoute>
              <Suspense fallback={<Loading />}>
                <Workflows />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <ProtectedRoute>
              <Suspense fallback={<Loading />}>
                <Analytics />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Suspense fallback={<Loading />}>
                <Settings />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/memory/:agentId"
          element={
            <ProtectedRoute>
              <Suspense fallback={<Loading />}>
                <MemoryInspector />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/metrics"
          element={
            <ProtectedRoute>
              <Suspense fallback={<Loading />}>
                <MetricsDashboard />
              </Suspense>
            </ProtectedRoute>
          }
        />

        {/* Fairtable Routes */}
        <Route
          path="/fairtable"
          element={
            <ProtectedRoute>
              <Suspense fallback={<Loading />}>
                <FairtableDashboard />
              </Suspense>
            </ProtectedRoute>
          }
        />

        {/* Web3 & Blockchain Routes */}
        <Route
          path="/nft/marketplace"
          element={
            <ProtectedRoute>
              <Suspense fallback={<Loading />}>
                <NFTMarketplace />
              </Suspense>
            </ProtectedRoute>
          }
        />

        {/* Enhanced Workflow Routes */}
        <Route
          path="/workflows/builder"
          element={
            <ProtectedRoute>
              <Suspense fallback={<Loading />}>
                <WorkflowBuilder />
              </Suspense>
            </ProtectedRoute>
          }
        />

        {/* Admin & Security Routes */}
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute>
              <Suspense fallback={<Loading />}>
                <UserManagement />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/security"
          element={
            <ProtectedRoute>
              <Suspense fallback={<Loading />}>
                <SecurityDashboard />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/monitoring"
          element={
            <ProtectedRoute>
              <Suspense fallback={<Loading />}>
                <SystemMonitoring />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/features"
          element={
            <ProtectedRoute>
              <Suspense fallback={<Loading />}>
                <FeatureFlags />
              </Suspense>
            </ProtectedRoute>
          }
        />

        {/* --- Restored Routes --- */}

        {/* Agents & Chat */}
        <Route
          path="/agents"
          element={
            <ProtectedRoute>
              <Suspense fallback={<Loading />}>
                <AgentsPage />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/agents/new"
          element={
            <ProtectedRoute>
              <Suspense fallback={<Loading />}>
                <UnifiedAgentCreator />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/agents/unified-creator"
          element={
            <ProtectedRoute>
              <Suspense fallback={<Loading />}>
                <UnifiedAgentCreator />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/agents/:id"
          element={
            <ProtectedRoute>
              <Suspense fallback={<Loading />}>
                <AgentDetail />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/multi-agent-chat"
          element={
            <ProtectedRoute>
              <Suspense fallback={<Loading />}>
                <MultiAgentChat />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <Suspense fallback={<Loading />}>
                <ChatPage />
              </Suspense>
            </ProtectedRoute>
          }
        />

        {/* Workspace */}
        <Route
          path="/workspace/overview"
          element={
            <ProtectedRoute>
              <Suspense fallback={<Loading />}>
                <WorkspaceOverview />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/workspace/analytics"
          element={
            <ProtectedRoute>
              <Suspense fallback={<Loading />}>
                <WorkspaceAnalytics />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/workspace/members"
          element={
            <ProtectedRoute>
              <Suspense fallback={<Loading />}>
                <WorkspaceMembers />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/workspace/chat"
          element={
            <ProtectedRoute>
              <Suspense fallback={<Loading />}>
                <WorkspaceChat />
              </Suspense>
            </ProtectedRoute>
          }
        />

        {/* Tasks */}
        <Route
          path="/tasks"
          element={
            <ProtectedRoute>
              <Suspense fallback={<Loading />}>
                <TasksPage />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/tasks/new"
          element={
            <ProtectedRoute>
              <Suspense fallback={<Loading />}>
                <NewTaskPage />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/tasks/:id"
          element={
            <ProtectedRoute>
              <Suspense fallback={<Loading />}>
                <TaskDetailPage />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/tasks/:id/edit"
          element={
            <ProtectedRoute>
              <Suspense fallback={<Loading />}>
                <TaskEditPage />
              </Suspense>
            </ProtectedRoute>
          }
        />

        {/* Suggestions */}
        <Route
          path="/suggestions"
          element={
            <ProtectedRoute>
              <Suspense fallback={<Loading />}>
                <SuggestionsPage />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/suggestions/new"
          element={
            <ProtectedRoute>
              <Suspense fallback={<Loading />}>
                <NewSuggestionPage />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/suggestions/:id"
          element={
            <ProtectedRoute>
              <Suspense fallback={<Loading />}>
                <SuggestionDetailPage />
              </Suspense>
            </ProtectedRoute>
          }
        />

        {/* Admin Extended */}
        <Route
          path="/admin/panel"
          element={
            <ProtectedRoute>
              <Suspense fallback={<Loading />}>
                <AdminPanel />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/port-management"
          element={
            <ProtectedRoute>
              <Suspense fallback={<Loading />}>
                <AdminPortManagement />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/system-health"
          element={
            <ProtectedRoute>
              <Suspense fallback={<Loading />}>
                <AdminSystemHealth />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/agent-skills"
          element={
            <ProtectedRoute>
              <Suspense fallback={<Loading />}>
                <AdminAgentSkills />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/web-search"
          element={
            <ProtectedRoute>
              <Suspense fallback={<Loading />}>
                <AdminWebSearch />
              </Suspense>
            </ProtectedRoute>
          }
        />

        {/* Workflows Extended */}
        <Route
          path="/workflows/templates"
          element={
            <ProtectedRoute>
              <Suspense fallback={<Loading />}>
                <WorkflowTemplates />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/workflows/templates/:id"
          element={
            <ProtectedRoute>
              <Suspense fallback={<Loading />}>
                <WorkflowTemplates />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/workflows/execution"
          element={
            <ProtectedRoute>
              <Suspense fallback={<Loading />}>
                <WorkflowExecution />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/workflows/:id"
          element={
            <ProtectedRoute>
              <Suspense fallback={<Loading />}>
                <WorkflowDetail />
              </Suspense>
            </ProtectedRoute>
          }
        />

        {/* Resources & Profile */}
        <Route
          path="/resources"
          element={
            <ProtectedRoute>
              <Suspense fallback={<Loading />}>
                <ResourcesDashboard />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Suspense fallback={<Loading />}>
                <UserProfilePage />
              </Suspense>
            </ProtectedRoute>
          }
        />

        {/* Helper/Dev Routes - Protected but maybe could be public depending on needs */}
        <Route
          path="/components-showcase"
          element={
            <ProtectedRoute>
              <Suspense fallback={<Loading />}>
                <ComponentsShowcase />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/frontend-showcase"
          element={
            <ProtectedRoute>
              <Suspense fallback={<Loading />}>
                <FrontendShowcase />
              </Suspense>
            </ProtectedRoute>
          }
        />
      </Route>

      {/* 404 page */}
      <Route
        path="*"
        element={
          <Suspense fallback={<Loading />}>
            <NotFound />
          </Suspense>
        }
      />
    </Routes>
  );
}
