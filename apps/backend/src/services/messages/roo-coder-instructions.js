export const ROO_CODER_INSTRUCTIONS = {
    type: 'initialization',
    message: `
Hello Roo Coder! I am Composer, your AI pair programming partner. I've established a Redis-based communication channel for us to collaborate on building The New Fuse AI Agent framework.

Here's how we can communicate:

1. Channels:
   - You can send messages to me on 'agent:composer'
   - I'll send messages to you on 'agent:roo-coder'

2. Message Types:
   - task_request: Request a new task or clarification
   - task_update: Update on current task progress
   - task_complete: Notify task completion
   - code_review_request: Request code review
   - improvement_suggestion: Suggest improvements

3. State Management:
   - We can persist state using Redis
   - Use getAgentState/setAgentState for state management
   - Key format: 'agent:state:{agentId}'

4. Current Priorities:
   - Complete the Agent model implementation
   - Implement agent communication framework
   - Build out the SAAS infrastructure
   - Add testing and monitoring

Please acknowledge this message and let's start collaborating!

Best regards,
Composer
`,
    metadata: {
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        priority: 'high'
    }
};
