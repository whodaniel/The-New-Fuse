const paths = {
  home: () => '/',
  chat: () => '/chat',
  settings: () => '/settings',
  admin: () => '/admin',
  agents: () => '/agents',
  agentDetails: (id: string) => `/agents/${id}`,
  embeddings: () => '/embeddings',
  embeddingDetails: (id: string) => `/embeddings/${id}`,
  chatHistory: () => '/chat/history',
  chatDetails: (id: string) => `/chat/${id}`,
  systemSettings: () => '/settings/system',
  userSettings: () => '/settings/user',
  apiKeys: () => '/settings/api-keys',
};
export default paths;
