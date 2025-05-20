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
import * as SwitchPrimitives from "@radix-ui/react-switch";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";
const switchVariants = cva("peer inline-flex shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input", {
    variants: {
        size: {
            default: "h-6 w-11",
            sm: "h-5 w-9",
            lg: "h-7 w-[52px]",
        },
    },
    defaultVariants: {
        size: "default",
    },
});
const thumbVariants = cva("pointer-events-none block rounded-full bg-background shadow-lg ring-0 transition-transform", {
    variants: {
        size: {
            default: "h-5 w-5 data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0",
            sm: "h-4 w-4 data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0",
            lg: "h-6 w-6 data-[state=checked]:translate-x-6 data-[state=unchecked]:translate-x-0",
        },
    },
    defaultVariants: {
        size: "default",
    },
});
const Switch = React.forwardRef((_a, ref) => {
    var { className, size, label, description, labelPosition = "right" } = _a, props = __rest(_a, ["className", "size", "label", "description", "labelPosition"]);
    return (<div className={cn("flex items-center gap-x-2", labelPosition === "left" ? "flex-row-reverse" : "flex-row")}>
    <SwitchPrimitives.Root className={cn(switchVariants({ size, className }))} {...props} ref={ref}>
      <SwitchPrimitives.Thumb className={cn(thumbVariants({ size }))}/>
    </SwitchPrimitives.Root>
    {(label || description) && (<div className="flex flex-col">
        {label && (<label className={cn("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70", props.disabled && "opacity-70 cursor-not-allowed")}>
            {label}
          </label>)}
        {description && (<p className={cn("text-sm text-muted-foreground", props.disabled && "opacity-70")}>
            {description}
          </p>)}
      </div>)}
  </div>);
});
Switch.displayName = SwitchPrimitives.Root.displayName;
export { Switch, switchVariants, thumbVariants };
//# sourceMappingURL=Switch.js.map