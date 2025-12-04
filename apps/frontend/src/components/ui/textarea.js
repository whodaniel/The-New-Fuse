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
import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
var Textarea = React.forwardRef(function (_a, ref) {
    var _b = _a.className, className = _b === void 0 ? '' : _b, props = __rest(_a, ["className"]);
    return (_jsx("textarea", __assign({ className: "\n          flex min-h-[80px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm\n          ring-offset-white placeholder:text-gray-500 focus-visible:outline-none\n          focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2\n          disabled:cursor-not-allowed disabled:opacity-50\n          ".concat(className, "\n        "), ref: ref }, props)));
});
Textarea.displayName = 'Textarea';
export { Textarea };
