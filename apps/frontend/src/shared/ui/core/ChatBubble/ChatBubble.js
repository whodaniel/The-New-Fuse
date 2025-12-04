import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useRef, useEffect } from 'react';
import { cva } from 'class-variance-authority';
import { X, Check, Clock, Pencil } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '../Button';
import { Input } from '../Input';
export var chatBubbleVariants = cva('relative flex w-full mt-2 items-start group', {
    variants: {
        align: {
            start: 'justify-start',
            end: 'justify-end',
        },
        size: {
            sm: 'max-w-[240px]',
            default: 'max-w-[290px]',
            lg: 'max-w-[340px]',
            full: 'max-w-full',
        },
    },
    defaultVariants: {
        align: 'start',
        size: 'default',
    },
});
var messageVariants = cva('p-3 rounded-lg break-words transition-colors', {
    variants: {
        variant: {
            user: 'bg-primary text-primary-foreground',
            assistant: 'bg-muted text-muted-foreground',
            system: 'bg-secondary text-secondary-foreground',
            error: 'bg-destructive text-destructive-foreground',
        },
        size: {
            sm: 'text-sm',
            default: 'text-base',
            lg: 'text-lg',
        },
    },
    defaultVariants: {
        variant: 'assistant',
        size: 'default',
    },
});
var statusIcons = {
    sending: _jsx(Clock, { className: "h-3 w-3", "data-testid": "status-icon" }),
    sent: _jsx(Check, { className: "h-3 w-3", "data-testid": "status-icon" }),
    error: _jsx(X, { className: "h-3 w-3 text-destructive", "data-testid": "status-icon" }),
    edited: _jsx(Pencil, { className: "h-3 w-3", "data-testid": "status-icon" }),
};
export function ChatBubble(_a) {
    var message = _a.message, type = _a.type, index = _a.index, className = _a.className, align = _a.align, _b = _a.size, size = _b === void 0 ? 'default' : _b, _c = _a.editable, editable = _c === void 0 ? false : _c, onMessageChange = _a.onMessageChange, onMessageRemove = _a.onMessageRemove, _d = _a.showAuthor, showAuthor = _d === void 0 ? true : _d, authorLabel = _a.authorLabel, actions = _a.actions, timestamp = _a.timestamp, status = _a.status;
    var _e = useState(false), isEditing = _e[0], setIsEditing = _e[1];
    var _f = useState(message), tempMessage = _f[0], setTempMessage = _f[1];
    var inputRef = useRef(null);
    var t = useTranslation().t;
    var isUser = type === 'user';
    var defaultAlign = isUser ? 'end' : 'start';
    useEffect(function () {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isEditing]);
    var handleDoubleClick = function () {
        if (editable) {
            setIsEditing(true);
        }
    };
    var handleBlur = function () {
        if (onMessageChange && index !== undefined) {
            onMessageChange(index, type, tempMessage);
        }
        setIsEditing(false);
    };
    var handleKeyDown = function (e) {
        if (e.key === 'Enter') {
            handleBlur();
        }
        else if (e.key === 'Escape') {
            setTempMessage(message);
            setIsEditing(false);
        }
    };
    var handleRemove = function () {
        if (onMessageRemove && index !== undefined) {
            onMessageRemove(index);
        }
    };
    return (_jsx("div", { className: cn(chatBubbleVariants({ align: align || defaultAlign, size: size }), className), children: _jsxs("div", { className: "space-y-1", children: [showAuthor && (_jsx("div", { className: "text-xs text-muted-foreground", children: authorLabel || t("common.".concat(type)) })), _jsxs("div", { className: "flex items-start gap-2", children: [_jsx("div", { className: cn(messageVariants({
                                variant: type,
                                size: size,
                            })), onDoubleClick: handleDoubleClick, children: isEditing ? (_jsx(Input, { ref: inputRef, value: tempMessage, onChange: function (e) { return setTempMessage(e.target.value); }, onBlur: handleBlur, onKeyDown: handleKeyDown, className: "min-w-[200px]" })) : (_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { children: message }), status && (_jsx("span", { className: "ml-2 inline-flex items-center", children: statusIcons[status] }))] })) }), onMessageRemove && !isEditing && (_jsx(Button, { variant: "ghost", size: "sm", onClick: handleRemove, className: "opacity-0 group-hover:opacity-100", "aria-label": "remove", children: _jsx(X, { className: "h-4 w-4" }) })), actions] }), timestamp && (_jsx("div", { className: "text-xs text-muted-foreground", children: typeof timestamp === 'string'
                        ? timestamp
                        : format(timestamp, 'HH:mm') }))] }) }));
}
