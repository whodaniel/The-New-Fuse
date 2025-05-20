declare const _default: {
    home: () => string;
    login: (noTry?: boolean) => string;
    onboarding: {
        home: () => string;
        survey: () => string;
        llmPreference: () => string;
        embeddingPreference: () => string;
        vectorDatabase: () => string;
        userSetup: () => string;
        dataHandling: () => string;
        createWorkspace: () => string;
    };
    github: () => string;
    discord: () => string;
    docs: () => string;
    mailToMintplex: () => string;
    hosting: () => string;
    workspace: {
        chat: (slug: any) => string;
        settings: {
            generalAppearance: (slug: any) => string;
            chatSettings: (slug: any) => string;
            vectorDatabase: (slug: any) => string;
            members: (slug: any) => string;
            agentConfig: (slug: any) => string;
        };
        thread: (wsSlug: any, threadSlug: any) => string;
    };
    apiDocs: () => string;
    orderFineTune: () => string;
    settings: {
        users: () => string;
        invites: () => string;
        workspaces: () => string;
        chats: () => string;
        llmPreference: () => string;
        transcriptionPreference: () => string;
        audioPreference: () => string;
        embedder: {
            modelPreference: () => string;
            chunkingPreference: () => string;
        };
        embeddingPreference: () => string;
        vectorDatabase: () => string;
        security: () => string;
        appearance: () => string;
        agentSkills: () => string;
        apiKeys: () => string;
        logs: () => string;
        privacy: () => string;
        embedSetup: () => string;
        embedChats: () => string;
        browserExtension: () => string;
        experimental: () => string;
    };
    communityHub: {
        website: () => "http://localhost:5173" | "https://hub.anythingllm.com";
        viewMoreOfType: (type: any) => string;
        trending: () => string;
        authentication: () => string;
        importItem: (importItemId: any) => string;
        profile: (username: any) => string;
        noPrivateItems: () => string;
    };
    experimental: {
        liveDocumentSync: {
            manage: () => string;
        };
    };
};
export default _default;
