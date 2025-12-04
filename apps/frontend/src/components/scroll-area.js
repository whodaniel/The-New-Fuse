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
exports.ScrollBar = exports.ScrollArea = void 0;
import React from 'react';
import utils_1 from '../../lib/utils';
var ScrollArea = React.forwardRef(function (props, ref) {
    var className = props.className, children = props.children, restProps = __rest(props, ["className", "children"]);
    return (_jsxs(ScrollArea.Root, __assign({ ref: ref, className: (0, utils_1.cn)("relative overflow-hidden", className) }, restProps, { children: [_jsx(ScrollArea.Viewport, { className: "h-full w-full rounded-[inherit]", children: children }), _jsx(ScrollBar, {}), _jsx(ScrollArea.Corner, {})] })));
});
exports.ScrollArea = ScrollArea;
ScrollArea.displayName = ScrollArea.Root.displayName;
var ScrollBar = React.forwardRef(function (props, ref) {
    var className = props.className, _a = props.orientation, orientation = _a === void 0 ? "vertical" : _a, restProps = __rest(props, ["className", "orientation"]);
    return (_jsx(ScrollArea.ScrollAreaScrollbar, __assign({ ref: ref, orientation: orientation, className: (0, utils_1.cn)("flex touch-none select-none transition-colors", orientation === "vertical" &&
            "h-full w-2.5 border-l border-l-transparent p-[1px]", orientation === "horizontal" &&
            "h-2.5 flex-col border-t border-t-transparent p-[1px]", className) }, restProps, { children: _jsx(ScrollArea.ScrollAreaThumb, { className: "relative flex-1 rounded-full bg-neutral-200 dark:bg-neutral-800" }) })));
});
exports.ScrollBar = ScrollBar;
ScrollBar.displayName = ScrollArea.ScrollAreaScrollbar.displayName;
