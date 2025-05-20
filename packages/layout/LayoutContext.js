"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function (t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s)
                if (Object.prototype.hasOwnProperty.call(s, p))
                    t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useLayout = exports.LayoutProvider = void 0;
var react_1 = require("react");
var defaultTheme = {
    mode: 'system',
    primaryColor: '#2563eb',
    fontSize: 'md',
    spacing: 'comfortable',
};
var LayoutContext = (0, react_1.createContext)(undefined);
var LayoutProvider = function (_a) {
    var children = _a.children;
    var _b = (0, react_1.useState)(true), sidebarOpen = _b[0], setSidebarOpen = _b[1];
    var _c = (0, react_1.useState)(defaultTheme), theme = _c[0], setThemeState = _c[1];
    var _d = (0, react_1.useState)([]), notifications = _d[0], setNotifications = _d[1];
    var setTheme = (0, react_1.useCallback)(function (newTheme) {
        setThemeState(function (prev) { return (__assign(__assign({}, prev), newTheme)); });
    }, []);
    var markNotificationAsRead = (0, react_1.useCallback)(function (id) {
        setNotifications(function (prev) {
            return prev.map(function (notification) {
                return notification.id === id
                    ? __assign(__assign({}, notification), { read: true }) : notification;
            });
        });
    }, []);
    var clearNotifications = (0, react_1.useCallback)(function () {
        setNotifications([]);
    }, []);
    var value = {
        sidebarOpen: sidebarOpen,
        setSidebarOpen: setSidebarOpen,
        theme: theme,
        setTheme: setTheme,
        notifications: notifications,
        markNotificationAsRead: markNotificationAsRead,
        clearNotifications: clearNotifications,
    };
    return value = { value } >
        { children }
        < /LayoutContext.Provider>;
    ;
};
exports.LayoutProvider = LayoutProvider;
var useLayout = function () {
    var context = (0, react_1.useContext)(LayoutContext);
    if (context === undefined) {
        throw new Error('useLayout must be used within a LayoutProvider');
    }
    return context;
};
exports.useLayout = useLayout;
//# sourceMappingURL=LayoutContext.js.map