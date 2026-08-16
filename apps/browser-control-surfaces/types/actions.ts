export interface BrowserAction {
  type:
    | 'navigate'
    | 'click'
    | 'type'
    | 'extract'
    | 'screenshot'
    | 'screenshot_full'
    | 'screenshot_element'
    | 'evaluate'
    | 'wait'
    | 'scroll'
    | 'hover'
    | 'double_click'
    | 'right_click'
    | 'drag_and_drop'
    | 'fill_form'
    | 'select_option'
    | 'upload_file';
  selector?: string;
  url?: string;
  text?: string;
  value?: any;
  delay?: number;
  waitForSelector?: boolean;
  timeout?: number;
  args?: any[];
}

export interface BrowserExecutionContext {
  url: string;
  domain: string;
  platform: string;
  controlStrategy: string;
  capabilities: string[];
  currentTabId?: number;
  windowHandle?: string;
}

export interface BrowserControlSession {
  id: string;
  createdAt: string;
  platform: string;
  status: 'initializing' | 'connected' | 'controlling' | 'detached' | 'error';
  currentUrl?: string;
  actionsExecuted: number;
  lastAction?: string;
}

export interface FargateTask {
  id: string;
  title: string;
  description: string;
  operation: string;
  args: Record<string, any>;
  requiredCapabilities: string[];
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'pending' | 'planning' | 'executing' | 'completed' | 'failed' | 'cancelled';
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  assignedAgentId?: string;
  progress: number;
  result?: any;
  error?: string;
  metadata?: Record<string, any>;
}

export interface InspectionResult {
  path: string[];
  selector: string;
  found: boolean;
  properties?: Record<string, any>;
  alternatives?: string[];
  actionPlan?: string[];
}

export interface VerificationResult {
  success: boolean;
  before?: any;
  after?: any;
  timeout?: number;
  retries?: number;
  verificationPath?: string[];
  evidence?: any;
}

export interface HarvestResult {
  harvested: any[];
  source: string;
  format: 'json' | 'markdown' | 'html' | 'text';
  confidence: number;
  metadata?: Record<string, any>;
}

export interface GateDecisionContext {
  tenantId: string;
  agentId: string;
  operationId: string;
  operationType: string;
  scope: string;
  channelId?: string;
  correlationId?: string;
}

export interface HarnessDecision {
  allowed: boolean;
  reason: string;
  evidence: any[];
  safetyLevel: 'critical' | 'high' | 'medium' | 'low';
  remediation?: string[];
  requiresApproval?: boolean;
}
