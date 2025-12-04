import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from "react";
import SlashCommandIcon from '../icons/SlashCommandIcon';
import { Tooltip } from "react-tooltip";
import ResetCommand from './reset';
import EndAgentSession from './endAgentSession';
import SlashPresets from './SlashPresets';
export default function SlashCommandsButton(_a) {
    var showing = _a.showing, setShowSlashCommand = _a.setShowSlashCommand;
    return (_jsxs("div", { id: "slash-cmd-btn", "data-tooltip-id": "tooltip-slash-cmd-btn", "data-tooltip-content": "View all available slash commands for chatting.", onClick: function () { return setShowSlashCommand(!showing); }, className: "flex justify-center items-center cursor-pointer ".concat(showing ? "!opacity-100" : ""), children: [_jsx(SlashCommandIcon, { color: "var(--theme-sidebar-footer-icon-fill)", className: "w-[20px] h-[20px] pointer-events-none opacity-60 hover:opacity-100 light:opacity-100 light:hover:opacity-60" }), _jsx(Tooltip, { id: "tooltip-slash-cmd-btn", place: "top", delayShow: 300, className: "tooltip !text-xs z-99" })] }));
}
export function SlashCommands(_a) {
    var showing = _a.showing, setShowing = _a.setShowing, sendCommand = _a.sendCommand;
    var cmdRef = useRef(null);
    useEffect(function () {
        function listenForOutsideClick() {
            if (!showing || !cmdRef.current)
                return false;
            document.addEventListener("click", closeIfOutside);
        }
        listenForOutsideClick();
        // Cleanup listener on unmount
        return function () {
            document.removeEventListener("click", closeIfOutside);
        };
    }, [showing, cmdRef.current]);
    var closeIfOutside = function (event) {
        var _a;
        var target = event.target;
        if (target.id === "slash-cmd-btn")
            return;
        var isOutside = !((_a = cmdRef === null || cmdRef === void 0 ? void 0 : cmdRef.current) === null || _a === void 0 ? void 0 : _a.contains(target));
        if (!isOutside)
            return;
        setShowing(false);
    };
    return (_jsx("div", { hidden: !showing, children: _jsx("div", { className: "w-full flex justify-center absolute bottom-[130px] md:bottom-[150px] left-0 z-10 px-4", children: _jsxs("div", { ref: cmdRef, className: "w-[600px] bg-theme-action-menu-bg rounded-2xl flex shadow flex-col justify-start items-start gap-2.5 p-2 overflow-y-auto max-h-[300px] no-scroll", children: [_jsx(ResetCommand, { sendCommand: sendCommand, setShowing: setShowing }), _jsx(EndAgentSession, { sendCommand: sendCommand, setShowing: setShowing }), _jsx(SlashPresets, { sendCommand: sendCommand, setShowing: setShowing })] }) }) }));
}
export function useSlashCommands() {
    var _a = useState(false), showSlashCommand = _a[0], setShowSlashCommand = _a[1];
    return { showSlashCommand: showSlashCommand, setShowSlashCommand: setShowSlashCommand };
}
