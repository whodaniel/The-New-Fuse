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
import * as React from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { cva } from 'class-variance-authority';
import { cn } from '@/utils/cn';
var Select = SelectPrimitive.Root;
var SelectGroup = SelectPrimitive.Group;
var SelectValue = SelectPrimitive.Value;
var selectTriggerVariants = cva('flex w-full items-center justify-between rounded-md border border-input bg-background ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50', {
    variants: {
        variant: {
            default: 'border-input',
            ghost: 'border-none bg-transparent focus:ring-0 focus:ring-offset-0',
            outline: 'border-2',
            filled: 'border-transparent bg-muted',
        },
        size: {
            default: 'h-10 px-4 py-2 text-sm',
            sm: 'h-8 px-3 text-xs',
            lg: 'h-12 px-6 text-lg',
        },
        state: {
            default: '',
            error: 'border-destructive focus:ring-destructive',
            success: 'border-success focus:ring-success',
        },
        width: {
            default: 'w-full',
            auto: 'w-auto',
        },
    },
    defaultVariants: {
        variant: 'default',
        size: 'default',
        state: 'default',
        width: 'default',
    },
});
var SelectTrigger = React.forwardRef(function (props, ref) {
    var className = props.className, variant = props.variant, size = props.size, state = props.state, width = props.width, error = props.error, success = props.success, children = props.children, restProps = __rest(props, ["className", "variant", "size", "state", "width", "error", "success", "children"]);
    var triggerState = error ? 'error' : success ? 'success' : state;
    return (_jsxs(SelectPrimitive.Trigger, __assign({ ref: ref, className: cn(selectTriggerVariants({ variant: variant, size: size, state: triggerState, width: width }), className) }, restProps, { children: [children, _jsx(SelectPrimitive.Icon, { asChild: true, children: _jsx(ChevronDown, { className: "h-4 w-4 opacity-50" }) })] })));
});
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;
var SelectContent = React.forwardRef(function (props, ref) {
    var className = props.className, children = props.children, containerClassName = props.containerClassName, _a = props.position, position = _a === void 0 ? 'popper' : _a, restProps = __rest(props, ["className", "children", "containerClassName", "position"]);
    return (_jsx(SelectPrimitive.Portal, { children: _jsx(SelectPrimitive.Content, __assign({ ref: ref, className: cn('relative z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2', position === 'popper' &&
                'data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1', className), position: position }, restProps, { children: _jsx(SelectPrimitive.Viewport, { className: cn('p-1', position === 'popper' &&
                    'h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]', containerClassName), children: children }) })) }));
});
SelectContent.displayName = SelectPrimitive.Content.displayName;
var SelectLabel = React.forwardRef(function (props, ref) {
    var className = props.className, restProps = __rest(props, ["className"]);
    return (_jsx(SelectPrimitive.Label, __assign({ ref: ref, className: cn('py-1.5 pl-8 pr-2 text-sm font-semibold', className) }, restProps)));
});
SelectLabel.displayName = SelectPrimitive.Label.displayName;
var SelectItem = React.forwardRef(function (props, ref) {
    var className = props.className, children = props.children, description = props.description, icon = props.icon, restProps = __rest(props, ["className", "children", "description", "icon"]);
    return (_jsxs(SelectPrimitive.Item, __assign({ ref: ref, className: cn('relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50', className) }, restProps, { children: [_jsx("span", { className: "absolute left-2 flex h-3.5 w-3.5 items-center justify-center", children: _jsx(SelectPrimitive.ItemIndicator, { children: icon || _jsx(Check, { className: "h-4 w-4" }) }) }), _jsxs("div", { className: "flex flex-col", children: [_jsx(SelectPrimitive.ItemText, { children: children }), description && (_jsx("span", { className: "text-xs text-muted-foreground", children: description }))] })] })));
});
SelectItem.displayName = SelectPrimitive.Item.displayName;
var SelectSeparator = React.forwardRef(function (props, ref) {
    var className = props.className, restProps = __rest(props, ["className"]);
    return (_jsx(SelectPrimitive.Separator, __assign({ ref: ref, className: cn('-mx-1 my-1 h-px bg-muted', className) }, restProps)));
});
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;
export { Select, SelectGroup, SelectValue, SelectTrigger, SelectContent, SelectLabel, SelectItem, SelectSeparator, };
