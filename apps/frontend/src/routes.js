import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './providers/AuthProvider';
import MainLayout from './components/layout/MainLayout';
import { LandingRedesigned } from './pages/LandingRedesigned';
import { MemoryInspector } from '@the-new-fuse/ui-consolidated/src/components/MemoryInspector';
import { MetricsDashboard } from '@the-new-fuse/ui-consolidated/src/components/MetricsDashboard';
// Lazy-loaded components
var Dashboard = lazy(function () { return import('./pages/Dashboard.js'); });
var AIPortal = lazy(function () { return import('./pages/AIPortal.js'); });
var Workflows = lazy(function () { return import('./pages/Workflows.js'); });
var Analytics = lazy(function () { return import('./pages/Analytics.js'); });
var Settings = lazy(function () { return import('./pages/Settings.js'); });
var Login = lazy(function () { return import('./pages/auth/Login.js'); });
var Register = lazy(function () { return import('./pages/auth/Register.js'); });
var ForgotPassword = lazy(function () { return import('./pages/auth/ForgotPassword.js'); });
var NotFound = lazy(function () { return import('./pages/NotFound.js'); });
// Fairtable Components
var FairtableDashboard = lazy(function () { return import('./pages/fairtable/FairtableDashboard.js'); });
var FairtableGrid = lazy(function () { return import('./pages/fairtable/FairtableGrid.js'); });
var FairtableKanban = lazy(function () { return import('./pages/fairtable/FairtableKanban.js'); });
var FairtableTimeline = lazy(function () { return import('./pages/fairtable/FairtableTimeline.js'); });
// Web3 & Blockchain Components
var NFTMarketplace = lazy(function () { return import('./pages/web3/NFTMarketplace.js'); });
var SmartContracts = lazy(function () { return import('./pages/web3/SmartContracts.js'); });
var WalletConnect = lazy(function () { return import('./pages/web3/WalletConnect.js'); });
var RevenueTracker = lazy(function () { return import('./pages/web3/RevenueTracker.js'); });
// Workflow Components
var WorkflowBuilder = lazy(function () { return import('./pages/workflows/WorkflowBuilder.js'); });
var TemplateLibrary = lazy(function () { return import('./pages/workflows/TemplateLibrary.js'); });
var AutomationJobs = lazy(function () { return import('./pages/workflows/AutomationJobs.js'); });
// Data Management Components
var DatabaseExplorer = lazy(function () { return import('./pages/data/DatabaseExplorer.js'); });
var ImportExport = lazy(function () { return import('./pages/data/ImportExport.js'); });
var DataPipeline = lazy(function () { return import('./pages/data/DataPipeline.js'); });
// Web Scraping Components
var WebScrapingDashboard = lazy(function () { return import('./pages/scraping/WebScrapingDashboard.js'); });
var ScrapingJobs = lazy(function () { return import('./pages/scraping/ScrapingJobs.js'); });
// Admin & Security Components
var UserManagement = lazy(function () { return import('./pages/admin/UserManagement.js'); });
var SecurityDashboard = lazy(function () { return import('./pages/admin/SecurityDashboard.js'); });
var SystemMonitoring = lazy(function () { return import('./pages/admin/SystemMonitoring.js'); });
var FeatureFlags = lazy(function () { return import('./pages/admin/FeatureFlags.js'); });
// Development Tools Components  
var ExtensionManager = lazy(function () { return import('./pages/dev/ExtensionManager.js'); });
var PackageRegistry = lazy(function () { return import('./pages/dev/PackageRegistry.js'); });
var TestingSuite = lazy(function () { return import('./pages/dev/TestingSuite.js'); });
// Loading component
var Loading = function () { return (_jsx("div", { className: "flex items-center justify-center h-screen", children: _jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" }) })); };
// Protected route component
var ProtectedRoute = function (_a) {
    var children = _a.children;
    var _b = useAuth(), isAuthenticated = _b.isAuthenticated, isLoading = _b.isLoading;
    if (isLoading) {
        return _jsx(Loading, {});
    }
    if (!isAuthenticated) {
        return _jsx(Navigate, { to: "/auth/login", replace: true });
    }
    return _jsx(_Fragment, { children: children });
};
// Public route component (accessible only when NOT authenticated)
var PublicRoute = function (_a) {
    var children = _a.children;
    var _b = useAuth(), isAuthenticated = _b.isAuthenticated, isLoading = _b.isLoading;
    if (isLoading) {
        return _jsx(Loading, {});
    }
    if (isAuthenticated) {
        return _jsx(Navigate, { to: "/dashboard", replace: true });
    }
    return _jsx(_Fragment, { children: children });
};
export function AppRoutes() {
    var isLoading = useAuth().isLoading;
    if (isLoading) {
        return _jsx(Loading, {});
    }
    return (_jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(LandingRedesigned, {}) }), _jsxs(Route, { path: "/auth", children: [_jsx(Route, { path: "login", element: _jsx(PublicRoute, { children: _jsx(Suspense, { fallback: _jsx(Loading, {}), children: _jsx(Login, {}) }) }) }), _jsx(Route, { path: "register", element: _jsx(PublicRoute, { children: _jsx(Suspense, { fallback: _jsx(Loading, {}), children: _jsx(Register, {}) }) }) }), _jsx(Route, { path: "forgot-password", element: _jsx(PublicRoute, { children: _jsx(Suspense, { fallback: _jsx(Loading, {}), children: _jsx(ForgotPassword, {}) }) }) })] }), _jsxs(Route, { element: _jsx(MainLayout, {}), children: [_jsx(Route, { path: "/dashboard", element: _jsx(ProtectedRoute, { children: _jsx(Suspense, { fallback: _jsx(Loading, {}), children: _jsx(Dashboard, {}) }) }) }), _jsx(Route, { path: "/ai-portal", element: _jsx(ProtectedRoute, { children: _jsx(Suspense, { fallback: _jsx(Loading, {}), children: _jsx(AIPortal, {}) }) }) }), _jsx(Route, { path: "/workflows", element: _jsx(ProtectedRoute, { children: _jsx(Suspense, { fallback: _jsx(Loading, {}), children: _jsx(Workflows, {}) }) }) }), _jsx(Route, { path: "/analytics", element: _jsx(ProtectedRoute, { children: _jsx(Suspense, { fallback: _jsx(Loading, {}), children: _jsx(Analytics, {}) }) }) }), _jsx(Route, { path: "/settings", element: _jsx(ProtectedRoute, { children: _jsx(Suspense, { fallback: _jsx(Loading, {}), children: _jsx(Settings, {}) }) }) }), _jsx(Route, { path: "/memory", element: _jsx(ProtectedRoute, { children: _jsx(MemoryInspector, {}) }) }), _jsx(Route, { path: "/metrics", element: _jsx(ProtectedRoute, { children: _jsx(MetricsDashboard, {}) }) }), _jsx(Route, { path: "/fairtable", element: _jsx(ProtectedRoute, { children: _jsx(Suspense, { fallback: _jsx(Loading, {}), children: _jsx(FairtableDashboard, {}) }) }) }), _jsx(Route, { path: "/fairtable/grid", element: _jsx(ProtectedRoute, { children: _jsx(Suspense, { fallback: _jsx(Loading, {}), children: _jsx(FairtableGrid, {}) }) }) }), _jsx(Route, { path: "/fairtable/kanban", element: _jsx(ProtectedRoute, { children: _jsx(Suspense, { fallback: _jsx(Loading, {}), children: _jsx(FairtableKanban, {}) }) }) }), _jsx(Route, { path: "/fairtable/timeline", element: _jsx(ProtectedRoute, { children: _jsx(Suspense, { fallback: _jsx(Loading, {}), children: _jsx(FairtableTimeline, {}) }) }) }), _jsx(Route, { path: "/nft/marketplace", element: _jsx(ProtectedRoute, { children: _jsx(Suspense, { fallback: _jsx(Loading, {}), children: _jsx(NFTMarketplace, {}) }) }) }), _jsx(Route, { path: "/contracts/dashboard", element: _jsx(ProtectedRoute, { children: _jsx(Suspense, { fallback: _jsx(Loading, {}), children: _jsx(SmartContracts, {}) }) }) }), _jsx(Route, { path: "/wallet/connect", element: _jsx(ProtectedRoute, { children: _jsx(Suspense, { fallback: _jsx(Loading, {}), children: _jsx(WalletConnect, {}) }) }) }), _jsx(Route, { path: "/revenue/dashboard", element: _jsx(ProtectedRoute, { children: _jsx(Suspense, { fallback: _jsx(Loading, {}), children: _jsx(RevenueTracker, {}) }) }) }), _jsx(Route, { path: "/workflows/builder", element: _jsx(ProtectedRoute, { children: _jsx(Suspense, { fallback: _jsx(Loading, {}), children: _jsx(WorkflowBuilder, {}) }) }) }), _jsx(Route, { path: "/workflows/templates", element: _jsx(ProtectedRoute, { children: _jsx(Suspense, { fallback: _jsx(Loading, {}), children: _jsx(TemplateLibrary, {}) }) }) }), _jsx(Route, { path: "/workflows/jobs", element: _jsx(ProtectedRoute, { children: _jsx(Suspense, { fallback: _jsx(Loading, {}), children: _jsx(AutomationJobs, {}) }) }) }), _jsx(Route, { path: "/data/explorer", element: _jsx(ProtectedRoute, { children: _jsx(Suspense, { fallback: _jsx(Loading, {}), children: _jsx(DatabaseExplorer, {}) }) }) }), _jsx(Route, { path: "/data/transfer", element: _jsx(ProtectedRoute, { children: _jsx(Suspense, { fallback: _jsx(Loading, {}), children: _jsx(ImportExport, {}) }) }) }), _jsx(Route, { path: "/data/pipeline", element: _jsx(ProtectedRoute, { children: _jsx(Suspense, { fallback: _jsx(Loading, {}), children: _jsx(DataPipeline, {}) }) }) }), _jsx(Route, { path: "/scraping/dashboard", element: _jsx(ProtectedRoute, { children: _jsx(Suspense, { fallback: _jsx(Loading, {}), children: _jsx(WebScrapingDashboard, {}) }) }) }), _jsx(Route, { path: "/scraping/jobs", element: _jsx(ProtectedRoute, { children: _jsx(Suspense, { fallback: _jsx(Loading, {}), children: _jsx(ScrapingJobs, {}) }) }) }), _jsx(Route, { path: "/admin/users", element: _jsx(ProtectedRoute, { children: _jsx(Suspense, { fallback: _jsx(Loading, {}), children: _jsx(UserManagement, {}) }) }) }), _jsx(Route, { path: "/admin/security", element: _jsx(ProtectedRoute, { children: _jsx(Suspense, { fallback: _jsx(Loading, {}), children: _jsx(SecurityDashboard, {}) }) }) }), _jsx(Route, { path: "/admin/monitoring", element: _jsx(ProtectedRoute, { children: _jsx(Suspense, { fallback: _jsx(Loading, {}), children: _jsx(SystemMonitoring, {}) }) }) }), _jsx(Route, { path: "/admin/features", element: _jsx(ProtectedRoute, { children: _jsx(Suspense, { fallback: _jsx(Loading, {}), children: _jsx(FeatureFlags, {}) }) }) }), _jsx(Route, { path: "/dev/extensions", element: _jsx(ProtectedRoute, { children: _jsx(Suspense, { fallback: _jsx(Loading, {}), children: _jsx(ExtensionManager, {}) }) }) }), _jsx(Route, { path: "/dev/packages", element: _jsx(ProtectedRoute, { children: _jsx(Suspense, { fallback: _jsx(Loading, {}), children: _jsx(PackageRegistry, {}) }) }) }), _jsx(Route, { path: "/dev/testing", element: _jsx(ProtectedRoute, { children: _jsx(Suspense, { fallback: _jsx(Loading, {}), children: _jsx(TestingSuite, {}) }) }) })] }), _jsx(Route, { path: "*", element: _jsx(Suspense, { fallback: _jsx(Loading, {}), children: _jsx(NotFound, {}) }) })] }));
}
