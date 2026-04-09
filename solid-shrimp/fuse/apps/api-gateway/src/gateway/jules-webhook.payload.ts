export class JulesWebhookPayload {
  sessionId: string;
  state: 'IN_PROGRESS' | 'NEEDS_APPROVAL' | 'USER_INPUT_REQUIRED' | 'COMPLETED' | 'FAILED';
  status: string;
  message?: string;
  timestamp: string;
}
