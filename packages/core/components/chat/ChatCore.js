import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { PromptInput } from '@the-new-fuse/PromptInput';
import { ChatHistory } from '@the-new-fuse/ChatHistory';
import { ChatControls } from '@the-new-fuse/ChatControls';
export const ChatCore = ({ messages, onSendMessage, onTyping, enableVoice = false, enableVideo = false, enableAttachments = false, className = '' }) => {
    return (_jsxs("div", { className: `chat-container flex flex-col h-full ${className}`, children: [_jsx(ChatHistory, { messages: messages }), _jsx(ChatControls, { enableVoice: enableVoice, enableVideo: enableVideo }), _jsx(PromptInput, { onSend: onSendMessage, onTyping: onTyping, enableAttachments: enableAttachments })] }));
};
//# sourceMappingURL=ChatCore.js.map