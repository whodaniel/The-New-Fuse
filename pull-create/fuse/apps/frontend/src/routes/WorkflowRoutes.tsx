// @ts-nocheck
/**
 * Workflow Routes - Complete routing for workflow features
 */

import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { WorkflowProvider } from '../contexts/WorkflowContext';

// Lazy load components for better performance
const WorkflowsPage = React.lazy(() => import('../pages/Workflows/index'));
const WorkflowBuilder = React.lazy(() => import('../pages/Workflows/Builder'));
const ModernBuilder = React.lazy(() => import('../pages/Workflows/ModernBuilder'));
const WorkflowDetail = React.lazy(() => import('../pages/Workflows/Detail'));
const WorkflowExecution = React.lazy(() => import('../pages/Workflows/Execution'));
const WorkflowTemplates = React.lazy(() => import('../pages/Workflows/Templates'));

const WorkflowRoutes: React.FC = () => {
  return (
    <WorkflowProvider>
      <React.Suspense
        fallback={
          <div className="flex items-center justify-center h-screen">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        }
      >
        <Routes>
          {/* Main workflows page */}
          <Route path="/" element={<WorkflowsPage />} />

          {/* Workflow builder */}
          <Route path="/builder" element={<ModernBuilder />} />
          <Route path="/builder/:id" element={<ModernBuilder />} />
          <Route path="/legacy-builder" element={<WorkflowBuilder />} />
          <Route path="/legacy-builder/:id" element={<WorkflowBuilder />} />

          {/* Workflow detail */}
          <Route path="/:id" element={<WorkflowDetail />} />

          {/* Workflow execution */}
          <Route path="/:id/execution" element={<WorkflowExecution />} />
          <Route path="/executions/:executionId" element={<WorkflowExecution />} />

          {/* Workflow templates */}
          <Route path="/templates" element={<WorkflowTemplates />} />
          <Route path="/templates/:templateId" element={<WorkflowTemplates />} />

          {/* Catch-all redirect to main page */}
          <Route path="*" element={<WorkflowsPage />} />
        </Routes>
      </React.Suspense>
    </WorkflowProvider>
  );
};

export default WorkflowRoutes;
