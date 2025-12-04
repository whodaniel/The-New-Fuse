import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Copy, Trash2 } from 'lucide-react';
export default function Actions(_a) {
    var message = _a.message, _feedbackScore = _a._feedbackScore, chatId = _a.chatId, _slug = _a._slug, isLastMessage = _a.isLastMessage, regenerateMessage = _a.regenerateMessage, _isEditing = _a._isEditing, role = _a.role, forkThread = _a.forkThread;
    var copyMessage = function () {
        try {
            navigator.clipboard.writeText(message);
            alert('Message copied to clipboard!');
        }
        catch (_a) {
            alert('Failed to copy message. Please try again.');
        }
    };
    var handleRegenerate = function () {
        if (chatId && regenerateMessage) {
            try {
                regenerateMessage(chatId);
                alert('Response regenerated successfully!');
            }
            catch (_a) {
                alert('Failed to regenerate response. Please try again.');
            }
        }
    };
    var handleFork = function () {
        if (chatId && forkThread) {
            try {
                forkThread(chatId);
                alert('Thread forked successfully!');
            }
            catch (_a) {
                alert('Failed to fork thread. Please try again.');
            }
        }
    };
    return (_jsxs("div", { className: "flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity", children: [_jsx("button", { onClick: copyMessage, className: "p-1 rounded hover:bg-white/10 text-white/60 hover:text-white", title: "Copy message", "aria-label": "Copy message", children: _jsx(Copy, { size: 16 }) }), role === "user" && (_jsx("button", { className: "p-1 rounded hover:bg-white/10 text-white/60 hover:text-white", title: "Edit message", "aria-label": "Edit message", children: _jsx(PencilSimple, { size: 16 }) })), role === "assistant" && isLastMessage && regenerateMessage && (_jsx("button", { onClick: handleRegenerate, className: "p-1 rounded hover:bg-white/10 text-white/60 hover:text-white", title: "Regenerate response", "aria-label": "Regenerate response", children: _jsx(ArrowClockwise, { size: 16 }) })), chatId && forkThread && (_jsx("button", { onClick: handleFork, className: "p-1 rounded hover:bg-white/10 text-white/60 hover:text-white", title: "Fork thread", "aria-label": "Fork thread", children: _jsx(ArrowsSplit, { size: 16 }) })), _jsx("button", { className: "p-1 rounded hover:bg-white/10 text-white/60 hover:text-white", title: "Delete message", "aria-label": "Delete message", children: _jsx(Trash2, { size: 16 }) })] }));
}
