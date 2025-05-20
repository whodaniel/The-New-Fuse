import React, { lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';

// Lazy-loaded components
export const LazyWorkflowCanvas = lazy(() => import('./WorkflowCanvas.js').then(modul(e: any) => ({ default: module.WorkflowCanvas })));
export const LazyNodeToolbox = lazy(() => import('./NodeToolbox.js').then(modul(e: any) => ({ default: module.NodeToolbox })));
export const LazyNodeProperties = lazy(() => import('./NodeProperties.js').then(modul(e: any) => ({ default: module.NodeProperties })));
export const LazyWorkflowExecutionContext = lazy(() => import('./WorkflowExecutionContext.js').then(modul(e: any) => ({ default: module.WorkflowExecutionContext })));
export const LazyWorkflowDebugger = lazy(() => import('./WorkflowDebugger.js').then(modul(e: any) => ({ default: module.WorkflowDebugger })));
export const LazyWorkflowAnalytics = lazy(() => import('./WorkflowAnalytics.js').then(modul(e: any) => ({ default: module.WorkflowAnalytics })));
export const LazyWorkflowTemplates = lazy(() => import('./WorkflowTemplates.js').then(modul(e: any) => ({ default: module.WorkflowTemplates })));

// Lazy-loaded node components
export const LazyAgentNode = lazy(() => import('./nodes/agent-node.js').then(modul(e: any) => ({ default: module.AgentNode })));
export const LazyA2ANode = lazy(() => import('./nodes/a2a-node.js').then(modul(e: any) => ({ default: module.A2ANode })));
export const LazyMCPToolNode = lazy(() => import('./nodes/mcp-tool-node.js').then(modul(e: any) => ({ default: module.MCPToolNode })));
export const LazyTransformNode = lazy(() => import('./nodes/transform-node.js').then(modul(e: any) => ({ default: module.TransformNode })));
export const LazyConditionNode = lazy(() => import('./nodes/condition-node.js').then(modul(e: any) => ({ default: module.ConditionNode })));
export const LazyNotificationNode = lazy(() => import('./nodes/notification-node.js').then(modul(e: any) => ({ default: module.NotificationNode })));
export const LazyInputNode = lazy(() => import('./nodes/input-node.js').then(modul(e: any) => ({ default: module.InputNode })));
export const LazyOutputNode = lazy(() => import('./nodes/output-node.js').then(modul(e: any) => ({ default: module.OutputNode })));

// Loading fallback
const LoadingFallback = () => (
  <div className="flex items-center justify-center h-full w-full">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

// Wrapped components with Suspense
export const WorkflowCanvas = (props: any) => (
  <Suspense fallback={<LoadingFallback />}>
    <LazyWorkflowCanvas {...props} />
  </Suspense>
);

export const NodeToolbox = (props: any) => (
  <Suspense fallback={<LoadingFallback />}>
    <LazyNodeToolbox {...props} />
  </Suspense>
);

export const NodeProperties = (props: any) => (
  <Suspense fallback={<LoadingFallback />}>
    <LazyNodeProperties {...props} />
  </Suspense>
);

export const WorkflowExecutionContext = (props: any) => (
  <Suspense fallback={<LoadingFallback />}>
    <LazyWorkflowExecutionContext {...props} />
  </Suspense>
);

export const WorkflowDebugger = (props: any) => (
  <Suspense fallback={<LoadingFallback />}>
    <LazyWorkflowDebugger {...props} />
  </Suspense>
);

export const WorkflowAnalytics = (props: any) => (
  <Suspense fallback={<LoadingFallback />}>
    <LazyWorkflowAnalytics {...props} />
  </Suspense>
);

export const WorkflowTemplates = (props: any) => (
  <Suspense fallback={<LoadingFallback />}>
    <LazyWorkflowTemplates {...props} />
  </Suspense>
);

// Node components
export const AgentNode = (props: any) => (
  <Suspense fallback={<LoadingFallback />}>
    <LazyAgentNode {...props} />
  </Suspense>
);

export const A2ANode = (props: any) => (
  <Suspense fallback={<LoadingFallback />}>
    <LazyA2ANode {...props} />
  </Suspense>
);

export const MCPToolNode = (props: any) => (
  <Suspense fallback={<LoadingFallback />}>
    <LazyMCPToolNode {...props} />
  </Suspense>
);

export const TransformNode = (props: any) => (
  <Suspense fallback={<LoadingFallback />}>
    <LazyTransformNode {...props} />
  </Suspense>
);

export const ConditionNode = (props: any) => (
  <Suspense fallback={<LoadingFallback />}>
    <LazyConditionNode {...props} />
  </Suspense>
);

export const NotificationNode = (props: any) => (
  <Suspense fallback={<LoadingFallback />}>
    <LazyNotificationNode {...props} />
  </Suspense>
);

export const InputNode = (props: any) => (
  <Suspense fallback={<LoadingFallback />}>
    <LazyInputNode {...props} />
  </Suspense>
);

export const OutputNode = (props: any) => (
  <Suspense fallback={<LoadingFallback />}>
    <LazyOutputNode {...props} />
  </Suspense>
);
