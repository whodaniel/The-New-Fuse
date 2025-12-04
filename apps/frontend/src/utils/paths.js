var paths = {
    home: function () { return '/'; },
    chat: function () { return '/chat'; },
    settings: function () { return '/settings'; },
    admin: function () { return '/admin'; },
    agents: function () { return '/agents'; },
    agentDetails: function (id) { return "/agents/".concat(id); },
    embeddings: function () { return '/embeddings'; },
    embeddingDetails: function (id) { return "/embeddings/".concat(id); },
    chatHistory: function () { return '/chat/history'; },
    chatDetails: function (id) { return "/chat/".concat(id); },
    systemSettings: function () { return '/settings/system'; },
    userSettings: function () { return '/settings/user'; },
    apiKeys: function () { return '/settings/api-keys'; },
    workspace: {
        chat: function (slug) { return "/workspace/".concat(slug); },
        thread: function (slug, threadSlug) { return "/workspace/".concat(slug, "/t/").concat(threadSlug); },
        settings: function (slug) { return "/workspace/".concat(slug, "/settings"); },
        files: function (slug) { return "/workspace/".concat(slug, "/files"); },
    },
};
export default paths;
