export const ABORT_STREAM_EVENT = "abort-chat-stream";
export default function handleChat(chatResult, setLoadingResponse, setChatHistory, remHistory, _chatHistory, setWebsocket) {
    var _a;
    const { uuid, textResponse, type, sources = [], error, close, chatId = null, action = null, } = chatResult;
    if (type === "abort" || type === "statusResponse") {
        setLoadingResponse(false);
        setChatHistory([
            ...remHistory,
            {
                type,
                uuid,
                content: textResponse,
                role: "assistant",
                sources,
                closed: true,
                error,
                animate: false,
                pending: false,
            },
        ]);
        _chatHistory.push({
            type,
            uuid,
            content: textResponse,
            role: "assistant",
            sources,
            closed: true,
            error,
            animate: false,
            pending: false,
        });
    }
    else if (type === "textResponse") {
        setLoadingResponse(false);
        setChatHistory([
            ...remHistory,
            {
                uuid,
                content: textResponse,
                role: "assistant",
                sources,
                closed: close,
                error,
                animate: !close,
                pending: false,
                chatId,
            },
        ]);
        _chatHistory.push({
            uuid,
            content: textResponse,
            role: "assistant",
            sources,
            closed: close,
            error,
            animate: !close,
            pending: false,
            chatId,
        });
    }
    else if (type === "textResponseChunk") {
        const chatIdx = _chatHistory.findIndex((chat) => chat.uuid === uuid);
        if (chatIdx !== -1) {
            const existingHistory = Object.assign({}, _chatHistory[chatIdx]);
            const updatedHistory = Object.assign(Object.assign({}, existingHistory), { content: existingHistory.content + textResponse, sources,
                error, closed: close, animate: !close, pending: false, chatId });
            _chatHistory[chatIdx] = updatedHistory;
        }
        else {
            _chatHistory.push({
                uuid,
                sources,
                error,
                content: textResponse,
                role: "assistant",
                closed: close,
                animate: !close,
                pending: false,
                chatId,
            });
        }
        setChatHistory([..._chatHistory]);
    }
    else if (type === "agentInitWebsocketConnection") {
        setWebsocket(chatResult.websocketUUID);
    }
    else if (type === "finalizeResponseStream") {
        const chatIdx = _chatHistory.findIndex((chat) => chat.uuid === uuid);
        if (chatIdx !== -1) {
            _chatHistory[chatIdx - 1] = Object.assign(Object.assign({}, _chatHistory[chatIdx - 1]), { chatId });
            _chatHistory[chatIdx] = Object.assign(Object.assign({}, _chatHistory[chatIdx]), { chatId });
        }
        setChatHistory([..._chatHistory]);
        setLoadingResponse(false);
    }
    else if (type === "stopGeneration") {
        const chatIdx = _chatHistory.length - 1;
        const existingHistory = Object.assign({}, _chatHistory[chatIdx]);
        const updatedHistory = Object.assign(Object.assign({}, existingHistory), { sources: [], closed: true, error: null, animate: false, pending: false });
        _chatHistory[chatIdx] = updatedHistory;
        setChatHistory([..._chatHistory]);
        setLoadingResponse(false);
    }
    if (action === "reset_chat") {
        setChatHistory([_chatHistory.pop()]);
    }
    if (action === "rename_thread") {
        if (!!((_a = chatResult === null || chatResult === void 0 ? void 0 : chatResult.thread) === null || _a === void 0 ? void 0 : _a.slug) && chatResult.thread.name) {
            window.dispatchEvent(new CustomEvent(THREAD_RENAME_EVENT, {
                detail: {
                    threadSlug: chatResult.thread.slug,
                    newName: chatResult.thread.name,
                },
            }));
        }
    }
}
export function chatPrompt(workspace) {
    var _a;
    return ((_a = workspace === null || workspace === void 0 ? void 0 : workspace.openAiPrompt) !== null && _a !== void 0 ? _a : "Given the following conversation, relevant context, and a follow up question, reply with an answer to the current question the user is asking. Return only your response to the question given the above information following the users instructions as needed.");
}
export function chatQueryRefusalResponse(workspace) {
    var _a;
    return ((_a = workspace === null || workspace === void 0 ? void 0 : workspace.queryRefusalResponse) !== null && _a !== void 0 ? _a : "There is no relevant information in this workspace to answer your query.");
}
//# sourceMappingURL=chatHandler.js.map