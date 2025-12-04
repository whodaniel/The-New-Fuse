import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Sparkles } from "lucide-react";
export default function SlashPresets(_a) {
    var sendCommand = _a.sendCommand, setShowing = _a.setShowing;
    return (_jsxs("div", { onClick: function () {
            sendCommand("/presets");
            setShowing(false);
        }, className: "w-full flex flex-col justify-start items-start p-2 rounded-lg hover:bg-theme-action-menu-item-hover cursor-pointer", children: [_jsxs("div", { className: "w-full flex justify-start items-center gap-2", children: [_jsx(Sparkles, { className: "w-4 h-4 text-purple-500" }), _jsx("p", { className: "text-sm font-medium text-theme-text-primary", children: "Presets" })] }), _jsx("p", { className: "text-xs text-theme-text-secondary mt-1", children: "View and use conversation presets" })] }));
}
