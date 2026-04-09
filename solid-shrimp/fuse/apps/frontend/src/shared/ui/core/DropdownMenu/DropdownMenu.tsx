var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
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
const menuContentVariants = cva("z-50 overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2", {
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
const menuItemVariants = cva("relative flex cursor-default select-none items-center rounded-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50", {
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
const DropdownMenu = DropdownMenuPrimitive.Root;
const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
const DropdownMenuGroup = DropdownMenuPrimitive.Group;
const DropdownMenuPortal = DropdownMenuPrimitive.Portal;
const DropdownMenuSub = DropdownMenuPrimitive.Sub;
const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;
const DropdownMenuSubTrigger = React.forwardRef((props, ref) => {
    var { className, inset, size, children } = props, restProps = __rest(props, ["className", "inset", "size", "children"]);
    return (<DropdownMenuPrimitive.SubTrigger ref={ref} className={cn(menuItemVariants({ size, inset, className }))} {...restProps}>
    {children}
    <ChevronRight className="ml-auto h-4 w-4"/>
  </DropdownMenuPrimitive.SubTrigger>);
});
DropdownMenuSubTrigger.displayName = DropdownMenuPrimitive.SubTrigger.displayName;
const DropdownMenuSubContent = React.forwardRef((props, ref) => {
    var { className, size } = props, restProps = __rest(props, ["className", "size"]);
    return (<DropdownMenuPrimitive.SubContent ref={ref} className={cn(menuContentVariants({ size, className }))} {...restProps}/>);
});
DropdownMenuSubContent.displayName = DropdownMenuPrimitive.SubContent.displayName;
const DropdownMenuContent = React.forwardRef((props, ref) => {
    var { className, size, sideOffset = 4 } = props, restProps = __rest(props, ["className", "size", "sideOffset"]);
    return (<DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content ref={ref} sideOffset={sideOffset} className={cn(menuContentVariants({ size, className }))} {...restProps}/>
  </DropdownMenuPrimitive.Portal>);
});
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName;
const DropdownMenuItem = React.forwardRef((props, ref) => {
    var { className, inset, size } = props, restProps = __rest(props, ["className", "inset", "size"]);
    return (<DropdownMenuPrimitive.Item ref={ref} className={cn(menuItemVariants({ size, inset, className }))} {...restProps}/>);
});
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName;
const DropdownMenuCheckboxItem = React.forwardRef((props, ref) => {
    var { className, children, checked, size } = props, restProps = __rest(props, ["className", "children", "checked", "size"]);
    return (<DropdownMenuPrimitive.CheckboxItem ref={ref} className={cn(menuItemVariants({ size, inset: true, className }))} checked={checked} {...restProps}>
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Check className="h-4 w-4"/>
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.CheckboxItem>);
});
DropdownMenuCheckboxItem.displayName = DropdownMenuPrimitive.CheckboxItem.displayName;
const DropdownMenuRadioItem = React.forwardRef((props, ref) => {
    var { className, children, size } = props, restProps = __rest(props, ["className", "children", "size"]);
    return (<DropdownMenuPrimitive.RadioItem ref={ref} className={cn(menuItemVariants({ size, inset: true, className }))} {...restProps}>
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Circle className="h-2 w-2 fill-current"/>
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.RadioItem>);
});
DropdownMenuRadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName;
const DropdownMenuLabel = React.forwardRef((props, ref) => {
    var { className, inset, size } = props, restProps = __rest(props, ["className", "inset", "size"]);
    return (<DropdownMenuPrimitive.Label ref={ref} className={cn(menuItemVariants({ size, inset, className }), "font-semibold")} {...restProps}/>);
});
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName;
const DropdownMenuSeparator = React.forwardRef((props, ref) => {
    var { className } = props, restProps = __rest(props, ["className"]);
    return (<DropdownMenuPrimitive.Separator ref={ref} className={cn("-mx-1 my-1 h-px bg-muted", className)} {...restProps}/>);
});
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName;
const DropdownMenuShortcut = (_a) => {
    var { className, size } = _a, props = __rest(_a, ["className", "size"]);
    return (<span className={cn("ml-auto tracking-widest opacity-60", size === "sm" ? "text-xs" : size === "lg" ? "text-sm" : "text-xs", className)} {...props}/>);
};
DropdownMenuShortcut.displayName = "DropdownMenuShortcut";
export { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuCheckboxItem, DropdownMenuRadioItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuGroup, DropdownMenuPortal, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuRadioGroup, };
