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
import { createContext, useContext, useState, useEffect } from "react";
import { defaultTheme, darkTheme } from "@/theme/defaultTheme";
var ThemeContext = createContext(undefined);
export var ThemeProvider = function (_a) {
    var children = _a.children, _b = _a.defaultTheme, initialTheme = _b === void 0 ? 'light' : _b;
    var _c = useState(initialTheme), currentTheme = _c[0], setCurrentTheme = _c[1];
    var _d = useState({}), customTheme = _d[0], setCustomTheme = _d[1];
    var theme = __assign(__assign({}, (currentTheme === 'light' ? defaultTheme : darkTheme)), customTheme);
    var setTheme = function (theme) {
        setCurrentTheme(theme);
    };
    var customizeTheme = function (customizations) {
        setCustomTheme(function (prev) { return (__assign(__assign({}, prev), customizations)); });
    };
    useEffect(function () {
        var savedTheme = localStorage.getItem('theme');
        if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
            setCurrentTheme(savedTheme);
        }
    }, []);
    useEffect(function () {
        localStorage.setItem('theme', currentTheme);
        document.documentElement.className = currentTheme;
    }, [currentTheme]);
    return (_jsx(ThemeContext.Provider, { value: {
            currentTheme: currentTheme,
            theme: theme,
            setTheme: setTheme,
            customizeTheme: customizeTheme,
        }, children: children }));
};
export var useTheme = function () {
    var context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
