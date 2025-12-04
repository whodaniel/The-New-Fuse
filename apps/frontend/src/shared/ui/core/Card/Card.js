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
import { jsx as _jsx } from "react/jsx-runtime";
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
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";
var cardVariants = cva("rounded-lg border bg-card text-card-foreground shadow-sm", {
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
var Card = React.forwardRef(function (props, ref) {
    var className = props.className, variant = props.variant, size = props.size, _a = props.asChild, asChild = _a === void 0 ? false : _a, restProps = __rest(props, ["className", "variant", "size", "asChild"]);
    var Comp = asChild ? "div" : "div";
    return (_jsx(Comp, __assign({ ref: ref, className: cn(cardVariants({ variant: variant, size: size, className: className })) }, restProps)));
});
Card.displayName = "Card";
var CardHeader = React.forwardRef(function (props, ref) {
    var className = props.className, restProps = __rest(props, ["className"]);
    return (_jsx("div", __assign({ ref: ref, className: cn("flex flex-col space-y-1.5", className) }, restProps)));
});
CardHeader.displayName = "CardHeader";
var CardTitle = React.forwardRef(function (props, ref) {
    var className = props.className, restProps = __rest(props, ["className"]);
    return (_jsx("h3", __assign({ ref: ref, className: cn("text-2xl font-semibold leading-none tracking-tight", className) }, restProps)));
});
CardTitle.displayName = "CardTitle";
var CardDescription = React.forwardRef(function (props, ref) {
    var className = props.className, restProps = __rest(props, ["className"]);
    return (_jsx("p", __assign({ ref: ref, className: cn("text-sm text-muted-foreground", className) }, restProps)));
});
CardDescription.displayName = "CardDescription";
var CardContent = React.forwardRef(function (props, ref) {
    var className = props.className, restProps = __rest(props, ["className"]);
    return (_jsx("div", __assign({ ref: ref, className: cn("", className) }, restProps)));
});
CardContent.displayName = "CardContent";
var CardFooter = React.forwardRef(function (props, ref) {
    var className = props.className, restProps = __rest(props, ["className"]);
    return (_jsx("div", __assign({ ref: ref, className: cn("flex items-center mt-4", className) }, restProps)));
});
CardFooter.displayName = "CardFooter";
export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, cardVariants, };
