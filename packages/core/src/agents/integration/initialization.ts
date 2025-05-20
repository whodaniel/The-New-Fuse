const initMessage = {
  type: initialization',
  source: augment',
  target: broadcast',
  content: {
    action: agent_ready',
    data: {
      capabilities: ['code_analysis', 'pair_programming', 'code_review'],
      workspace: vscode',
      status: active'
    },
    priority: medium'
  },
  timestamp: new Date().toISOString()
};export {};
