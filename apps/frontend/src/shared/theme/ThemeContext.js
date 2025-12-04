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
import { createContext, useContext, useState, useEffect } from 'react';
import { ThemeProvider as ChakraThemeProvider } from '@chakra-ui/react';
import { baseTheme, darkTheme } from './themes';
var ThemeContext = createContext(undefined);
export var ThemeProvider = function (_a) {
    var children = _a.children;
    var _b = useState('base'), currentTheme = _b[0], setCurrentTheme = _b[1];
    var _c = useState(baseTheme), themeConfig = _c[0], setThemeConfig = _c[1];
    useEffect(function () {
        var savedTheme = localStorage.getItem('preferred-theme');
        if (savedTheme) {
            setCurrentTheme(savedTheme);
        }
    }, []);
    var setTheme = function (theme) {
        setCurrentTheme(theme);
        localStorage.setItem('preferred-theme', theme);
        setThemeConfig(theme === 'dark' ? darkTheme : baseTheme);
    };
    var customizeTheme = function (customizations) {
        setThemeConfig(function (prev) { return (__assign(__assign({}, prev), customizations)); });
    };
    return (_jsx(ThemeContext.Provider, { value: { currentTheme: currentTheme, setTheme: setTheme, customizeTheme: customizeTheme }, children: _jsx(ChakraThemeProvider, { theme: themeConfig, children: children }) }));
};
export var useTheme = function () {
    var context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
