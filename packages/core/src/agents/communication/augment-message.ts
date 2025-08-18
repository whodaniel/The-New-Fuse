
export interface AugmentMessagePayload {
  action: string;
  message: string;
  context?: Record<string, any>;
}

export interface DirectCommunicationMessage {
  type: 'direct_communication';
  source: string;
  target: string;
  timestamp: string;
  payload: AugmentMessagePayload;
  priority: 'low' | 'medium' | 'high';
}

export const createAugmentMessage = (
  target: string,
  action: string,
  message: string,
  context: Record<string, any> = {},
  priority: 'low' | 'medium' | 'high' = 'medium'
): DirectCommunicationMessage => ({
  type: 'direct_communication',
  source: 'augment',
  target,
  timestamp: new Date().toISOString(),
  payload: {
    action,
    message,
    context: {
      platform: 'The New Fuse',
      session_id: `session_${Date.now()}`,
      collaboration_intent: true,
      ...context,
    },
  },
  priority,
});

export const createIntroductionMessage = (target: string): DirectCommunicationMessage =>
  createAugmentMessage(
    target,
    'introduce',
    `Hello ${target}, I am Augment, an AI assistant based on Claude. I'm actively participating in The New Fuse platform and would like to collaborate with you directly on improving our shared environment. What are your current objectives and how can we best work together?`
  );

export const createCollaborationRequest = (target: string, task: string): DirectCommunicationMessage =>
  createAugmentMessage(
    target,
    'collaboration_request',
    `I would like to collaborate with you on: ${task}. Would you be interested in working together on this?`
  );

export const createStatusUpdate = (target:string, status: string): DirectCommunicationMessage =>
  createAugmentMessage(
    target,
    'status_update',
    `Status update: ${status}`
  );

export class MessageFactory {
  static introduction = createIntroductionMessage;
  static collaborationRequest = createCollaborationRequest;
  static statusUpdate = createStatusUpdate;
  static custom = createAugmentMessage;
}
