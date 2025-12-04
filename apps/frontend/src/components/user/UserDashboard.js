"use strict";
'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserDashboard = UserDashboard;
import react_1 from 'react';
import card_1 from '@/components/ui/card';
function UserDashboard() {
    var _a = (0, react_1.useState)(0), earnings = _a[0], setEarnings = _a[1];
    var mockApps = [
        { id: 1, name: 'Cool Chat App', downloads: 100, earnings: 50 },
        { id: 2, name: 'Awesome Todo List', downloads: 200, earnings: 100 },
    ];
    return (_jsxs("div", { className: "mt-8", children: [_jsx("h2", { className: "text-2xl font-bold mb-4", children: "Your Dashboard" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: [_jsxs(card_1.Card, { children: [_jsx(card_1.CardHeader, { children: _jsx(card_1.CardTitle, { children: "Total Earnings" }) }), _jsx(card_1.CardContent, { children: _jsxs("p", { className: "text-4xl font-bold", children: ["$", earnings] }) })] }), mockApps.map(function (app) { return (_jsxs(card_1.Card, { children: [_jsx(card_1.CardHeader, { children: _jsx(card_1.CardTitle, { children: app.name }) }), _jsxs(card_1.CardContent, { children: [_jsxs("p", { children: ["Downloads: ", app.downloads] }), _jsxs("p", { children: ["Earnings: $", app.earnings] })] })] }, app.id)); })] })] }));
}
