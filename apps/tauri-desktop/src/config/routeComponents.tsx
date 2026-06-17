import React, { lazy } from 'react';

/**
 * Single source of truth mapping every known route path to its lazy page
 * component. The router renders from this map and a unit test asserts it stays
 * in parity with DESKTOP_ROUTES, so adding a registry route without a component
 * (or vice versa) fails CI instead of silently 404-ing at runtime.
 */
const Dashboard = lazy(() => import('../pages/Dashboard'));
const AgentHub = lazy(() => import('../pages/AgentHub'));
const AntigravityHub = lazy(() => import('../pages/AntigravityHub'));
const WorkflowBuilder = lazy(() => import('../pages/WorkflowBuilder'));
const MultiAgentChat = lazy(() => import('../pages/MultiAgentChat'));
const MCPMarketplace = lazy(() => import('../pages/MCPMarketplace'));
const Analytics = lazy(() => import('../pages/Analytics'));
const Settings = lazy(() => import('../pages/Settings'));
const WebBrowser = lazy(() => import('../pages/WebBrowser'));
const OAGIHub = lazy(() => import('../pages/OAGIHub'));
const SwarmTerminal = lazy(() => import('../pages/SwarmTerminal'));
const A2AControl = lazy(() => import('../pages/A2AControl'));
const WebParityHub = lazy(() => import('../pages/WebParityHub'));
const PlatformOverview = lazy(() => import('../pages/PlatformOverview'));
const KnowledgeHub = lazy(() => import('../pages/KnowledgeHub'));

export const ROUTE_COMPONENTS: Record<string, React.LazyExoticComponent<React.FC>> = {
  '/platform': PlatformOverview,
  '/dashboard': Dashboard,
  '/browser': WebBrowser,
  '/terminal': SwarmTerminal,
  '/oagi': OAGIHub,
  '/antigravity': AntigravityHub,
  '/agents': AgentHub,
  '/a2a': A2AControl,
  '/chat': MultiAgentChat,
  '/knowledge': KnowledgeHub,
  '/workflows': WorkflowBuilder,
  '/mcp': MCPMarketplace,
  '/analytics': Analytics,
  '/web-hub': WebParityHub,
  '/settings': Settings,
};
