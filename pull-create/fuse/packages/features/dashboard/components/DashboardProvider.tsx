import React from "react";
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardProvider = DashboardProvider;
exports.useDashboardContext = useDashboardContext;
var react_1 = require("react");
var useDashboard_1 = require("../hooks/useDashboard");
var DashboardContext = (0, react_1.createContext)(null);
function DashboardProvider(): JSX.Element _a) {
    var children = _a.children;
    var dashboard = (0, useDashboard_1.useDashboard)();
    return (<DashboardContext.Provider value={dashboard}>
      {children}
    </DashboardContext.Provider>);
}
function useDashboardContext(): JSX.Element ) {
    var context = (0, react_1.useContext)(DashboardContext);
    if (!context) {
        throw new Error('useDashboardContext must be used within a DashboardProvider');
    }
    return context;
}
export {};
