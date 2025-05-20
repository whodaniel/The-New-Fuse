declare const paths: {
    home: () => string;
    chat: () => string;
    settings: () => string;
    admin: () => string;
    agents: () => string;
    agentDetails: (id: string) => string;
    embeddings: () => string;
    embeddingDetails: (id: string) => string;
    chatHistory: () => string;
    chatDetails: (id: string) => string;
    systemSettings: () => string;
    userSettings: () => string;
    apiKeys: () => string;
};
export default paths;
