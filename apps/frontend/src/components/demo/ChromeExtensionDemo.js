import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Card, CardBody, Box, Text, Button, Fade } from '@chakra-ui/react';
import { Extension, Close } from 'lucide-react';
import { PopupContainer } from "../ui/popup";
var ChromeExtensionDemo = function (_a) {
    var _b = _a.defaultOpen, defaultOpen = _b === void 0 ? false : _b;
    var _c = useState(defaultOpen), isOpen = _c[0], setIsOpen = _c[1];
    var _d = useState(false), isDarkMode = _d[0], setIsDarkMode = _d[1];
    var handleThemeChange = function (darkMode) {
        setIsDarkMode(darkMode);
    };
    if (!isOpen) {
        return (_jsx(Card, { m: 2, maxW: "400px", children: _jsxs(CardBody, { children: [_jsxs(Box, { display: "flex", alignItems: "center", gap: 2, mb: 2, children: [_jsx(Extension, { color: "blue.500" }), _jsx(Text, { fontSize: "xl", fontWeight: "bold", children: "Chrome Extension UI Demo" })] }), _jsx(Text, { color: "gray.600", mb: 4, children: "Experience the recovered Chrome extension interface integrated into the main application." }), _jsx(Button, { colorScheme: "blue", onClick: function () { return setIsOpen(true); }, leftIcon: _jsx(Extension, {}), children: "Open Extension Interface" })] }) }));
    }
    return (_jsx(Fade, { in: isOpen, children: _jsxs(Box, { position: "fixed", top: "20px", right: "20px", zIndex: "9999", boxShadow: "2xl", borderRadius: "lg", overflow: "hidden", bg: "white", children: [_jsx(Box, { position: "absolute", top: "8px", right: "8px", zIndex: "10000", children: _jsx(Button, { size: "sm", onClick: function () { return setIsOpen(false); }, minW: "auto", p: "2px", bg: "rgba(0,0,0,0.1)", _hover: { bg: "rgba(0,0,0,0.2)" }, children: _jsx(Close, { size: "16px" }) }) }), _jsx(PopupContainer, { isMainApp: true, initialDarkMode: isDarkMode, onThemeChange: handleThemeChange, containerStyle: {
                        width: "420px",
                        height: "620px",
                        maxHeight: "90vh",
                    } })] }) }));
};
export default ChromeExtensionDemo;
