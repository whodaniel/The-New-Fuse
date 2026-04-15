export interface JulesSessionStatus {
  state:
    | 'STATE_UNSPECIFIED'
    | 'PENDING'
    | 'RUNNING'
    | 'PLANNING'
    | 'SUCCEEDED'
    | 'FAILED'
    | 'CANCELLED';
  // Add other relevant fields from the Jules API response if needed
}

export interface WebhookContext {
  tenantId: string;
  taskId: string;
  conversationId?: string;
}
