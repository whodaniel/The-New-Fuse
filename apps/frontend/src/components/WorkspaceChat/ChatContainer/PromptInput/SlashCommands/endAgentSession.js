import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { StopCircle } from "lucide-react";
export default function EndAgentSession(_a) {
    var sendCommand = _a.sendCommand, setShowing = _a.setShowing;
    return (_jsxs("div", { onClick: function () {
            sendCommand("/end");
            setShowing(false);
        }, className: "w-full flex flex-col justify-start items-start p-2 rounded-lg hover:bg-theme-action-menu-item-hover cursor-pointer", children: [_jsxs("div", { className: "w-full flex justify-start items-center gap-2", children: [_jsx(StopCircle, { className: "w-4 h-4 text-orange-500" }), _jsx("p", { className: "text-sm font-medium text-theme-text-primary", children: "End Agent Session" })] }), _jsx("p", { className: "text-xs text-theme-text-secondary mt-1", children: "End the current agent session" })] }));
}
