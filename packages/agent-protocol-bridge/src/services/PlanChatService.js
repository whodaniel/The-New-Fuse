"use strict";
/**
 * PlanChatService.ts
 *
 * Traycer-style plan chat and iteration interface.
 * Enables users to iterate on plans with surgical precision and ask questions.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlanChatService = void 0;
const events_1 = require("events");
const uuid_1 = require("uuid");
class PlanChatService extends events_1.EventEmitter {
    chatSessions = new Map();
    planModifications = new Map();
    surgicalEdits = new Map();
    constructor() {
        super();
    }
    /**
     * Start a new chat session for a plan
     */
    async startChatSession(planId, title, context) {
        const sessionId = (0, uuid_1.v4)();
        const session = {
            id: sessionId,
            planId,
            title: title || `Plan Discussion - ${planId.slice(0, 8)},
      status: 'active',
      messages: [],
      modifications: [],
      participants: [],
      context: context || {},
      createdAt: new Date(),
      updatedAt: new Date(),
      lastActivity: new Date()
    };

    this.chatSessions.set(sessionId, session);
    this.planModifications.set(planId, []);
    this.surgicalEdits.set(planId, []);

    // Add system welcome message
    await this.addMessage(sessionId, {`,
            content: `Welcome to the plan discussion for "${title}`, ". You can ask questions, suggest modifications, or provide feedback on any step., : type, 'system': ,
            messageType: 'general'
        };
        this.emit('chatSessionStarted', session);
        return session;
    }
    /**
     * Add a message to a chat session
     */
    async addMessage(sessionId, messageData) {
        const session = this.chatSessions.get(sessionId);
        if (!session) {
            throw new Error(Chat, session, not, found, $, { sessionId });
        }
        const message = {
            ...messageData,
            id: (0, uuid_1.v4)(),
            planId: session.planId,
            timestamp: new Date()
        };
        session.messages.push(message);
        session.lastActivity = new Date();
        session.updatedAt = new Date();
        this.emit('messageAdded', { session, message });
        // Process user messages for plan modifications
        if (message.type === 'user') {
            await this.processUserMessage(session, message);
        }
        return message;
    }
    /**
     * Process user message and suggest plan modifications
     */
    async processUserMessage(session, message) {
        const intent = await this.analyzeMessageIntent(message);
        switch (intent.type) {
            case 'modify_plan':
                await this.handlePlanModificationRequest(session, message, intent);
                break;
            case 'question_about_step':
                await this.handleStepQuestion(session, message, intent);
                break;
            case 'suggest_improvement':
                await this.handleImprovementSuggestion(session, message, intent);
                break;
            case 'request_clarification':
                await this.handleClarificationRequest(session, message, intent);
                break;
            default:
                await this.handleGeneralMessage(session, message);
        }
    }
    /**
     * Analyze message intent using simple pattern matching
     */
    async analyzeMessageIntent(message) {
        const content = message.content.toLowerCase();
        // Plan modification keywords
        if (content.includes('add step') || content.includes('new step') || content.includes('insert')) {
            return { type: 'modify_plan', action: 'add_step', confidence: 0.8 };
        }
        if (content.includes('remove step') || content.includes('delete step') || content.includes('skip')) {
            return { type: 'modify_plan', action: 'remove_step', confidence: 0.8 };
        }
        if (content.includes('change') || content.includes('modify') || content.includes('update')) {
            return { type: 'modify_plan', action: 'modify_step', confidence: 0.7 };
        }
        // Question keywords
        if (content.includes('why') || content.includes('how') || content.includes('what') || content.includes('?')) {
            return { type: 'question_about_step', confidence: 0.6 };
        }
        // Suggestion keywords
        if (content.includes('suggest') || content.includes('recommend') || content.includes('better')) {
            return { type: 'suggest_improvement', confidence: 0.7 };
        }
        // Clarification keywords
        if (content.includes('unclear') || content.includes('explain') || content.includes('clarify')) {
            return { type: 'request_clarification', confidence: 0.6 };
        }
        return { type: 'general', confidence: 0.5 };
    }
    /**
     * Handle plan modification requests
     */
    async handlePlanModificationRequest(session, message, intent) {
        const modification = await this.proposePlanModification(session.planId, intent.action, message.content, message.stepId);
        if (modification) {
            // Add assistant response with the proposed modification
            await this.addMessage(session.id, {
                content: this.generateModificationResponse(modification),
                type: 'assistant',
                messageType: 'suggestion',
                references: [{
                        type: 'step',
                        id: modification.data.stepId || 'plan',
                    } `
          title: Proposed ${modification.type}`,
                    description, modification.reason]
            });
        }
        ;
    }
}
exports.PlanChatService = PlanChatService;
async;
handleStepQuestion(session, ChatSession, message, ChatMessage, intent, any);
Promise < void  > {
    const: stepInfo = message.stepId ? await this.getStepInformation(session.planId, message.stepId) : null,
    let, response = "I'd be happy to help explain the plan details.",
    if(stepInfo) {
        response = this.generateStepExplanation(stepInfo);
    }, else: {
        response = "Could you specify which step you're asking about? You can reference a step by its title or number."
    },
    await, this: .addMessage(session.id, {
        content: response,
        type: 'assistant',
        messageType: 'clarification',
        references: stepInfo ? [{
                type: 'step',
                id: stepInfo.id,
                title: stepInfo.title,
                description: stepInfo.description
            }] : undefined
    })
};
async;
handleImprovementSuggestion(session, ChatSession, message, ChatMessage, intent, any);
Promise < void  > {
    const: suggestion = await this.processImprovementSuggestion(session.planId, message.content),
    await, this: .addMessage(session.id, {
        content: Thank, you, for: the, suggestion, $
    }, { suggestion, : .response }, Would, you, like, me, to, implement, this, change ?  : , type, 'assistant', messageType, 'suggestion')
};
;
async;
handleClarificationRequest(session, ChatSession, message, ChatMessage, intent, any);
Promise < void  > {
    await, this: .addMessage(session.id, {
        content: "I understand you need clarification. Could you be more specific about which aspect of the plan needs explanation?",
        type: 'assistant',
        messageType: 'clarification'
    })
};
async;
handleGeneralMessage(session, ChatSession, message, ChatMessage);
Promise < void  > {
    await, this: .addMessage(session.id, {
        content: "I understand. Is there anything specific about the plan you'd like to discuss or modify?",
        type: 'assistant',
        messageType: 'general'
    })
};
/**
 * Propose a plan modification
 */
async;
proposePlanModification(planId, string, type, string, reason, string, stepId ?  : string);
Promise < PlanModification > {
    const: modification, PlanModification = {
        id: (0, uuid_1.v4)(),
        planId,
        type: type,
        data: { stepId, details: reason },
        reason,
        suggestedBy: 'assistant',
        status: 'proposed',
        timestamp: new Date()
    },
    const: planModifications = this.planModifications.get(planId) || [],
    planModifications, : .push(modification),
    this: .planModifications.set(planId, planModifications),
    this: .emit('modificationProposed', modification),
    return: modification
};
/**
 * Apply a surgical edit to a plan
 */
async;
applySurgicalEdit(edit, (Omit));
Promise < SurgicalEdit > {
    const: surgicalEdit, SurgicalEdit = {
        ...edit,
        id: (0, uuid_1.v4)(),
        timestamp: new Date()
    },
    const: edits = this.surgicalEdits.get(edit.planId) || [],
    edits, : .push(surgicalEdit),
    this: .surgicalEdits.set(edit.planId, edits),
    this: .emit('surgicalEditApplied', surgicalEdit),
    return: surgicalEdit
};
/**
 * Accept a proposed modification
 */
async;
acceptModification(modificationId, string);
Promise < void  > {
    : .planModifications
};
{
    const modification = modifications.find(m => m.id === modificationId);
    if (modification) {
        modification.status = 'accepted';
        this.emit('modificationAccepted', modification);
        return;
    }
    `
    }`;
    throw new Error(Modification, not, found, $, { modificationId } `);
  }

  /**
   * Reject a proposed modification
   */
  async rejectModification(modificationId: string, reason?: string): Promise<void> {
    for (const [planId, modifications] of this.planModifications) {
      const modification = modifications.find(m => m.id === modificationId);
      if (modification) {
        modification.status = 'rejected';
        if (reason) {
          modification.metadata = { ...modification.metadata, rejectionReason: reason };
        }
        this.emit('modificationRejected', modification);
        return;
      }
    }

    throw new Error(Modification not found: ${modificationId});
  }

  /**
   * Get chat session
   */
  getChatSession(sessionId: string): ChatSession | undefined {
    return this.chatSessions.get(sessionId);
  }

  /**
   * Get all chat sessions for a plan
   */
  getChatSessionsForPlan(planId: string): ChatSession[] {
    return Array.from(this.chatSessions.values()).filter(s => s.planId === planId);
  }

  /**
   * Get plan modifications
   */
  getPlanModifications(planId: string): PlanModification[] {
    return this.planModifications.get(planId) || [];
  }

  /**
   * Get surgical edits
   */
  getSurgicalEdits(planId: string): SurgicalEdit[] {
    return this.surgicalEdits.get(planId) || [];
  }

  /**
   * Search messages in a chat session
   */
  searchMessages(sessionId: string, query: string): ChatMessage[] {
    const session = this.chatSessions.get(sessionId);
    if (!session) {
      return [];
    }

    const lowercaseQuery = query.toLowerCase();
    return session.messages.filter(message =>
      message.content.toLowerCase().includes(lowercaseQuery)
    );
  }

  /**
   * End a chat session
   */
  async endChatSession(sessionId: string): Promise<void> {`);
    const session = this.chatSessions.get(sessionId);
    `
    if (!session) {
      throw new Error(Chat session not found: ${sessionId}`;
    ;
}
session.status = 'completed';
session.updatedAt = new Date();
this.emit('chatSessionEnded', session);
generateModificationResponse(modification, PlanModification);
string;
{
    switch (modification.type) {
        case 'add_step':
            return I;
            suggest;
            adding;
            a;
            new step;
            to;
            address;
            your;
            request.This;
            would;
            help;
            ensure;
            $;
            {
                modification.reason;
            }
            ;
            `
`;
        case 'modify_step':
            return I;
            recommend;
            modifying;
            the;
            existing;
            step;
            because;
            $;
            {
                modification.reason;
            }
            `;

      case 'remove_step':
        return Consider removing this step since ${modification.reason}`;
        default:
            return I;
            propose;
            a;
            plan;
            modification: $;
            {
                modification.reason;
            }
            ;
    }
}
async;
getStepInformation(planId, string, stepId, string);
Promise < any > {
    // This would typically fetch from TaskPlanningService
    // For now, return a mock structure
    return: {
        id: stepId,
        title: 'Sample Step',
        description: 'This is a sample step description',
        type: 'file_change',
        status: 'pending'
    }
};
generateStepExplanation(stepInfo, any);
string;
{
    `
    return The step "${stepInfo.title}" is a ${stepInfo.type} operation with status "${stepInfo.status}`;
    ". ${stepInfo.description};;
}
async;
processImprovementSuggestion(planId, string, content, string);
Promise < any > {
    // Simple analysis of improvement suggestions
    const: isPerformanceRelated = content.toLowerCase().includes('performance') ||
        content.toLowerCase().includes('optimize'),
    const: isSecurityRelated = content.toLowerCase().includes('security') ||
        content.toLowerCase().includes('safe'),
    let, response = "I've noted your suggestion for improving the plan.",
    if(isPerformanceRelated) {
        response = "Great performance suggestion! This could help optimize the implementation.";
    }, else: , if(isSecurityRelated) {
        response = "Excellent security consideration! This would enhance the safety of our implementation.";
    },
    return: { response, category: isPerformanceRelated ? 'performance' : isSecurityRelated ? 'security' : 'general' }
};
/**`
 * Export chat session`
 */
async;
exportChatSession(sessionId, string, format, 'json' | 'markdown' | 'text', 'json');
Promise < string > {
    const: session = this.chatSessions.get(sessionId),
    if(, session) {
        throw new Error(Chat, session, not, found, $, { sessionId } ``);
    },
    switch(format) {
    },
    case: 'markdown',
    return: this.exportToMarkdown(session),
    case: 'text',
    return: this.exportToText(session),
    default: ,
    return: JSON.stringify(session, null, 2)
};
exportToMarkdown(session, ChatSession);
string;
{
    let markdown = #, Plan, Chat, Session, { session, title }, n, n;
    `
    markdown += ` ** Plan;
    ID:  ** $;
    {
        session.planId;
    }
    n;
    `
    markdown += **Created:** ${session.createdAt.toISOString()}\n;`;
    markdown +=  ** Status;
     ** $;
    {
        session.status;
    }
    `\n\n;

    markdown += ## Messages\n\n;

    for (const message of session.messages) {
      const timestamp = message.timestamp.toISOString();
      const sender = message.type === 'user' ? 'User' : message.type === 'assistant' ? 'Assistant' : 'System';

      markdown += ### ${sender}`($, { timestamp });
    n;
    n;
    `
      markdown += `;
    $;
    {
        message.content;
    }
    n;
    n;
    if (message.references && message.references.length > 0) {
        markdown +=  ** References;
         ** ;
        n;
        `
        for (const ref of message.references) {`;
        markdown += -$;
        {
            ref.type;
        }
        $;
        {
            ref.title;
        }
        n;
        `
        }
        markdown += \n;
      }
    }

    return markdown;
  }

  private exportToText(session: ChatSession): string {
    let text = Plan Chat Session: ${session.title}`;
        n;
        text += Plan;
        ID: $;
        {
            session.planId;
        }
        n;
        `
    text += Created: ${session.createdAt.toISOString()}`;
        n;
        text += Status;
        $;
        {
            session.status;
        }
        n;
        n;
        `
`;
        text += `Messages:\n;
    text += =========\n\n;

    for (const message of session.messages) {
      const timestamp = message.timestamp.toISOString();
      const sender = message.type === 'user' ? 'User' : message.type === 'assistant' ? 'Assistant' : 'System';

      text += [${timestamp}] ${sender}:\n;`;
        text += $;
        {
            message.content;
        }
        `\n\n`;
    }
    return text;
}
//# sourceMappingURL=PlanChatService.js.map