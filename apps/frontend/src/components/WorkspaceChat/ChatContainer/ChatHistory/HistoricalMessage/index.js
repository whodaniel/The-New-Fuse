import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { memo } from "react";
import { Warning } from "@phosphor-icons/react";
import UserIcon from '../../../../UserIcon';
import Actions from './Actions';
import renderMarkdown from "@/utils/chat/markdown";
import { userFromStorage } from "@/utils/request";
import Citations from '../Citation';
import { v4 } from "uuid";
import createDOMPurify from "dompurify";
import { EditMessageForm, useEditMessage } from './Actions/EditMessage';
import { useWatchDeleteMessage } from './Actions/DeleteMessage';
import TTSMessage from './Actions/TTSButton';
import { TimeStamp } from "@/utils/TimeStamp";
var DOMPurify = createDOMPurify(window);
var HistoricalMessage = function (_a) {
    var _b = _a.uuid, uuid = _b === void 0 ? v4() : _b, message = _a.message, role = _a.role, workspace = _a.workspace, _c = _a.sources, sources = _c === void 0 ? [] : _c, _d = _a.attachments, attachments = _d === void 0 ? [] : _d, _e = _a.error, error = _e === void 0 ? false : _e, _f = _a.feedbackScore, feedbackScore = _f === void 0 ? null : _f, _g = _a.chatId, chatId = _g === void 0 ? null : _g, _h = _a.isLastMessage, isLastMessage = _h === void 0 ? false : _h, regenerateMessage = _a.regenerateMessage, saveEditedMessage = _a.saveEditedMessage, forkThread = _a.forkThread, createdAt = _a.createdAt, editedAt = _a.editedAt;
    var isEditing = useEditMessage({ chatId: chatId, role: role }).isEditing;
    var _j = useWatchDeleteMessage({
        chatId: chatId,
        role: role,
    }), isDeleted = _j.isDeleted, completeDelete = _j.completeDelete, onEndAnimation = _j.onEndAnimation;
    var timestamp = new TimeStamp(createdAt);
    var editedTimestamp = editedAt ? new TimeStamp(editedAt) : null;
    var adjustTextArea = function (event) {
        var element = event.target;
        element.style.height = "auto";
        element.style.height = "".concat(element.scrollHeight, "px");
    };
    if (error) {
        return (_jsx("div", { className: "flex justify-center items-end w-full bg-theme-bg-chat", children: _jsx("div", { className: "py-8 px-4 w-full flex gap-x-5 md:max-w-[80%] flex-col", children: _jsxs("div", { className: "flex gap-x-5", children: [_jsx(ProfileImage, { role: role, workspace: workspace }), _jsxs("div", { className: "p-2 rounded-lg bg-red-50 text-red-500", children: [_jsxs("span", { className: "inline-block", children: [_jsx(Warning, { className: "h-4 w-4 mb-1 inline-block" }), " Could not respond to message."] }), _jsx("p", { className: "text-xs font-mono mt-2 border-l-2 border-red-300 pl-2 bg-red-200 p-2 rounded-sm", children: error })] })] }) }) }, uuid));
    }
    if (completeDelete)
        return null;
    return (_jsx("div", { onAnimationEnd: onEndAnimation, className: "".concat(isDeleted ? "animate-remove" : "", " flex justify-center items-end w-full group bg-theme-bg-chat"), children: _jsxs("div", { className: "py-8 px-4 w-full flex gap-x-5 md:max-w-[80%] flex-col", children: [_jsxs("div", { className: "flex gap-x-5", children: [_jsxs("div", { className: "flex flex-col items-center", children: [_jsx(ProfileImage, { role: role, workspace: workspace }), _jsx("div", { className: "mt-1 -mb-10", children: role === "assistant" && (workspace === null || workspace === void 0 ? void 0 : workspace.slug) && chatId && (_jsx(TTSMessage, { slug: workspace.slug, chatId: chatId, message: message })) })] }), isEditing && saveEditedMessage ? (_jsx(EditMessageForm, { role: role, chatId: chatId, message: message, attachments: attachments, adjustTextArea: adjustTextArea, saveChanges: saveEditedMessage })) : (_jsxs("div", { className: "overflow-x-scroll break-words no-scroll", children: [_jsx("span", { className: "flex flex-col gap-y-1", dangerouslySetInnerHTML: {
                                        __html: DOMPurify.sanitize(renderMarkdown(message)),
                                    } }), _jsx(ChatAttachments, { attachments: attachments })] }))] }), _jsx("div", { className: "flex gap-x-5 ml-14", children: _jsx(Actions, { message: message, feedbackScore: feedbackScore, chatId: chatId, slug: workspace === null || workspace === void 0 ? void 0 : workspace.slug, isLastMessage: isLastMessage, regenerateMessage: regenerateMessage, isEditing: isEditing, role: role, forkThread: forkThread }) }), role === "assistant" && _jsx(Citations, { sources: sources }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-xs text-white/60", title: timestamp.formatDateTime(), children: timestamp.formatRelative() }), editedTimestamp && (_jsxs("span", { className: "text-xs text-white/40", title: "Edited ".concat(editedTimestamp.formatDateTime()), children: ["(edited ", editedTimestamp.formatRelative(), ")"] }))] })] }) }, uuid));
};
function ProfileImage(_a) {
    var _b;
    var role = _a.role, workspace = _a.workspace;
    if (role === "assistant" && (workspace === null || workspace === void 0 ? void 0 : workspace.pfpUrl)) {
        return (_jsx("div", { className: "relative w-[35px] h-[35px] rounded-full flex-shrink-0 overflow-hidden", children: _jsx("img", { src: workspace.pfpUrl, alt: "Workspace profile picture", className: "absolute top-0 left-0 w-full h-full object-cover rounded-full bg-white" }) }));
    }
    return (_jsx(UserIcon, { user: {
            uid: role === "user" ? (_b = userFromStorage()) === null || _b === void 0 ? void 0 : _b.username : workspace === null || workspace === void 0 ? void 0 : workspace.slug,
        }, role: role }));
}
function ChatAttachments(_a) {
    var _b = _a.attachments, attachments = _b === void 0 ? [] : _b;
    if (!attachments.length)
        return null;
    return (_jsx("div", { className: "flex flex-wrap gap-2", children: attachments.map(function (item) { return (_jsx("img", { src: item.contentString, className: "max-w-[300px] rounded-md", alt: item.name }, item.name)); }) }));
}
export default memo(HistoricalMessage, function (prevProps, nextProps) {
    return (prevProps.message === nextProps.message &&
        prevProps.isLastMessage === nextProps.isLastMessage &&
        prevProps.chatId === nextProps.chatId);
});
