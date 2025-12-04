import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { memo } from "react";
import { Warning } from "@phosphor-icons/react";
import UserIcon from '../../../../UserIcon';
import renderMarkdown from "@/utils/chat/markdown";
import Citations from '../Citation';
var PromptReply = function (_a) {
    var uuid = _a.uuid, reply = _a.reply, pending = _a.pending, error = _a.error, workspace = _a.workspace, _b = _a.sources, sources = _b === void 0 ? [] : _b, _c = _a.closed, closed = _c === void 0 ? true : _c;
    var assistantBackgroundColor = "bg-theme-bg-chat";
    if (!reply && sources.length === 0 && !pending && !error)
        return null;
    if (pending) {
        return (_jsx("div", { className: "flex justify-center items-end w-full ".concat(assistantBackgroundColor), children: _jsx("div", { className: "py-6 px-4 w-full flex gap-x-5 md:max-w-[80%] flex-col", children: _jsxs("div", { className: "flex gap-x-5", children: [_jsx(WorkspaceProfileImage, { workspace: workspace }), _jsx("div", { className: "mt-3 ml-5 dot-falling light:invert" })] }) }) }));
    }
    if (error) {
        return (_jsx("div", { className: "flex justify-center items-end w-full ".concat(assistantBackgroundColor), children: _jsx("div", { className: "py-6 px-4 w-full flex gap-x-5 md:max-w-[80%] flex-col", children: _jsxs("div", { className: "flex gap-x-5", children: [_jsx(WorkspaceProfileImage, { workspace: workspace }), _jsxs("span", { className: "inline-block p-2 rounded-lg bg-red-50 text-red-500", children: [_jsx(Warning, { className: "h-4 w-4 mb-1 inline-block" }), " Could not respond to message.", _jsxs("span", { className: "text-xs", children: ["Reason: ", error || "unknown"] })] })] }) }) }));
    }
    return (_jsx("div", { className: "flex justify-center items-end w-full ".concat(assistantBackgroundColor), children: _jsxs("div", { className: "py-8 px-4 w-full flex gap-x-5 md:max-w-[80%] flex-col", children: [_jsxs("div", { className: "flex gap-x-5", children: [_jsx(WorkspaceProfileImage, { workspace: workspace }), _jsx("span", { className: "overflow-x-scroll break-words no-scroll", dangerouslySetInnerHTML: { __html: renderMarkdown(reply) } })] }), _jsx(Citations, { sources: sources })] }) }, uuid));
};
export function WorkspaceProfileImage(_a) {
    var workspace = _a.workspace;
    if (workspace === null || workspace === void 0 ? void 0 : workspace.pfpUrl) {
        return (_jsx("div", { className: "relative w-[35px] h-[35px] rounded-full flex-shrink-0 overflow-hidden", children: _jsx("img", { src: workspace.pfpUrl, alt: "Workspace profile picture", className: "absolute top-0 left-0 w-full h-full object-cover rounded-full bg-white" }) }));
    }
    return _jsx(UserIcon, { user: { uid: workspace === null || workspace === void 0 ? void 0 : workspace.slug }, role: "assistant" });
}
export default memo(PromptReply);
