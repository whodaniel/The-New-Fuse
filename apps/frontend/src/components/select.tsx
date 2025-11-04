import { Divider } from '@chakra-ui/react';
"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SelectSeparator = exports.SelectItem = exports.SelectLabel = exports.SelectContent = exports.SelectTrigger = exports.SelectValue = exports.SelectGroup = exports.Select = void 0;
import React from 'react';

import utils_1 from '../../lib/utils';
const Select = Select.Root;
exports.Select = Select;
const SelectGroup = Select.Group;
exports.SelectGroup = SelectGroup;
const SelectValue = Select.Value;
exports.SelectValue = SelectValue;
const SelectTrigger = React.forwardRef((props, ref) => {
    var { className, children } = props, restProps = __rest(props, ["className", "children"]);
    return (<Select.Trigger ref={ref} className={cn("flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1", className)} {...restProps}>
      {children}
      <Select.Icon asChild>
        <ChevronDown className="h-4 w-4 opacity-50"/>
      </Select.Icon>
    </Select.Trigger>);
});
exports.SelectTrigger = SelectTrigger;
SelectTrigger.displayName = Select.Trigger.displayName;
const SelectContent = React.forwardRef((props, ref) => {
    var { className, children, position = "popper" } = props, restProps = __rest(props, ["className", "children", "position"]);
    return (<Select.Portal>
      <Select.Content ref={ref} className={cn("relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2", position === "popper" &&
            "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1", className)} position={position} {...restProps}>
        <Select.Viewport className={cn("p-1", position === "popper" &&
            "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]")}>
          {children}
        </Select.Viewport>
      </Select.Content>
    </Select.Portal>);
});
exports.SelectContent = SelectContent;
SelectContent.displayName = Select.Content.displayName;
const SelectLabel = React.forwardRef((props, ref) => {
    var { className } = props, restProps = __rest(props, ["className"]);
    return (<Select.Label ref={ref} className={cn("py-1.5 pl-8 pr-2 text-sm font-semibold", className)} {...restProps}/>);
});
exports.SelectLabel = SelectLabel;
SelectLabel.displayName = Select.Label.displayName;
const SelectItem = React.forwardRef((props, ref) => {
    var { className, children } = props, restProps = __rest(props, ["className", "children"]);
    return (<Select.Item ref={ref} className={cn("relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50", className)} {...restProps}>
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        <Select.ItemIndicator>
          <Check className="h-4 w-4"/>
        </Select.ItemIndicator>
      </span>

      <Select.ItemText>{children}</Select.ItemText>
    </Select.Item>);
});
exports.SelectItem = SelectItem;
SelectItem.displayName = Select.Item.displayName;
const SelectSeparator = React.forwardRef((props, ref) => {
    var { className } = props, restProps = __rest(props, ["className"]);
    return (<Select.Separator ref={ref} className={cn("-mx-1 my-1 h-px bg-muted", className)} {...restProps}/>);
});
exports.SelectSeparator = SelectSeparator;
SelectSeparator.displayName = Select.Separator.displayName;
export {};
