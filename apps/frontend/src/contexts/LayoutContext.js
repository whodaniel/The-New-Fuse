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
import { createContext, useState, useContext } from 'react';
var LayoutContext = createContext(null);
var defaultLayout = {
    sidebarOpen: true,
};
export function LayoutProvider(_a) {
    var children = _a.children;
    var _b = useState(defaultLayout), layout = _b[0], setLayout = _b[1];
    var toggleSidebar = function () {
        setLayout(function (prev) { return (__assign(__assign({}, prev), { sidebarOpen: !prev.sidebarOpen })); });
    };
    return (_jsx(LayoutContext.Provider, { value: { layout: layout, setLayout: setLayout, toggleSidebar: toggleSidebar }, children: children }));
}
export function useLayout() {
    var context = useContext(LayoutContext);
    if (!context) {
        throw new Error('useLayout must be used within a LayoutProvider');
    }
    return context;
}
