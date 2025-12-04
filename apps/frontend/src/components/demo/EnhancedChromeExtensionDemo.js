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
import { useState } from "react";
import { Container, Card, CardBody, Box, Text, Button, Tabs, TabList, Tab, TabPanels, Input, Textarea } from '@chakra-ui/react';
import { Extension, ExternalLink, Code, ArrowRightLeft } from 'lucide-react';
function TabPanel(props) {
    var children = props.children, value = props.value, index = props.index, other = __rest(props, ["children", "value", "index"]);
    return (_jsx("div", __assign({ role: "tabpanel", hidden: value !== index }, other, { children: value === index && _jsx(Box, { p: 4, children: children }) })));
}
var EnhancedChromeExtensionDemo = function () {
    var _a = useState(0), activeTab = _a[0], setActiveTab = _a[1];
    var _b = useState(false), isDarkMode = _b[0], setIsDarkMode = _b[1];
    var _c = useState(false), showPopup = _c[0], setShowPopup = _c[1];
    var handleTabChange = function (event, newValue) {
        setActiveTab(newValue);
    };
    var handleThemeChange = function (darkMode) {
        setIsDarkMode(darkMode);
    };
    return (_jsxs(Container, { maxW: "1200px", mx: "auto", p: 4, children: [_jsx(Card, { mb: 4, bg: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", color: "white", children: _jsx(CardBody, { children: _jsxs(Box, { display: "flex", alignItems: "center", justifyContent: "space-between", children: [_jsxs(Box, { display: "flex", alignItems: "center", gap: 3, children: [_jsx(Extension, { size: 32 }), _jsxs(Box, { children: [_jsx(Text, { fontSize: "2xl", fontWeight: "bold", children: "Enhanced Chrome Extension" }), _jsx(Text, { opacity: 0.9, children: "Advanced UI Components & Features" })] })] }), _jsx(Button, { size: "sm", colorScheme: "whiteAlpha", variant: "outline", onClick: function () { return setShowPopup(!showPopup); }, leftIcon: _jsx(ExternalLink, {}), children: "Launch Extension" })] }) }) }), _jsx(Card, { children: _jsx(CardBody, { children: _jsxs(Tabs, { index: activeTab, onChange: setActiveTab, children: [_jsxs(TabList, { children: [_jsx(Tab, { children: "Interface" }), _jsx(Tab, { children: "Code Integration" }), _jsx(Tab, { children: "Data Flow" }), _jsx(Tab, { children: "Settings" })] }), _jsxs(TabPanels, { children: [_jsx(TabPanel, { children: _jsxs(Box, { children: [_jsx(Text, { fontSize: "lg", fontWeight: "semibold", mb: 3, children: "Extension Interface" }), _jsx(Text, { color: "gray.600", mb: 4, children: "The extension provides a streamlined interface for Chrome browser integration with real-time communication and feature management." }), _jsxs(Box, { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 4, children: [_jsx(Card, { children: _jsxs(CardBody, { children: [_jsxs(Box, { display: "flex", alignItems: "center", gap: 2, mb: 2, children: [_jsx(Extension, { size: 20 }), _jsx(Text, { fontWeight: "medium", children: "Core Features" })] }), _jsx(Text, { fontSize: "sm", color: "gray.600", children: "Element selection, DOM manipulation, and browser state management." })] }) }), _jsx(Card, { children: _jsxs(CardBody, { children: [_jsxs(Box, { display: "flex", alignItems: "center", gap: 2, mb: 2, children: [_jsx(Code, { size: 20 }), _jsx(Text, { fontWeight: "medium", children: "Developer Tools" })] }), _jsx(Text, { fontSize: "sm", color: "gray.600", children: "Advanced debugging and development features for power users." })] }) })] })] }) }), _jsx(TabPanel, { children: _jsxs(Box, { children: [_jsx(Text, { fontSize: "lg", fontWeight: "semibold", mb: 3, children: "Code Integration" }), _jsx(Text, { color: "gray.600", mb: 4, children: "Seamless integration with your development workflow and codebase." }), _jsxs(Box, { mb: 4, children: [_jsx(Text, { fontSize: "sm", fontWeight: "medium", mb: 2, children: "API Endpoint Configuration" }), _jsx(Input, { placeholder: "https://api.example.com/endpoint", size: "sm" })] }), _jsxs(Box, { mb: 4, children: [_jsx(Text, { fontSize: "sm", fontWeight: "medium", mb: 2, children: "Custom Scripts" }), _jsx(Textarea, { placeholder: "Enter custom JavaScript or configuration...", size: "sm", rows: 4 })] })] }) }), _jsx(TabPanel, { children: _jsxs(Box, { children: [_jsx(Text, { fontSize: "lg", fontWeight: "semibold", mb: 3, children: "Data Flow Management" }), _jsx(Text, { color: "gray.600", mb: 4, children: "Real-time data synchronization and state management across components." }), _jsxs(Box, { display: "flex", alignItems: "center", gap: 4, p: 4, bg: "gray.50", borderRadius: "md", children: [_jsx(ArrowRightLeft, { size: 24, color: "blue.500" }), _jsxs(Box, { children: [_jsx(Text, { fontWeight: "medium", children: "Connected Services" }), _jsx(Text, { fontSize: "sm", color: "gray.600", children: "4 active integrations" })] })] })] }) }), _jsx(TabPanel, { children: _jsxs(Box, { children: [_jsx(Text, { fontSize: "lg", fontWeight: "semibold", mb: 3, children: "Settings & Configuration" }), _jsx(Text, { color: "gray.600", mb: 4, children: "Customize extension behavior and preferences." }), _jsxs(Box, { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 4, children: [_jsxs(Box, { children: [_jsx(Text, { fontSize: "sm", fontWeight: "medium", mb: 2, children: "Theme" }), _jsxs(Button, { size: "sm", variant: "outline", children: [isDarkMode ? 'Dark' : 'Light', " Mode"] })] }), _jsxs(Box, { children: [_jsx(Text, { fontSize: "sm", fontWeight: "medium", mb: 2, children: "Notifications" }), _jsx(Button, { size: "sm", colorScheme: "blue", children: "Enable" })] }), _jsxs(Box, { children: [_jsx(Text, { fontSize: "sm", fontWeight: "medium", mb: 2, children: "Auto-update" }), _jsx(Button, { size: "sm", colorScheme: "green", children: "Active" })] })] })] }) })] })] }) }) })] }));
};
export default EnhancedChromeExtensionDemo;
