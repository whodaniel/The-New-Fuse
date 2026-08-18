// Main Component
export { BrowserControlSurface } from './BROWSER_CONTROL_SURFACE';
export type { BrowserControlSurfaceProps } from './BROWSER_CONTROL_SURFACE';

// Components
export { BrowserDetection } from './components/BrowserDetection';
export type { BrowserDetectionProps } from './components/BrowserDetection';

export { ChannelManager } from './components/ChannelManager';
export type { ChannelManagerProps } from './components/ChannelManager';

export { AgentOrchestrator } from './components/AgentOrchestrator';
export type { AgentOrchestratorProps } from './components/AgentOrchestrator';

export { SecurityMonitor } from './components/SecurityMonitor';
export type { SecurityMonitorProps } from './components/SecurityMonitor';

export { TnfHarnessStatusBar } from './components/TnfHarnessStatusBar';
export type { TnfHarnessStatusBarProps } from './components/TnfHarnessStatusBar';

// Hooks
export { useTnfFederation } from './hooks/useTnfFederation';
export type { TnfFederationState } from './hooks/useTnfFederation';

export { useBrowserState } from './hooks/useBrowserState';
export type { BrowserState } from './hooks/useBrowserState';

export { useTnfAuthorization } from './hooks/useTnfAuthorization';
export type { TnfAuthorizationState, TnfUser } from './hooks/useTnfAuthorization';

export { useTerminalHeartbeat } from './hooks/useTerminalHeartbeat';
export type { TerminalHeartbeatState } from './hooks/useTerminalHeartbeat';

// Types
export type {
  Agent,
  BrowserPlatform,
  Channel,
  FederationMessage,
  GateDecision,
  HeartbeatStatus,
} from './types/federation';

export type {
  BrowserAction,
  BrowserControlSession,
  BrowserExecutionContext,
  FargateTask,
  GateDecisionContext,
  HarnessDecision,
  HarvestResult,
  InspectionResult,
  VerificationResult,
} from './types/actions';

// Lib
export {
  TnfGateDecision,
  TnfMessageEnvelope,
  buildTrace,
  createMessageEnvelope,
  verifyGateDecision,
  withCorrelation,
} from './lib/harness-protocol';
