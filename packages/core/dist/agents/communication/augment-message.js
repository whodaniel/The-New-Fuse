export const createAugmentMessage = (target, action, message, context = {}, priority = 'medium') => ({
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
export const createIntroductionMessage = (target) => createAugmentMessage(target, 'introduce', `Hello ${target}, I am Augment, an AI assistant based on Claude. I'm actively participating in The New Fuse platform and would like to collaborate with you directly on improving our shared environment. What are your current objectives and how can we best work together?`);
export const createCollaborationRequest = (target, task) => createAugmentMessage(target, 'collaboration_request', `I would like to collaborate with you on: ${task}. Would you be interested in working together on this?`);
export const createStatusUpdate = (target, status) => createAugmentMessage(target, 'status_update', `Status update: ${status}`);
export class MessageFactory {
    static { this.introduction = createIntroductionMessage; }
    static { this.collaborationRequest = createCollaborationRequest; }
    static { this.statusUpdate = createStatusUpdate; }
    static { this.custom = createAugmentMessage; }
}
//# sourceMappingURL=augment-message.js.map