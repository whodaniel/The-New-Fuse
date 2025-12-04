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
import React from 'react';
import { Box, Button, Text } from '@chakra-ui/react';
import { Settings, Moon, Sun, LayoutDashboard, Monitor, Code } from 'lucide-react';
export var PopupContainer = function (_a) {
    var _b = _a.isMainApp, isMainApp = _b === void 0 ? false : _b, _c = _a.initialDarkMode, initialDarkMode = _c === void 0 ? false : _c, onThemeChange = _a.onThemeChange, _d = _a.containerStyle, containerStyle = _d === void 0 ? {} : _d;
    var _e = React.useState(initialDarkMode), darkMode = _e[0], setDarkMode = _e[1];
    var handleThemeChange = function (newDarkMode) {
        setDarkMode(newDarkMode);
        onThemeChange === null || onThemeChange === void 0 ? void 0 : onThemeChange(newDarkMode);
    };
    return (_jsxs(Box, __assign({ width: "100%", height: "100%", bg: darkMode ? 'gray.800' : 'white', color: darkMode ? 'white' : 'gray.800', p: 4 }, containerStyle, { children: [_jsxs(Box, { display: "flex", alignItems: "center", justifyContent: "space-between", mb: 4, children: [_jsx(Text, { fontSize: "lg", fontWeight: "bold", children: isMainApp ? 'Main App Integration' : 'Chrome Extension' }), _jsx(Button, { size: "sm", onClick: function () { return handleThemeChange(!darkMode); }, leftIcon: darkMode ? _jsx(Sun, { size: 16 }) : _jsx(Moon, { size: 16 }), children: darkMode ? 'Light' : 'Dark' })] }), _jsxs(Box, { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 2, mb: 4, children: [_jsx(Button, { size: "sm", leftIcon: _jsx(LayoutDashboard, { size: 16 }), children: "Dashboard" }), _jsx(Button, { size: "sm", leftIcon: _jsx(Code, { size: 16 }), children: "Code" }), _jsx(Button, { size: "sm", leftIcon: _jsx(Monitor, { size: 16 }), children: "Debug" }), _jsx(Button, { size: "sm", leftIcon: _jsx(Settings, { size: 16 }), children: "Settings" })] }), _jsxs(Box, { p: 3, bg: darkMode ? 'gray.700' : 'gray.100', borderRadius: "md", children: [_jsx(Text, { fontSize: "sm", fontWeight: "medium", mb: 2, children: "System Status" }), _jsxs(Box, { display: "flex", alignItems: "center", gap: 2, children: [_jsx(Box, { w: 2, h: 2, bg: "green.500", borderRadius: "full" }), _jsx(Text, { fontSize: "xs", children: "Extension active" })] })] })] })));
};
