import MemoryInspector from '@the-new-fuse/ui-consolidated/src/components/MemoryInspector';
import { MetricsDashboard } from '@the-new-fuse/ui-consolidated/src/components/MetricsDashboard';
import React, { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import { LandingRedesigned } from './pages/LandingRedesigned';
import { useAuth } from './providers/AuthProvider';

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
// Grid, Kanban, Timeline removed as they don't exist in pages/fairtable/

// Web3 & Blockchain Components
const NFTMarketplace = lazy(() => import('./pages/web3/NFTMarketplace'));
// SmartContracts, WalletConnect, RevenueTracker removed as they don't exist in pages/web3/

// Workflow Components
// Workflow Components
const WorkflowBuilder = lazy(() => import('./pages/workflow-pages/WorkflowBuilder'));

// Admin & Security Components
const UserManagement = lazy(() => import('./pages/Admin/UserManagement'));
const SecurityDashboard = lazy(() => import('./pages/Admin/SecurityDashboard'));
const SystemMonitoring = lazy(() => import('./pages/Admin/SystemMonitoring'));
const FeatureFlags = lazy(() => import('./pages/Admin/FeatureFlags'));

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

export function AppRoutes() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return <Loading />;
  }

  return (
    <Routes>
      {/* Public landing page */}
      <Route path="/" element={<LandingRedesigned />} />

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
              <MemoryInspector agentId="default" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/metrics"
          element={
            <ProtectedRoute>
              <MetricsDashboard />
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
