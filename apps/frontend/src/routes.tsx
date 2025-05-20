import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './providers/AuthProvider.js';
import MainLayout from './components/layout/MainLayout.js';
import { HomePage } from './pages/HomePage.js';
import { MemoryInspector } from '@the-new-fuse/ui-components/src/features/memory-inspector/components/MemoryInspector';
import { MetricsDashboard } from '@the-new-fuse/ui-components/src/features/metrics-dashboard/components/MetricsDashboard';

// Lazy-loaded components
const Dashboard = lazy(() => import('./pages/Dashboard.js'));
const AIPortal = lazy(() => import('./pages/AIPortal.js'));
const Workflows = lazy(() => import('./pages/Workflows.js'));
const Analytics = lazy(() => import('./pages/Analytics.js'));
const Settings = lazy(() => import('./pages/Settings.js'));
const Login = lazy(() => import('./pages/auth/Login.js'));
const Register = lazy(() => import('./pages/auth/Register.js'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword.js'));
const NotFound = lazy(() => import('./pages/NotFound.js'));

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
      <Route path="/" element={<HomePage />} />

      {/* Auth routes */}
      <Route path="/auth">
        <Route path="login" element={
          <PublicRoute>
            <Suspense fallback={<Loading />}>
              <Login />
            </Suspense>
          </PublicRoute>
        } />
        <Route path="register" element={
          <PublicRoute>
            <Suspense fallback={<Loading />}>
              <Register />
            </Suspense>
          </PublicRoute>
        } />
        <Route path="forgot-password" element={
          <PublicRoute>
            <Suspense fallback={<Loading />}>
              <ForgotPassword />
            </Suspense>
          </PublicRoute>
        } />
      </Route>

      {/* Protected routes under MainLayout */}
      <Route element={<MainLayout />}>
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Suspense fallback={<Loading />}>
              <Dashboard />
            </Suspense>
          </ProtectedRoute>
        } />
        <Route path="/ai-portal" element={
          <ProtectedRoute>
            <Suspense fallback={<Loading />}>
              <AIPortal />
            </Suspense>
          </ProtectedRoute>
        } />
        <Route path="/workflows" element={
          <ProtectedRoute>
            <Suspense fallback={<Loading />}>
              <Workflows />
            </Suspense>
          </ProtectedRoute>
        } />
        <Route path="/analytics" element={
          <ProtectedRoute>
            <Suspense fallback={<Loading />}>
              <Analytics />
            </Suspense>
          </ProtectedRoute>
        } />
        <Route path="/settings" element={
          <ProtectedRoute>
            <Suspense fallback={<Loading />}>
              <Settings />
            </Suspense>
          </ProtectedRoute>
        } />
        <Route path="/memory" element={
          <ProtectedRoute>
            <MemoryInspector />
          </ProtectedRoute>
        } />
        <Route path="/metrics" element={
          <ProtectedRoute>
            <MetricsDashboard />
          </ProtectedRoute>
        } />
      </Route>

      {/* 404 page */}
      <Route path="*" element={
        <Suspense fallback={<Loading />}>
          <NotFound />
        </Suspense>
      } />
    </Routes>
  );
}
