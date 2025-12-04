import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './providers/AuthProvider';
import MainLayout from './components/layout/MainLayout';
import { LandingRedesigned } from './pages/LandingRedesigned';
import { MemoryInspector } from '@the-new-fuse/ui-consolidated/src/components/MemoryInspector';
import { MetricsDashboard } from '@the-new-fuse/ui-consolidated/src/components/MetricsDashboard';

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

// Fairtable Components
const FairtableDashboard = lazy(() => import('./pages/fairtable/FairtableDashboard.js'));
const FairtableGrid = lazy(() => import('./pages/fairtable/FairtableGrid.js'));
const FairtableKanban = lazy(() => import('./pages/fairtable/FairtableKanban.js'));
const FairtableTimeline = lazy(() => import('./pages/fairtable/FairtableTimeline.js'));

// Web3 & Blockchain Components
const NFTMarketplace = lazy(() => import('./pages/web3/NFTMarketplace.js'));
const SmartContracts = lazy(() => import('./pages/web3/SmartContracts.js'));
const WalletConnect = lazy(() => import('./pages/web3/WalletConnect.js'));
const RevenueTracker = lazy(() => import('./pages/web3/RevenueTracker.js'));

// Workflow Components
const WorkflowBuilder = lazy(() => import('./pages/workflows/WorkflowBuilder.js'));
const TemplateLibrary = lazy(() => import('./pages/workflows/TemplateLibrary.js'));
const AutomationJobs = lazy(() => import('./pages/workflows/AutomationJobs.js'));

// Data Management Components
const DatabaseExplorer = lazy(() => import('./pages/data/DatabaseExplorer.js'));
const ImportExport = lazy(() => import('./pages/data/ImportExport.js'));
const DataPipeline = lazy(() => import('./pages/data/DataPipeline.js'));

// Web Scraping Components
const WebScrapingDashboard = lazy(() => import('./pages/scraping/WebScrapingDashboard.js'));
const ScrapingJobs = lazy(() => import('./pages/scraping/ScrapingJobs.js'));

// Admin & Security Components
const UserManagement = lazy(() => import('./pages/admin/UserManagement.js'));
const SecurityDashboard = lazy(() => import('./pages/admin/SecurityDashboard.js'));
const SystemMonitoring = lazy(() => import('./pages/admin/SystemMonitoring.js'));
const FeatureFlags = lazy(() => import('./pages/admin/FeatureFlags.js'));

// Development Tools Components  
const ExtensionManager = lazy(() => import('./pages/dev/ExtensionManager.js'));
const PackageRegistry = lazy(() => import('./pages/dev/PackageRegistry.js'));
const TestingSuite = lazy(() => import('./pages/dev/TestingSuite.js'));

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

        {/* Fairtable Routes */}
        <Route path="/fairtable" element={
          <ProtectedRoute>
            <Suspense fallback={<Loading />}>
              <FairtableDashboard />
            </Suspense>
          </ProtectedRoute>
        } />
        <Route path="/fairtable/grid" element={
          <ProtectedRoute>
            <Suspense fallback={<Loading />}>
              <FairtableGrid />
            </Suspense>
          </ProtectedRoute>
        } />
        <Route path="/fairtable/kanban" element={
          <ProtectedRoute>
            <Suspense fallback={<Loading />}>
              <FairtableKanban />
            </Suspense>
          </ProtectedRoute>
        } />
        <Route path="/fairtable/timeline" element={
          <ProtectedRoute>
            <Suspense fallback={<Loading />}>
              <FairtableTimeline />
            </Suspense>
          </ProtectedRoute>
        } />

        {/* Web3 & Blockchain Routes */}
        <Route path="/nft/marketplace" element={
          <ProtectedRoute>
            <Suspense fallback={<Loading />}>
              <NFTMarketplace />
            </Suspense>
          </ProtectedRoute>
        } />
        <Route path="/contracts/dashboard" element={
          <ProtectedRoute>
            <Suspense fallback={<Loading />}>
              <SmartContracts />
            </Suspense>
          </ProtectedRoute>
        } />
        <Route path="/wallet/connect" element={
          <ProtectedRoute>
            <Suspense fallback={<Loading />}>
              <WalletConnect />
            </Suspense>
          </ProtectedRoute>
        } />
        <Route path="/revenue/dashboard" element={
          <ProtectedRoute>
            <Suspense fallback={<Loading />}>
              <RevenueTracker />
            </Suspense>
          </ProtectedRoute>
        } />

        {/* Enhanced Workflow Routes */}
        <Route path="/workflows/builder" element={
          <ProtectedRoute>
            <Suspense fallback={<Loading />}>
              <WorkflowBuilder />
            </Suspense>
          </ProtectedRoute>
        } />
        <Route path="/workflows/templates" element={
          <ProtectedRoute>
            <Suspense fallback={<Loading />}>
              <TemplateLibrary />
            </Suspense>
          </ProtectedRoute>
        } />
        <Route path="/workflows/jobs" element={
          <ProtectedRoute>
            <Suspense fallback={<Loading />}>
              <AutomationJobs />
            </Suspense>
          </ProtectedRoute>
        } />

        {/* Data Management Routes */}
        <Route path="/data/explorer" element={
          <ProtectedRoute>
            <Suspense fallback={<Loading />}>
              <DatabaseExplorer />
            </Suspense>
          </ProtectedRoute>
        } />
        <Route path="/data/transfer" element={
          <ProtectedRoute>
            <Suspense fallback={<Loading />}>
              <ImportExport />
            </Suspense>
          </ProtectedRoute>
        } />
        <Route path="/data/pipeline" element={
          <ProtectedRoute>
            <Suspense fallback={<Loading />}>
              <DataPipeline />
            </Suspense>
          </ProtectedRoute>
        } />

        {/* Web Scraping Routes */}
        <Route path="/scraping/dashboard" element={
          <ProtectedRoute>
            <Suspense fallback={<Loading />}>
              <WebScrapingDashboard />
            </Suspense>
          </ProtectedRoute>
        } />
        <Route path="/scraping/jobs" element={
          <ProtectedRoute>
            <Suspense fallback={<Loading />}>
              <ScrapingJobs />
            </Suspense>
          </ProtectedRoute>
        } />

        {/* Admin & Security Routes */}
        <Route path="/admin/users" element={
          <ProtectedRoute>
            <Suspense fallback={<Loading />}>
              <UserManagement />
            </Suspense>
          </ProtectedRoute>
        } />
        <Route path="/admin/security" element={
          <ProtectedRoute>
            <Suspense fallback={<Loading />}>
              <SecurityDashboard />
            </Suspense>
          </ProtectedRoute>
        } />
        <Route path="/admin/monitoring" element={
          <ProtectedRoute>
            <Suspense fallback={<Loading />}>
              <SystemMonitoring />
            </Suspense>
          </ProtectedRoute>
        } />
        <Route path="/admin/features" element={
          <ProtectedRoute>
            <Suspense fallback={<Loading />}>
              <FeatureFlags />
            </Suspense>
          </ProtectedRoute>
        } />

        {/* Development Tools Routes */}
        <Route path="/dev/extensions" element={
          <ProtectedRoute>
            <Suspense fallback={<Loading />}>
              <ExtensionManager />
            </Suspense>
          </ProtectedRoute>
        } />
        <Route path="/dev/packages" element={
          <ProtectedRoute>
            <Suspense fallback={<Loading />}>
              <PackageRegistry />
            </Suspense>
          </ProtectedRoute>
        } />
        <Route path="/dev/testing" element={
          <ProtectedRoute>
            <Suspense fallback={<Loading />}>
              <TestingSuite />
            </Suspense>
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
