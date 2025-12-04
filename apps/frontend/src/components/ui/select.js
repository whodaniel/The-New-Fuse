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
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState, useRef, useEffect } from 'react';
var Select = React.forwardRef(function (_a, ref) {
    var _b = _a.className, className = _b === void 0 ? '' : _b, onChange = _a.onChange, onValueChange = _a.onValueChange, children = _a.children, props = __rest(_a, ["className", "onChange", "onValueChange", "children"]);
    // Handle both onChange and onValueChange patterns
    var handleChange = function (e) {
        var value = e.target.value;
        onChange === null || onChange === void 0 ? void 0 : onChange(value);
        onValueChange === null || onValueChange === void 0 ? void 0 : onValueChange(value);
    };
    // Check if children contain option elements (simple pattern) or components (advanced pattern)
    var hasOptionChildren = React.Children.toArray(children).some(function (child) { return React.isValidElement(child) && child.type === 'option'; });
    if (hasOptionChildren) {
        // Simple select with option children
        return (_jsx("select", __assign({ className: "\n            flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm\n            ring-offset-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2\n            disabled:cursor-not-allowed disabled:opacity-50\n            ".concat(className, "\n          "), onChange: handleChange, ref: ref }, props, { children: children })));
    }
    else {
        // Advanced select - wrap in SelectRoot context
        return (_jsx(SelectRoot, { value: props.value, onValueChange: onValueChange || onChange, children: children }));
    }
});
Select.displayName = 'Select';
var SelectContext = React.createContext(undefined);
var SelectRoot = function (_a) {
    var value = _a.value, onValueChange = _a.onValueChange, children = _a.children, defaultValue = _a.defaultValue;
    var _b = useState(false), open = _b[0], setOpen = _b[1];
    var _c = useState(defaultValue || value || ''), internalValue = _c[0], setInternalValue = _c[1];
    var currentValue = value !== undefined ? value : internalValue;
    var handleValueChange = function (newValue) {
        if (value === undefined) {
            setInternalValue(newValue);
        }
        onValueChange === null || onValueChange === void 0 ? void 0 : onValueChange(newValue);
        setOpen(false);
    };
    return (_jsx(SelectContext.Provider, { value: { value: currentValue, onValueChange: handleValueChange, open: open, setOpen: setOpen }, children: children }));
};
var SelectTrigger = function (_a) {
    var _b = _a.className, className = _b === void 0 ? '' : _b, children = _a.children;
    var context = React.useContext(SelectContext);
    var ref = useRef(null);
    if (!context) {
        throw new Error('SelectTrigger must be used within a Select');
    }
    return (_jsxs("button", { ref: ref, type: "button", className: "\n        flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm\n        ring-offset-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2\n        disabled:cursor-not-allowed disabled:opacity-50\n        ".concat(className, "\n      "), onClick: function () { return context.setOpen(!context.open); }, children: [children, _jsx("svg", { className: "h-4 w-4 opacity-50", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M19 9l-7 7-7-7" }) })] }));
};
var SelectValue = function (_a) {
    var _b = _a.placeholder, placeholder = _b === void 0 ? 'Select...' : _b;
    var context = React.useContext(SelectContext);
    if (!context) {
        throw new Error('SelectValue must be used within a Select');
    }
    return _jsx("span", { children: context.value || placeholder });
};
var SelectContent = function (_a) {
    var _b = _a.className, className = _b === void 0 ? '' : _b, children = _a.children;
    var context = React.useContext(SelectContext);
    var ref = useRef(null);
    if (!context) {
        throw new Error('SelectContent must be used within a Select');
    }
    useEffect(function () {
        var handleClickOutside = function (event) {
            if (ref.current && !ref.current.contains(event.target)) {
                context.setOpen(false);
            }
        };
        if (context.open) {
            document.addEventListener('mousedown', handleClickOutside);
            return function () {
                document.removeEventListener('mousedown', handleClickOutside);
            };
        }
    }, [context.open, context]);
    if (!context.open) {
        return null;
    }
    return (_jsx("div", { ref: ref, className: "\n        absolute z-50 min-w-[8rem] overflow-hidden rounded-md border border-gray-200 bg-white p-1 text-gray-950 shadow-lg\n        animate-in fade-in-0 zoom-in-95\n        ".concat(className, "\n      "), children: children }));
};
var SelectItem = function (_a) {
    var value = _a.value, _b = _a.className, className = _b === void 0 ? '' : _b, children = _a.children;
    var context = React.useContext(SelectContext);
    if (!context) {
        throw new Error('SelectItem must be used within a Select');
    }
    var isSelected = context.value === value;
    return (_jsxs("div", { className: "\n        relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none\n        hover:bg-gray-100 focus:bg-gray-100 data-[disabled]:pointer-events-none data-[disabled]:opacity-50\n        ".concat(isSelected ? 'bg-gray-100' : '', "\n        ").concat(className, "\n      "), onClick: function () { var _a; return (_a = context.onValueChange) === null || _a === void 0 ? void 0 : _a.call(context, value); }, children: [isSelected && (_jsx("span", { className: "absolute left-2 flex h-3.5 w-3.5 items-center justify-center", children: _jsx("svg", { className: "h-4 w-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M5 13l4 4L19 7" }) }) })), children] }));
};
// Export both simple and advanced versions
export { Select, SelectRoot as SelectContainer, SelectTrigger, SelectContent, SelectItem, SelectValue };
// Default export for backwards compatibility
export default Select;
