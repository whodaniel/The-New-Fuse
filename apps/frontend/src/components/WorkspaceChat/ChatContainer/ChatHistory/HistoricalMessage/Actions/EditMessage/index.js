import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useRef } from "react";
import { useEventListener } from "@/hooks/useEventListener";
import { v4 } from "uuid";
export function EditMessageForm(_a) {
    var role = _a.role, chatId = _a.chatId, message = _a.message, _b = _a.attachments, attachments = _b === void 0 ? [] : _b, adjustTextArea = _a.adjustTextArea, saveChanges = _a.saveChanges;
    var _c = useState(message), editedMessage = _c[0], setEditedMessage = _c[1];
    var textareaRef = useRef(null);
    var formId = useRef(v4());
    useEventListener("keydown", function (e) {
        var _a, _b;
        if (e.key === "Escape") {
            (_b = (_a = textareaRef.current) === null || _a === void 0 ? void 0 : _a.form) === null || _b === void 0 ? void 0 : _b.reset();
            setEditedMessage(message);
        }
    });
    if (!chatId)
        return null;
    return (_jsxs("form", { id: formId.current, className: "w-full", onSubmit: function (e) {
            e.preventDefault();
            if (editedMessage === message)
                return;
            saveChanges({
                editedMessage: editedMessage,
                chatId: chatId,
                role: role,
                attachments: attachments,
                editedAt: new Date(),
            });
        }, children: [_jsx("textarea", { ref: textareaRef, name: "message", rows: 1, className: "w-full text-white bg-transparent border-none outline-none resize-none overflow-hidden", value: editedMessage, onChange: function (e) {
                    adjustTextArea(e);
                    setEditedMessage(e.target.value);
                }, autoFocus: true }), _jsxs("div", { className: "flex gap-x-2 mt-2", children: [_jsx("button", { type: "submit", className: "px-2 py-1 text-xs text-white bg-primary-button rounded-md hover:bg-primary-button-hover", children: "Save Changes" }), _jsx("button", { type: "reset", className: "px-2 py-1 text-xs text-white/60 hover:text-white", onClick: function () { return setEditedMessage(message); }, children: "Cancel" })] })] }));
}
export function useEditMessage(_a) {
    var chatId = _a.chatId, role = _a.role;
    var _b = useState(false), isEditing = _b[0], setIsEditing = _b[1];
    var toggleEdit = function () {
        setIsEditing(!isEditing);
    };
    return { isEditing: isEditing, toggleEdit: toggleEdit };
}
