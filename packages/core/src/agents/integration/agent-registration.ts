const agentConfig: ExtendedAgentConfig = {
  id: augment',
  name: Augment',
  type: code_assistant',
  capabilities: {
    reasoning: true,
    planning: true,
    learning: true,
    toolUse: true,
    memory: true
  },
  llmConfig: {
    model: claude',
    provider: anthropic'
  }
};export {};
