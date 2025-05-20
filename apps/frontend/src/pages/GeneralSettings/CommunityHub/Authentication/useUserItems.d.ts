export declare function useUserItems({ connectionKey }: {
    connectionKey: any;
}): {
    loading: boolean;
    userItems: {
        createdByMe: {
            agentSkills: {
                items: never[];
            };
            systemPrompts: {
                items: never[];
            };
            slashCommands: {
                items: never[];
            };
        };
        teamItems: never[];
    };
};
