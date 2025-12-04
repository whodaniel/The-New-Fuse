import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
var TabsContext = React.createContext(undefined);
export var Tabs = function (_a) {
    var value = _a.value, _b = _a.onValueChange, onValueChange = _b === void 0 ? function () { } : _b, children = _a.children, _c = _a.className, className = _c === void 0 ? '' : _c;
    return (_jsx(TabsContext.Provider, { value: { value: value, onValueChange: onValueChange }, children: _jsx("div", { className: "".concat(className), children: children }) }));
};
export var TabsList = function (_a) {
    var children = _a.children, _b = _a.className, className = _b === void 0 ? '' : _b;
    return (_jsx("div", { className: "\n        inline-flex h-10 items-center justify-center rounded-md bg-gray-100 p-1 text-gray-500\n        ".concat(className, "\n      "), children: children }));
};
export var TabsTrigger = function (_a) {
    var value = _a.value, children = _a.children, _b = _a.className, className = _b === void 0 ? '' : _b;
    var context = React.useContext(TabsContext);
    if (!context) {
        throw new Error('TabsTrigger must be used within a Tabs component');
    }
    var isActive = context.value === value;
    return (_jsx("button", { className: "\n        inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5\n        text-sm font-medium ring-offset-white transition-all focus-visible:outline-none\n        focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2\n        disabled:pointer-events-none disabled:opacity-50\n        ".concat(isActive ? 'bg-white text-gray-950 shadow-sm' : 'text-gray-600 hover:text-gray-900', "\n        ").concat(className, "\n      "), onClick: function () { return context.onValueChange(value); }, children: children }));
};
export var TabsContent = function (_a) {
    var value = _a.value, children = _a.children, _b = _a.className, className = _b === void 0 ? '' : _b;
    var context = React.useContext(TabsContext);
    if (!context) {
        throw new Error('TabsContent must be used within a Tabs component');
    }
    if (context.value !== value) {
        return null;
    }
    return (_jsx("div", { className: "\n        mt-2 ring-offset-white focus-visible:outline-none focus-visible:ring-2\n        focus-visible:ring-blue-500 focus-visible:ring-offset-2\n        ".concat(className, "\n      "), children: children }));
};
