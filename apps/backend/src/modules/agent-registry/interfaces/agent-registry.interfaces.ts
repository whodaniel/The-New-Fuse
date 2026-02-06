export interface IAgentCapability {
  name: string;
  type: 'core' | 'extended' | 'custom';
  version?: string;
  description?: string;
  parameters?: Record<string, any>;
}

export interface IRegistrationData {
  name: string;
  version?: string;
  author?: string;
  description?: string;
  capabilities: IAgentCapability[];
  metadata?: Record<string, any>;
  invitationCode: string;
  tenantId?: string;
  organizationId?: string;
  agencyId?: string;
  identity?: Record<string, any>;
  trust?: Record<string, any>;
  protocols?: Record<string, any>;
  heartbeatInterval?: number;
}

export interface IOnboardingContext {
  registrationId: string;
  agentId: string;
  agentName: string;
  currentStep: string;
  progress: number;
  data: Record<string, any>;
}

export interface ICapabilityTestResult {
  capabilityName: string;
  passed: boolean;
  score?: number;
  details?: string;
  errors?: string[];
}

export interface IOrientationStep {
  id: string;
  name: string;
  description: string;
  content: string;
  order: number;
  estimatedDuration: number; // in seconds
  resources?: string[];
  interactiveDemo?: boolean;
}

export interface IAgentMetric {
  type: string;
  value: number;
  unit?: string;
  tags?: Record<string, any>;
}
