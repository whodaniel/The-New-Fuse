"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s)
        if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
            t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SelectSeparator = exports.SelectItem = exports.SelectLabel = exports.SelectContent = exports.SelectTrigger = exports.SelectValue = exports.SelectGroup = exports.Select = void 0;
import React from 'react';
var Select = Select.Root;
exports.Select = Select;
var SelectGroup = Select.Group;
exports.SelectGroup = SelectGroup;
var SelectValue = Select.Value;
exports.SelectValue = SelectValue;
var SelectTrigger = React.forwardRef(function (props, ref) {
    var className = props.className, children = props.children, restProps = __rest(props, ["className", "children"]);
    return (_jsxs(Select.Trigger, __assign({ ref: ref, className: cn("flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1", className) }, restProps, { children: [children, _jsx(Select.Icon, { asChild: true, children: _jsx(ChevronDown, { className: "h-4 w-4 opacity-50" }) })] })));
});
exports.SelectTrigger = SelectTrigger;
SelectTrigger.displayName = Select.Trigger.displayName;
var SelectContent = React.forwardRef(function (props, ref) {
    var className = props.className, children = props.children, _a = props.position, position = _a === void 0 ? "popper" : _a, restProps = __rest(props, ["className", "children", "position"]);
    return (_jsx(Select.Portal, { children: _jsx(Select.Content, __assign({ ref: ref, className: cn("relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2", position === "popper" &&
                "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1", className), position: position }, restProps, { children: _jsx(Select.Viewport, { className: cn("p-1", position === "popper" &&
                    "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"), children: children }) })) }));
});
exports.SelectContent = SelectContent;
SelectContent.displayName = Select.Content.displayName;
var SelectLabel = React.forwardRef(function (props, ref) {
    var className = props.className, restProps = __rest(props, ["className"]);
    return (_jsx(Select.Label, __assign({ ref: ref, className: cn("py-1.5 pl-8 pr-2 text-sm font-semibold", className) }, restProps)));
});
exports.SelectLabel = SelectLabel;
SelectLabel.displayName = Select.Label.displayName;
var SelectItem = React.forwardRef(function (props, ref) {
    var className = props.className, children = props.children, restProps = __rest(props, ["className", "children"]);
    return (_jsxs(Select.Item, __assign({ ref: ref, className: cn("relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50", className) }, restProps, { children: [_jsx("span", { className: "absolute left-2 flex h-3.5 w-3.5 items-center justify-center", children: _jsx(Select.ItemIndicator, { children: _jsx(Check, { className: "h-4 w-4" }) }) }), _jsx(Select.ItemText, { children: children })] })));
});
exports.SelectItem = SelectItem;
SelectItem.displayName = Select.Item.displayName;
var SelectSeparator = React.forwardRef(function (props, ref) {
    var className = props.className, restProps = __rest(props, ["className"]);
    return (_jsx(Select.Separator, __assign({ ref: ref, className: cn("-mx-1 my-1 h-px bg-muted", className) }, restProps)));
});
exports.SelectSeparator = SelectSeparator;
SelectSeparator.displayName = Select.Separator.displayName;
