import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import MainLayout from '@/components/layout/MainLayout';
import Loading from '@/components/core/Loading';
import { ProtectedRoute } from '@/components/core/ProtectedRoute';
import { PublicRoute } from '@/components/core/PublicRoute';
// Lazy-loaded components
var Landing = React.lazy(function () { return import('@/pages/Landing'); });
var Login = React.lazy(function () { return import('@/pages/auth/Login'); });
var Register = React.lazy(function () { return import('@/pages/auth/Register'); });
var ForgotPassword = React.lazy(function () { return import('@/pages/auth/ForgotPassword'); });
var ResetPassword = React.lazy(function () { return import('@/pages/auth/ResetPassword'); });
var SSO = React.lazy(function () { return import('@/pages/auth/SSO'); });
var Dashboard = React.lazy(function () { return import('@/pages/dashboard'); });
var Analytics = React.lazy(function () { return import('@/pages/Analytics'); });
var AIAgentPortal = React.lazy(function () { return import('@/pages/AIAgentPortal'); });
var OnboardingFlow = React.lazy(function () { return import('@/pages/OnboardingFlow'); });
var AdminRoutes = React.lazy(function () { return import('@/pages/Admin'); });
var WorkspaceRoutes = React.lazy(function () { return import('@/pages/workspace'); });
var SettingsRoutes = React.lazy(function () { return import('@/pages/settings'); });
var NotFound = React.lazy(function () { return import('@/pages/404'); });
var TimelineDemo = React.lazy(function () { return import('@/pages/TimelineDemo'); });
var GraphDemo = React.lazy(function () { return import('@/pages/graph-demo'); });
var PrivacyPolicy = React.lazy(function () { return import('@/pages/legal/PrivacyPolicy'); });
var TermsOfService = React.lazy(function () { return import('@/pages/legal/TermsOfService'); });
var OnboardingPreview = React.lazy(function () { return import('@/pages/preview/OnboardingPreview'); });
export function AppRoutes() {
    var isLoading = useAuth().isLoading;
    if (isLoading) {
        return _jsx(Loading, {});
    }
    return (_jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(Landing, {}) }), _jsxs(Route, { path: "auth", element: _jsx(PublicRoute, {}), children: [_jsx(Route, { path: "login", element: _jsx(Suspense, { fallback: _jsx(Loading, {}), children: _jsx(Login, {}) }) }), _jsx(Route, { path: "register", element: _jsx(Suspense, { fallback: _jsx(Loading, {}), children: _jsx(Register, {}) }) }), _jsx(Route, { path: "forgot-password", element: _jsx(Suspense, { fallback: _jsx(Loading, {}), children: _jsx(ForgotPassword, {}) }) }), _jsx(Route, { path: "reset-password/:token", element: _jsx(Suspense, { fallback: _jsx(Loading, {}), children: _jsx(ResetPassword, {}) }) }), _jsx(Route, { path: "sso/:provider", element: _jsx(Suspense, { fallback: _jsx(Loading, {}), children: _jsx(SSO, {}) }) })] }), _jsx(Route, { path: "timeline-demo", element: _jsx(Suspense, { fallback: _jsx(Loading, {}), children: _jsx(TimelineDemo, {}) }) }), _jsx(Route, { path: "graph-demo", element: _jsx(Suspense, { fallback: _jsx(Loading, {}), children: _jsx(GraphDemo, {}) }) }), _jsxs(Route, { path: "legal", children: [_jsx(Route, { path: "privacy-policy", element: _jsx(Suspense, { fallback: _jsx(Loading, {}), children: _jsx(PrivacyPolicy, {}) }) }), _jsx(Route, { path: "terms-of-service", element: _jsx(Suspense, { fallback: _jsx(Loading, {}), children: _jsx(TermsOfService, {}) }) })] }), _jsx(Route, { element: _jsx(ProtectedRoute, {}), children: _jsxs(Route, { element: _jsx(MainLayout, {}), children: [_jsx(Route, { path: "dashboard", element: _jsx(Suspense, { fallback: _jsx(Loading, {}), children: _jsx(Dashboard, {}) }) }), _jsx(Route, { path: "analytics", element: _jsx(Suspense, { fallback: _jsx(Loading, {}), children: _jsx(Analytics, {}) }) }), _jsx(Route, { path: "ai-portal", element: _jsx(Suspense, { fallback: _jsx(Loading, {}), children: _jsx(AIAgentPortal, {}) }) }), _jsx(Route, { path: "onboarding", element: _jsx(Suspense, { fallback: _jsx(Loading, {}), children: _jsx(OnboardingFlow, {}) }) }), _jsx(Route, { path: "admin/*", element: _jsx(Suspense, { fallback: _jsx(Loading, {}), children: _jsx(AdminRoutes, {}) }) }), _jsx(Route, { path: "workspace/*", element: _jsx(Suspense, { fallback: _jsx(Loading, {}), children: _jsx(WorkspaceRoutes, {}) }) }), _jsx(Route, { path: "settings/*", element: _jsx(Suspense, { fallback: _jsx(Loading, {}), children: _jsx(SettingsRoutes, {}) }) })] }) }), _jsx(Route, { path: "preview", children: _jsx(Route, { path: "onboarding", element: _jsx(Suspense, { fallback: _jsx(Loading, {}), children: _jsx(OnboardingPreview, {}) }) }) }), _jsx(Route, { path: "*", element: _jsx(Suspense, { fallback: _jsx(Loading, {}), children: _jsx(NotFound, {}) }) })] }));
}
