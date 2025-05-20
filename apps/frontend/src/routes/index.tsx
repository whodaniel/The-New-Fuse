import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import MainLayout from '@/components/layout/MainLayout';
import Loading from '@/components/core/Loading';
import { ProtectedRoute } from '@/components/core/ProtectedRoute';
import { PublicRoute } from '@/components/core/PublicRoute';

// Lazy-loaded components
const Landing = React.lazy(() => import('@/pages/Landing'));
const Login = React.lazy(() => import('@/pages/auth/Login'));
const Register = React.lazy(() => import('@/pages/auth/Register'));
const ForgotPassword = React.lazy(() => import('@/pages/auth/ForgotPassword'));
const ResetPassword = React.lazy(() => import('@/pages/auth/ResetPassword'));
const SSO = React.lazy(() => import('@/pages/auth/SSO'));
const Dashboard = React.lazy(() => import('@/pages/dashboard'));
const Analytics = React.lazy(() => import('@/pages/Analytics'));
const AIAgentPortal = React.lazy(() => import('@/pages/AIAgentPortal'));
const OnboardingFlow = React.lazy(() => import('@/pages/OnboardingFlow'));
const AdminRoutes = React.lazy(() => import('@/pages/Admin'));
const WorkspaceRoutes = React.lazy(() => import('@/pages/workspace'));
const SettingsRoutes = React.lazy(() => import('@/pages/settings'));
const NotFound = React.lazy(() => import('@/pages/404'));
const TimelineDemo = React.lazy(() => import('@/pages/TimelineDemo'));
const GraphDemo = React.lazy(() => import('@/pages/graph-demo'));
const PrivacyPolicy = React.lazy(() => import('@/pages/legal/PrivacyPolicy'));
const TermsOfService = React.lazy(() => import('@/pages/legal/TermsOfService'));
const OnboardingPreview = React.lazy(() => import('@/pages/preview/OnboardingPreview'));

export function AppRoutes() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return <Loading />;
  }

  return (
    <Routes>
      {/* Public landing page */}
      <Route path="/" element={<Landing />} />

      {/* Auth routes */}
      <Route path="auth" element={<PublicRoute />}>
        <Route path="login" element={
          <Suspense fallback={<Loading />}>
            <Login />
          </Suspense>
        } />
        <Route path="register" element={
          <Suspense fallback={<Loading />}>
            <Register />
          </Suspense>
        } />
        <Route path="forgot-password" element={
          <Suspense fallback={<Loading />}>
            <ForgotPassword />
          </Suspense>
        } />
        <Route path="reset-password/:token" element={
          <Suspense fallback={<Loading />}>
            <ResetPassword />
          </Suspense>
        } />
        <Route path="sso/:provider" element={
          <Suspense fallback={<Loading />}>
            <SSO />
          </Suspense>
        } />
      </Route>

      {/* Demo routes - publicly accessible */}
      <Route path="timeline-demo" element={
        <Suspense fallback={<Loading />}>
          <TimelineDemo />
        </Suspense>
      } />
      <Route path="graph-demo" element={
        <Suspense fallback={<Loading />}>
          <GraphDemo />
        </Suspense>
      } />

      {/* Legal pages */}
      <Route path="legal">
        <Route path="privacy-policy" element={
          <Suspense fallback={<Loading />}>
            <PrivacyPolicy />
          </Suspense>
        } />
        <Route path="terms-of-service" element={
          <Suspense fallback={<Loading />}>
            <TermsOfService />
          </Suspense>
        } />
      </Route>

      {/* Protected routes under MainLayout */}
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          {/* Main dashboard */}
          <Route path="dashboard" element={
            <Suspense fallback={<Loading />}>
              <Dashboard />
            </Suspense>
          } />
          <Route path="analytics" element={
            <Suspense fallback={<Loading />}>
              <Analytics />
            </Suspense>
          } />
          <Route path="ai-portal" element={
            <Suspense fallback={<Loading />}>
              <AIAgentPortal />
            </Suspense>
          } />

          {/* Onboarding */}
          <Route path="onboarding" element={
            <Suspense fallback={<Loading />}>
              <OnboardingFlow />
            </Suspense>
          } />

          {/* Admin section */}
          <Route path="admin/*" element={
            <Suspense fallback={<Loading />}>
              <AdminRoutes />
            </Suspense>
          } />

          {/* Workspace section */}
          <Route path="workspace/*" element={
            <Suspense fallback={<Loading />}>
              <WorkspaceRoutes />
            </Suspense>
          } />

          {/* Settings section */}
          <Route path="settings/*" element={
            <Suspense fallback={<Loading />}>
              <SettingsRoutes />
            </Suspense>
          } />
        </Route>
      </Route>

      {/* Preview routes */}
      <Route path="preview">
        <Route path="onboarding" element={
          <Suspense fallback={<Loading />}>
            <OnboardingPreview />
          </Suspense>
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
