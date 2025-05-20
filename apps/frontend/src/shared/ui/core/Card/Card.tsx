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
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";
const cardVariants = cva("rounded-lg border bg-card text-card-foreground shadow-sm", {
    variants: {
        variant: {
            default: "border-border",
            ghost: "border-transparent shadow-none",
            outline: "border-2",
            elevated: "border-none shadow-lg",
        },
        size: {
            default: "p-6",
            sm: "p-4",
            lg: "p-8",
        },
    },
    defaultVariants: {
        variant: "default",
        size: "default",
    },
});
const Card = React.forwardRef((_a, ref) => {
    var { className, variant, size, asChild = false } = _a, props = __rest(_a, ["className", "variant", "size", "asChild"]);
    const Comp = asChild ? "div" : "div";
    return (<Comp ref={ref} className={cn(cardVariants({ variant, size, className }))} {...props}/>);
});
Card.displayName = "Card";
const CardHeader = React.forwardRef((_a, ref) => {
    var { className } = _a, props = __rest(_a, ["className"]);
    return (<div ref={ref} className={cn("flex flex-col space-y-1.5", className)} {...props}/>);
});
CardHeader.displayName = "CardHeader";
const CardTitle = React.forwardRef((_a, ref) => {
    var { className } = _a, props = __rest(_a, ["className"]);
    return (<h3 ref={ref} className={cn("text-2xl font-semibold leading-none tracking-tight", className)} {...props}/>);
});
CardTitle.displayName = "CardTitle";
const CardDescription = React.forwardRef((_a, ref) => {
    var { className } = _a, props = __rest(_a, ["className"]);
    return (<p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props}/>);
});
CardDescription.displayName = "CardDescription";
const CardContent = React.forwardRef((_a, ref) => {
    var { className } = _a, props = __rest(_a, ["className"]);
    return (<div ref={ref} className={cn("", className)} {...props}/>);
});
CardContent.displayName = "CardContent";
const CardFooter = React.forwardRef((_a, ref) => {
    var { className } = _a, props = __rest(_a, ["className"]);
    return (<div ref={ref} className={cn("flex items-center mt-4", className)} {...props}/>);
});
CardFooter.displayName = "CardFooter";
export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, cardVariants, };
//# sourceMappingURL=Card.js.map