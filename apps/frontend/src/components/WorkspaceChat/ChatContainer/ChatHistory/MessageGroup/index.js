import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { TimeStamp } from "@/utils/TimeStamp";
import HistoricalMessage from '../HistoricalMessage';
export default function MessageGroup(_a) {
    var messages = _a.messages, workspace = _a.workspace, chatId = _a.chatId, onEditMessage = _a.onEditMessage, onRegenerateMessage = _a.onRegenerateMessage, onForkThread = _a.onForkThread;
    if (messages.length === 0)
        return null;
    // Get timestamp of first message in group
    var groupTimestamp = new TimeStamp(messages[0].createdAt);
    // Determine if we should show date header
    var showDateHeader = function () {
        if (groupTimestamp.isToday()) {
            return 'Today';
        }
        else if (groupTimestamp.isYesterday()) {
            return 'Yesterday';
        }
        else {
            return groupTimestamp.format({ format: 'medium', includeTime: false });
        }
    };
    return (_jsxs("div", { className: "message-group", children: [_jsx("div", { className: "sticky top-0 z-10 flex items-center justify-center py-2 bg-theme-bg-secondary/80 backdrop-blur-sm", children: _jsx("div", { className: "px-3 py-1 text-xs text-white/60 bg-theme-bg-secondary rounded-full", children: showDateHeader() }) }), messages.map(function (message, index) { return (_jsx(HistoricalMessage, { uuid: message.id, message: message.content, role: message.role, workspace: workspace, attachments: message.attachments, chatId: chatId, isLastMessage: index === messages.length - 1, regenerateMessage: onRegenerateMessage, saveEditedMessage: onEditMessage, forkThread: onForkThread, createdAt: message.createdAt, editedAt: message.editedAt }, message.id)); })] }));
}
