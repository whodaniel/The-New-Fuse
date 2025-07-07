import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Center, Spinner } from '@chakra-ui/react';
import { ProtectedRoute } from '../components/core/ProtectedRoute';
import { PublicRoute } from '../components/core/PublicRoute';

// Lazy-loaded components with proper default exports
const Landing = lazy(() => import('../pages/Landing').then(m => ({ default: m.Landing })));
const Login = lazy(() => import('../pages/Login').then(m => ({ default: m.Login })));
const Register = lazy(() => import('../pages/Register').then(m => ({ default: m.Register })));
const Dashboard = lazy(() => import('../pages/Dashboard').then(m => ({ default: m.Dashboard })));
const ForgotPassword = lazy(() => import('../pages/ForgotPassword').then(m => ({ default: m.ForgotPassword })));
const ResetPassword = lazy(() => import('../pages/ResetPassword').then(m => ({ default: m.ResetPassword })));

// Additional pages - will create placeholders for missing ones
const NotFound = lazy(() => import('../pages/NotFound').catch(() => ({ default: () => <div>404 - Page Not Found</div> })));
const LegalTerms = lazy(() => import('../pages/LegalTerms').catch(() => ({ default: () => <div>Terms of Service</div> })));
const LegalPrivacy = lazy(() => import('../pages/LegalPrivacy').catch(() => ({ default: () => <div>Privacy Policy</div> })));
const Agents = lazy(() => import('../pages/Agents').catch(() => ({ default: () => <div>Agents</div> })));
const Workflows = lazy(() => import('../pages/Workflows').catch(() => ({ default: () => <div>Workflows</div> })));

// Create placeholder components for pages that don't exist yet
const CreateAgent = () => <div style={{padding: '2rem', textAlign: 'center'}}><h2>Create Agent</h2><p>Agent creation interface coming soon</p></div>;
const AgentDetails = () => <div style={{padding: '2rem', textAlign: 'center'}}><h2>Agent Details</h2><p>Agent details interface coming soon</p></div>;
const Analytics = () => <div style={{padding: '2rem', textAlign: 'center'}}><h2>Analytics</h2><p>Analytics dashboard coming soon</p></div>;
const Settings = () => <div style={{padding: '2rem', textAlign: 'center'}}><h2>Settings</h2><p>Settings interface coming soon</p></div>;
const WorkflowTemplates = () => <div style={{padding: '2rem', textAlign: 'center'}}><h2>Workflow Templates</h2><p>Template library coming soon</p></div>;
const WorkflowDetails = () => <div style={{padding: '2rem', textAlign: 'center'}}><h2>Workflow Details</h2><p>Workflow details coming soon</p></div>;

function LoadingSpinner() {
  return (
    <Center h="100vh">
      <Spinner
        thickness="4px"
        speed="0.65s"
        emptyColor="gray.200"
        color="brand.500"
        size="xl"
      />
    </Center>
  );
}

export function AppRoutes() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Landing />} />
        
        {/* Auth routes - accessible only when NOT authenticated */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />
        <Route
          path="/auth/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/auth/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <PublicRoute>
              <ForgotPassword />
            </PublicRoute>
          }
        />
        <Route
          path="/reset-password/:token"
          element={
            <PublicRoute>
              <ResetPassword />
            </PublicRoute>
          }
        />

        {/* Protected routes - require authentication */}
        <Route
          path="/dashboard/*"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        
        {/* AI Agents */}
        <Route
          path="/agents"
          element={
            <ProtectedRoute>
              <Agents />
            </ProtectedRoute>
          }
        />
        <Route
          path="/agents/new"
          element={
            <ProtectedRoute>
              <CreateAgent />
            </ProtectedRoute>
          }
        />
        <Route
          path="/agents/:id"
          element={
            <ProtectedRoute>
              <AgentDetails />
            </ProtectedRoute>
          }
        />
        
        {/* Workflows */}
        <Route
          path="/workflows"
          element={
            <ProtectedRoute>
              <Workflows />
            </ProtectedRoute>
          }
        />
        <Route
          path="/workflows/templates"
          element={
            <ProtectedRoute>
              <WorkflowTemplates />
            </ProtectedRoute>
          }
        />
        <Route
          path="/workflows/:id"
          element={
            <ProtectedRoute>
              <WorkflowDetails />
            </ProtectedRoute>
          }
        />
        
        {/* Analytics & Settings */}
        <Route
          path="/analytics"
          element={
            <ProtectedRoute>
              <Analytics />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />

        {/* Legal pages */}
        <Route path="/legal/terms" element={<LegalTerms />} />
        <Route path="/legal/privacy" element={<LegalPrivacy />} />
        
        {/* Alternative landing pages */}
        <Route path="/landing" element={<Landing />} />
        <Route path="/landing-page" element={<Landing />} />
        
        {/* 404 and catch all route */}
        <Route path="/404" element={<NotFound />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </Suspense>
  );
}