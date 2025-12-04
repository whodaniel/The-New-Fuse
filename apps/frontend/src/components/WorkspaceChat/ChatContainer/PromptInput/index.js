import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useState, useRef, useEffect } from "react";
import SlashCommandsButton, { SlashCommands, useSlashCommands, } from './SlashCommands';
import debounce from "lodash.debounce";
import { PaperPlaneRight } from "@phosphor-icons/react";
import StopGenerationButton from './StopGenerationButton';
import AvailableAgentsButton, { AvailableAgents, useAvailableAgents, } from './AgentMenu';
import TextSizeButton from './TextSizeMenu';
import SpeechToText from './SpeechToText';
import { Tooltip } from "react-tooltip";
import AttachmentManager from './Attachments';
import AttachItem from './AttachItem';
import { PASTE_ATTACHMENT_EVENT } from '../DnDWrapper';
import useTextSize from "@/hooks/useTextSize";
export var PROMPT_INPUT_EVENT = "set_prompt_input";
var MAX_EDIT_STACK_SIZE = 100;
export default function PromptInput(_a) {
    var submit = _a.submit, onChange = _a.onChange, inputDisabled = _a.inputDisabled, buttonDisabled = _a.buttonDisabled, sendCommand = _a.sendCommand, _b = _a.attachments, attachments = _b === void 0 ? [] : _b;
    var _c = useState(""), promptInput = _c[0], setPromptInput = _c[1];
    var _d = useAvailableAgents(), showAgents = _d.showAgents, setShowAgents = _d.setShowAgents;
    var _e = useSlashCommands(), showSlashCommand = _e.showSlashCommand, setShowSlashCommand = _e.setShowSlashCommand;
    var formRef = useRef(null);
    var textareaRef = useRef(null);
    var input = useRef(null);
    var _f = useState(false), _ = _f[0], setFocused = _f[1];
    var undoStack = useRef([]);
    var redoStack = useRef([]);
    var textSizeClass = useTextSize().textSizeClass;
    function handlePromptUpdate(e) {
        var _a;
        setPromptInput((_a = e === null || e === void 0 ? void 0 : e.detail) !== null && _a !== void 0 ? _a : "");
    }
    function resetTextAreaHeight() {
        if (!textareaRef.current)
            return;
        textareaRef.current.style.height = "auto";
    }
    useEffect(function () {
        if (window) {
            window.addEventListener(PROMPT_INPUT_EVENT, handlePromptUpdate);
            return function () { return window === null || window === void 0 ? void 0 : window.removeEventListener(PROMPT_INPUT_EVENT, handlePromptUpdate); };
        }
    }, []);
    useEffect(function () {
        if (!inputDisabled && textareaRef.current)
            textareaRef.current.focus();
        resetTextAreaHeight();
    }, [inputDisabled]);
    useEffect(function () {
        var _a;
        var handleKeypress = function (e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
            }
        };
        (_a = input.current) === null || _a === void 0 ? void 0 : _a.addEventListener('keypress', handleKeypress);
        return function () { var _a; return (_a = input.current) === null || _a === void 0 ? void 0 : _a.removeEventListener('keypress', handleKeypress); };
    }, [handleSubmit]);
    function saveCurrentState(adjustment) {
        if (adjustment === void 0) { adjustment = 0; }
        if (!textareaRef.current)
            return;
        if (undoStack.current.length >= MAX_EDIT_STACK_SIZE)
            undoStack.current.shift();
        undoStack.current.push({
            value: promptInput,
            cursorPositionStart: textareaRef.current.selectionStart + adjustment,
            cursorPositionEnd: textareaRef.current.selectionEnd + adjustment,
        });
    }
    var debouncedSaveState = debounce(saveCurrentState, 250);
    function handleSubmit() {
        setFocused(false);
        submit(new React.FormEvent(formRef.current));
    }
    function checkForSlash(e) {
        var input = e.target.value;
        if (input === "/")
            setShowSlashCommand(true);
        if (showSlashCommand)
            setShowSlashCommand(false);
    }
    var watchForSlash = debounce(checkForSlash, 300);
    function checkForAt(e) {
        var input = e.target.value;
        if (input === "@")
            setShowAgents(true);
        if (showAgents)
            setShowAgents(false);
    }
    var watchForAt = debounce(checkForAt, 300);
    function captureEnterOrUndo(event) {
        if (event.keyCode === 13 && !event.shiftKey) {
            event.preventDefault();
            return submit(event);
        }
        if ((event.ctrlKey || event.metaKey) &&
            event.key === "z" &&
            event.shiftKey) {
            event.preventDefault();
            if (redoStack.current.length === 0 || !textareaRef.current)
                return;
            var nextState_1 = redoStack.current.pop();
            if (!nextState_1)
                return;
            undoStack.current.push({
                value: promptInput,
                cursorPositionStart: textareaRef.current.selectionStart,
                cursorPositionEnd: textareaRef.current.selectionEnd,
            });
            setPromptInput(nextState_1.value);
            setTimeout(function () {
                if (!textareaRef.current)
                    return;
                textareaRef.current.setSelectionRange(nextState_1.cursorPositionStart, nextState_1.cursorPositionEnd);
            }, 0);
        }
        if ((event.ctrlKey || event.metaKey) &&
            event.key === "z" &&
            !event.shiftKey) {
            if (undoStack.current.length === 0 || !textareaRef.current)
                return;
            var lastState_1 = undoStack.current.pop();
            if (!lastState_1)
                return;
            redoStack.current.push({
                value: promptInput,
                cursorPositionStart: textareaRef.current.selectionStart,
                cursorPositionEnd: textareaRef.current.selectionEnd,
            });
            setPromptInput(lastState_1.value);
            setTimeout(function () {
                if (!textareaRef.current)
                    return;
                textareaRef.current.setSelectionRange(lastState_1.cursorPositionStart, lastState_1.cursorPositionEnd);
            }, 0);
        }
    }
    function adjustTextArea(event) {
        var element = event.target;
        element.style.height = "auto";
        element.style.height = "".concat(element.scrollHeight, "px");
    }
    function handlePasteEvent(e) {
        e.preventDefault();
        if (e.clipboardData.items.length === 0)
            return false;
        for (var _i = 0, _a = e.clipboardData.items; _i < _a.length; _i++) {
            var item = _a[_i];
            if (item.type.startsWith("image/")) {
                var file = item.getAsFile();
                if (file) {
                    window.dispatchEvent(new CustomEvent(PASTE_ATTACHMENT_EVENT, {
                        detail: { files: [file] },
                    }));
                }
                continue;
            }
            if (item.kind === "file") {
                var file = item.getAsFile();
                if (file) {
                    window.dispatchEvent(new CustomEvent(PASTE_ATTACHMENT_EVENT, {
                        detail: { files: [file] },
                    }));
                }
                continue;
            }
        }
        var pasteText = e.clipboardData.getData("text/plain");
        if (pasteText && textareaRef.current) {
            var textarea = textareaRef.current;
            var start_1 = textarea.selectionStart;
            var end = textarea.selectionEnd;
            var newPromptInput = promptInput.substring(0, start_1) +
                pasteText +
                promptInput.substring(end);
            setPromptInput(newPromptInput);
            onChange({ target: { value: newPromptInput } });
            setTimeout(function () {
                if (!textareaRef.current)
                    return;
                textareaRef.current.selectionStart = textareaRef.current.selectionEnd =
                    start_1 + pasteText.length;
            }, 0);
        }
    }
    function handleChange(e) {
        debouncedSaveState(-1);
        onChange(e);
        watchForSlash(e);
        watchForAt(e);
        adjustTextArea(e);
        setPromptInput(e.target.value);
    }
    return (_jsxs("div", { className: "w-full fixed md:absolute bottom-0 left-0 z-10 md:z-0 flex justify-center items-center", children: [_jsx(SlashCommands, { showing: showSlashCommand, setShowing: setShowSlashCommand, sendCommand: sendCommand }), _jsx(AvailableAgents, { showing: showAgents, setShowing: setShowAgents, sendCommand: sendCommand, promptRef: textareaRef }), _jsx("form", { onSubmit: handleSubmit, className: "flex flex-col gap-y-1 rounded-t-lg md:w-3/4 w-full mx-auto max-w-xl items-center", children: _jsx("div", { className: "flex items-center rounded-lg md:mb-4", children: _jsxs("div", { className: "w-[95vw] md:w-[635px] bg-theme-bg-chat-input light:bg-white light:border-solid light:border-[1px] light:border-theme-chat-input-border shadow-sm rounded-2xl flex flex-col px-4 overflow-hidden", children: [_jsx(AttachmentManager, { attachments: attachments }), _jsxs("div", { className: "flex items-center w-full border-b-2 border-theme-chat-input-border", children: [_jsx("textarea", { ref: textareaRef, onChange: handleChange, onKeyDown: captureEnterOrUndo, onPaste: function (e) {
                                            saveCurrentState();
                                            handlePasteEvent(e);
                                        }, required: true, disabled: inputDisabled, onFocus: function () { return setFocused(true); }, onBlur: function (e) {
                                            setFocused(false);
                                            adjustTextArea(e);
                                        }, value: promptInput, className: "border-none cursor-text max-h-[50vh] md:max-h-[350px] md:min-h-[40px] mx-2 md:mx-0 pt-[12px] w-full leading-5 md:text-md text-white bg-transparent placeholder:text-white/60 light:placeholder:text-theme-text-primary resize-none active:outline-none focus:outline-none flex-grow ".concat(textSizeClass), placeholder: "Send a message" }), buttonDisabled ? (_jsx(StopGenerationButton, {})) : (_jsxs(_Fragment, { children: [_jsxs("button", { ref: formRef, type: "submit", className: "border-none inline-flex justify-center rounded-2xl cursor-pointer opacity-60 hover:opacity-100 light:opacity-100 light:hover:opacity-60 ml-4", "data-tooltip-id": "send-prompt", "data-tooltip-content": "Send prompt message to workspace", "aria-label": "Send prompt message to workspace", children: [_jsx(PaperPlaneRight, { color: "var(--theme-sidebar-footer-icon-fill)", className: "w-[22px] h-[22px] pointer-events-none text-theme-text-primary", weight: "fill" }), _jsx("span", { className: "sr-only", children: "Send message" })] }), _jsx(Tooltip, { id: "send-prompt", place: "bottom", delayShow: 300, className: "tooltip !text-xs z-99" })] }))] }), _jsxs("div", { className: "flex justify-between py-3.5", children: [_jsxs("div", { className: "flex gap-x-2", children: [_jsx(AttachItem, {}), _jsx(SlashCommandsButton, { showing: showSlashCommand, setShowSlashCommand: setShowSlashCommand }), _jsx(AvailableAgentsButton, { showing: showAgents, setShowAgents: setShowAgents }), _jsx(TextSizeButton, {})] }), _jsx("div", { className: "flex gap-x-2", children: _jsx(SpeechToText, { sendCommand: sendCommand }) })] })] }) }) })] }));
}
