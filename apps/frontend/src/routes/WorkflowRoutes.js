import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Workflow Routes - Complete routing for workflow features
 */
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { WorkflowProvider } from '../contexts/WorkflowContext';
// Lazy load components for better performance
var WorkflowsPage = React.lazy(function () { return import('../pages/Workflows/index'); });
var WorkflowBuilder = React.lazy(function () { return import('../pages/Workflows/Builder'); });
var ModernBuilder = React.lazy(function () { return import('../pages/Workflows/ModernBuilder'); });
var WorkflowDetail = React.lazy(function () { return import('../pages/Workflows/Detail'); });
var WorkflowExecution = React.lazy(function () { return import('../pages/Workflows/Execution'); });
var WorkflowTemplates = React.lazy(function () { return import('../pages/Workflows/Templates'); });
var WorkflowRoutes = function () {
    return (_jsx(WorkflowProvider, { children: _jsx(React.Suspense, { fallback: _jsx("div", { className: "flex items-center justify-center h-screen", children: _jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-primary" }) }), children: _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(WorkflowsPage, {}) }), _jsx(Route, { path: "/builder", element: _jsx(ModernBuilder, {}) }), _jsx(Route, { path: "/builder/:id", element: _jsx(ModernBuilder, {}) }), _jsx(Route, { path: "/legacy-builder", element: _jsx(WorkflowBuilder, {}) }), _jsx(Route, { path: "/legacy-builder/:id", element: _jsx(WorkflowBuilder, {}) }), _jsx(Route, { path: "/:id", element: _jsx(WorkflowDetail, {}) }), _jsx(Route, { path: "/:id/execution", element: _jsx(WorkflowExecution, {}) }), _jsx(Route, { path: "/executions/:executionId", element: _jsx(WorkflowExecution, {}) }), _jsx(Route, { path: "/templates", element: _jsx(WorkflowTemplates, {}) }), _jsx(Route, { path: "/templates/:templateId", element: _jsx(WorkflowTemplates, {}) }), _jsx(Route, { path: "*", element: _jsx(WorkflowsPage, {}) })] }) }) }));
};
export default WorkflowRoutes;
