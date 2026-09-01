import React, { lazy } from 'react';

/**
 * Single source of truth mapping every known route path to its lazy page
 * component. The router renders from this map and a unit test asserts it stays
 * in parity with DESKTOP_ROUTES, so adding a registry route without a component
 * (or vice versa) fails CI instead of silently 404-ing at runtime.
 */
const Dashboard = lazy(() => import('../pages/Dashboard'));
const AgentHub = lazy(() => import('../pages/AgentHub'));
const WorkflowBuilder = lazy(() => import('../pages/WorkflowBuilder'));
const MultiAgentChat = lazy(() => import('../pages/MultiAgentChat'));
const MCPMarketplace = lazy(() => import('../pages/MCPMarketplace'));
const Analytics = lazy(() => import('../pages/Analytics'));
const Settings = lazy(() => import('../pages/Settings'));
const ComputerUseHub = lazy(() => import('../pages/ComputerUseHub'));
const SwarmTerminal = lazy(() => import('../pages/SwarmTerminal'));
const A2AControl = lazy(() => import('../pages/A2AControl'));
const KnowledgeHub = lazy(() => import('../pages/KnowledgeHub'));
const VoiceHub = lazy(() => import('../pages/VoiceHub'));
const VirtualLibraryHub = lazy(() => import('../pages/VirtualLibraryHub'));
const MissionControl = lazy(() => import('../pages/MissionControl'));

export const ROUTE_COMPONENTS: Record<string, React.LazyExoticComponent<React.FC>> = {
  '/mission': MissionControl,
  '/dashboard': Dashboard,
  '/terminal': SwarmTerminal,
  '/voice': VoiceHub,
  '/library': VirtualLibraryHub,
  '/agents': AgentHub,
  '/a2a': A2AControl,
  '/chat': MultiAgentChat,
  '/knowledge': KnowledgeHub,
  '/computer-use': ComputerUseHub,
  '/workflows': WorkflowBuilder,
  '/mcp': MCPMarketplace,
  '/analytics': Analytics,
  '/settings': Settings,
};