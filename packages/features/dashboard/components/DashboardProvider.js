"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardProvider = DashboardProvider;
exports.useDashboardContext = useDashboardContext;
var react_1 = require("react");
var useDashboard_1 = require("../hooks/useDashboard");
var DashboardContext = (0, react_1.createContext)(null);
function DashboardProvider(_a) {
    var children = _a.children;
    var dashboard = (0, useDashboard_1.useDashboard)();
    return value = { dashboard } >
        { children }
        < /DashboardContext.Provider>;
    ;
}
function useDashboardContext() {
    var context = (0, react_1.useContext)(DashboardContext);
    if (!context) {
        throw new Error('useDashboardContext must be used within a DashboardProvider');
    }
    return context;
}
//# sourceMappingURL=DashboardProvider.js.map