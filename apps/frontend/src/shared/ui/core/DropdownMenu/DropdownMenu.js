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
import * as React from "react";
import { Check, ChevronRight, Circle } from "lucide-react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";
var menuContentVariants = cva("z-50 overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2", {
    variants: {
        size: {
            sm: "min-w-[6rem] p-1 text-sm",
            default: "min-w-[8rem] p-1",
            lg: "min-w-[12rem] p-2",
        },
    },
    defaultVariants: {
        size: "default",
    },
});
var menuItemVariants = cva("relative flex cursor-default select-none items-center rounded-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50", {
    variants: {
        size: {
            sm: "px-2 py-1 text-sm",
            default: "px-2 py-1.5 text-sm",
            lg: "px-3 py-2 text-base",
        },
        inset: {
            true: "pl-8",
        },
    },
    defaultVariants: {
        size: "default",
        inset: false,
    },
});
var DropdownMenu = DropdownMenuPrimitive.Root;
var DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
var DropdownMenuGroup = DropdownMenuPrimitive.Group;
var DropdownMenuPortal = DropdownMenuPrimitive.Portal;
var DropdownMenuSub = DropdownMenuPrimitive.Sub;
var DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;
var DropdownMenuSubTrigger = React.forwardRef(function (props, ref) {
    var className = props.className, inset = props.inset, size = props.size, children = props.children, restProps = __rest(props, ["className", "inset", "size", "children"]);
    return (_jsxs(DropdownMenuPrimitive.SubTrigger, __assign({ ref: ref, className: cn(menuItemVariants({ size: size, inset: inset, className: className })) }, restProps, { children: [children, _jsx(ChevronRight, { className: "ml-auto h-4 w-4" })] })));
});
DropdownMenuSubTrigger.displayName = DropdownMenuPrimitive.SubTrigger.displayName;
var DropdownMenuSubContent = React.forwardRef(function (props, ref) {
    var className = props.className, size = props.size, restProps = __rest(props, ["className", "size"]);
    return (_jsx(DropdownMenuPrimitive.SubContent, __assign({ ref: ref, className: cn(menuContentVariants({ size: size, className: className })) }, restProps)));
});
DropdownMenuSubContent.displayName = DropdownMenuPrimitive.SubContent.displayName;
var DropdownMenuContent = React.forwardRef(function (props, ref) {
    var className = props.className, size = props.size, _b = props.sideOffset, sideOffset = _b === void 0 ? 4 : _b, restProps = __rest(props, ["className", "size", "sideOffset"]);
    return (_jsx(DropdownMenuPrimitive.Portal, { children: _jsx(DropdownMenuPrimitive.Content, __assign({ ref: ref, sideOffset: sideOffset, className: cn(menuContentVariants({ size: size, className: className })) }, restProps)) }));
});
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName;
var DropdownMenuItem = React.forwardRef(function (props, ref) {
    var className = props.className, inset = props.inset, size = props.size, restProps = __rest(props, ["className", "inset", "size"]);
    return (_jsx(DropdownMenuPrimitive.Item, __assign({ ref: ref, className: cn(menuItemVariants({ size: size, inset: inset, className: className })) }, restProps)));
});
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName;
var DropdownMenuCheckboxItem = React.forwardRef(function (props, ref) {
    var className = props.className, children = props.children, checked = props.checked, size = props.size, restProps = __rest(props, ["className", "children", "checked", "size"]);
    return (_jsxs(DropdownMenuPrimitive.CheckboxItem, __assign({ ref: ref, className: cn(menuItemVariants({ size: size, inset: true, className: className })), checked: checked }, restProps, { children: [_jsx("span", { className: "absolute left-2 flex h-3.5 w-3.5 items-center justify-center", children: _jsx(DropdownMenuPrimitive.ItemIndicator, { children: _jsx(Check, { className: "h-4 w-4" }) }) }), children] })));
});
DropdownMenuCheckboxItem.displayName = DropdownMenuPrimitive.CheckboxItem.displayName;
var DropdownMenuRadioItem = React.forwardRef(function (props, ref) {
    var className = props.className, children = props.children, size = props.size, restProps = __rest(props, ["className", "children", "size"]);
    return (_jsxs(DropdownMenuPrimitive.RadioItem, __assign({ ref: ref, className: cn(menuItemVariants({ size: size, inset: true, className: className })) }, restProps, { children: [_jsx("span", { className: "absolute left-2 flex h-3.5 w-3.5 items-center justify-center", children: _jsx(DropdownMenuPrimitive.ItemIndicator, { children: _jsx(Circle, { className: "h-2 w-2 fill-current" }) }) }), children] })));
});
DropdownMenuRadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName;
var DropdownMenuLabel = React.forwardRef(function (props, ref) {
    var className = props.className, inset = props.inset, size = props.size, restProps = __rest(props, ["className", "inset", "size"]);
    return (_jsx(DropdownMenuPrimitive.Label, __assign({ ref: ref, className: cn(menuItemVariants({ size: size, inset: inset, className: className }), "font-semibold") }, restProps)));
});
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName;
var DropdownMenuSeparator = React.forwardRef(function (props, ref) {
    var className = props.className, restProps = __rest(props, ["className"]);
    return (_jsx(DropdownMenuPrimitive.Separator, __assign({ ref: ref, className: cn("-mx-1 my-1 h-px bg-muted", className) }, restProps)));
});
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName;
var DropdownMenuShortcut = function (_a) {
    var className = _a.className, size = _a.size, props = __rest(_a, ["className", "size"]);
    return (_jsx("span", __assign({ className: cn("ml-auto tracking-widest opacity-60", size === "sm" ? "text-xs" : size === "lg" ? "text-sm" : "text-xs", className) }, props)));
};
DropdownMenuShortcut.displayName = "DropdownMenuShortcut";
export { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuCheckboxItem, DropdownMenuRadioItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuGroup, DropdownMenuPortal, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuRadioGroup, };
