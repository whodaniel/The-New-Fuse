'use client';
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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';
var VirtualDevice = function (_a) {
    var app = _a.app, onClose = _a.onClose;
    return (_jsx(motion.div, { initial: { opacity: 0, scale: 0.9 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.9 }, className: "fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4", children: _jsxs("div", { className: "relative bg-white rounded-2xl shadow-2xl overflow-hidden max-w-2xl w-full max-h-[80vh]", children: [_jsxs("div", { className: "bg-gray-800 p-2 flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center space-x-1.5", children: [_jsx("div", { className: "w-3 h-3 rounded-full bg-red-500" }), _jsx("div", { className: "w-3 h-3 rounded-full bg-yellow-500" }), _jsx("div", { className: "w-3 h-3 rounded-full bg-green-500" })] }), _jsx("span", { className: "text-white text-sm font-semibold", children: app.name }), _jsx("button", { onClick: onClose, className: "text-white hover:text-gray-300", children: "Close" })] }), _jsxs("div", { className: "p-6 overflow-y-auto", children: [_jsx("h2", { className: "text-2xl font-bold mb-2", children: app.name }), _jsx("p", { className: "text-gray-600 mb-4", children: app.description }), _jsxs("div", { className: "space-y-4", children: [app.modules && (_jsxs("div", { children: [_jsx("h3", { className: "font-semibold", children: "Modules" }), _jsx("ul", { className: "list-disc list-inside", children: app.modules.map(function (mod) { return (_jsx("li", { children: mod }, mod)); }) })] })), app.mediaAssets && (_jsxs("div", { children: [_jsx("h3", { className: "font-semibold", children: "Media" }), _jsx("div", { className: "grid grid-cols-2 gap-4", children: app.mediaAssets.map(function (asset) { return (_jsx("img", { src: asset, alt: "Media asset", className: "rounded-lg" }, asset)); }) })] })), app.socialLinks && (_jsxs("div", { children: [_jsx("h3", { className: "font-semibold", children: "Social Links" }), _jsx("ul", { children: app.socialLinks.map(function (link) { return (_jsx("li", { children: _jsx("a", { href: link.url, target: "_blank", rel: "noopener noreferrer", className: "text-blue-500 hover:underline", children: link.name }) }, link.name)); }) })] }))] })] })] }) }));
};
var DraggableApp = function (_a) {
    var app = _a.app, index = _a.index, isExpanded = _a.isExpanded, toggleExpand = _a.toggleExpand, openVirtualDevice = _a.openVirtualDevice, droppableId = _a.droppableId;
    return (_jsx(Draggable, { draggableId: "".concat(droppableId, "-").concat(app.id), index: index, children: function (provided) { return (_jsx("div", __assign({ ref: provided.innerRef }, provided.draggableProps, provided.dragHandleProps, { className: "mb-4", children: _jsxs(Card, { className: "hover:shadow-lg transition-shadow", children: [_jsxs(CardHeader, { children: [_jsxs(CardTitle, { className: "flex justify-between items-center", children: [app.name, _jsx(Button, { variant: "ghost", size: "sm", onClick: function () { return toggleExpand(app.id); }, children: isExpanded ? _jsx(ChevronUp, {}) : _jsx(ChevronDown, {}) })] }), _jsx(CardDescription, { children: app.creator })] }), _jsx(AnimatePresence, { children: isExpanded && (_jsx(motion.div, { initial: { height: 0, opacity: 0 }, animate: { height: 'auto', opacity: 1 }, exit: { height: 0, opacity: 0 }, children: _jsxs(CardContent, { children: [_jsx("p", { children: app.description }), _jsx(Button, { className: "mt-4", onClick: function () { return openVirtualDevice(app); }, children: "Open in Virtual Device" })] }) })) })] }) }))); } }));
};
export function AppStacker() {
    var _a = useState([
        {
            id: 1,
            name: 'Cool Chat App',
            description: 'A real-time chat application with modern features',
            creator: 'Alice',
            color: '#ff0000',
            modules: ['Chat', 'Authentication', 'File Sharing'],
            mediaAssets: ['/chat-preview.jpg', '/chat-mobile.jpg'],
            socialLinks: [
                { name: 'GitHub', url: 'https://github.com' },
                { name: 'Demo', url: 'https://demo.app' },
            ],
        },
        {
            id: 2,
            name: 'Awesome Todo List',
            description: 'Stay organized with this beautiful todo app',
            creator: 'Bob',
            color: '#00ff00',
            modules: ['Tasks', 'Categories', 'Reminders'],
        },
        {
            id: 3,
            name: 'Super Calculator',
            description: 'Advanced calculator with scientific functions',
            creator: 'Charlie',
            color: '#0000ff',
            modules: ['Basic Math', 'Scientific', 'Unit Conversion'],
        },
    ]), availableApps = _a[0], setAvailableApps = _a[1];
    var _b = useState([]), stackedApps = _b[0], setStackedApps = _b[1];
    var _c = useState(null), expandedAppId = _c[0], setExpandedAppId = _c[1];
    var _d = useState(null), virtualDeviceApp = _d[0], setVirtualDeviceApp = _d[1];
    var toggleExpand = function (appId) {
        setExpandedAppId(expandedAppId === appId ? null : appId);
    };
    var openVirtualDevice = function (app) {
        setVirtualDeviceApp(app);
    };
    var closeVirtualDevice = function () {
        setVirtualDeviceApp(null);
    };
    var onDragEnd = function (result) {
        if (!result.destination)
            return;
        var sourceList = result.source.droppableId === 'available' ? availableApps : stackedApps;
        var destList = result.destination.droppableId === 'available' ? availableApps : stackedApps;
        var removed = sourceList.splice(result.source.index, 1)[0];
        destList.splice(result.destination.index, 0, removed);
        setAvailableApps(__spreadArray([], availableApps, true));
        setStackedApps(__spreadArray([], stackedApps, true));
    };
    return (_jsxs("div", { className: "container mx-auto p-4", children: [_jsx(DragDropContext, { onDragEnd: onDragEnd, children: _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-8", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-2xl font-bold mb-4", children: "Available Apps" }), _jsx(Droppable, { droppableId: "available", children: function (provided) { return (_jsxs("div", __assign({ ref: provided.innerRef }, provided.droppableProps, { children: [availableApps.map(function (app, index) { return (_jsx(DraggableApp, { app: app, index: index, isExpanded: expandedAppId === app.id, toggleExpand: toggleExpand, openVirtualDevice: openVirtualDevice, droppableId: "available" }, app.id)); }), provided.placeholder] }))); } })] }), _jsxs("div", { children: [_jsx("h2", { className: "text-2xl font-bold mb-4", children: "Stacked Apps" }), _jsx(Droppable, { droppableId: "stacked", children: function (provided) { return (_jsxs("div", __assign({ ref: provided.innerRef }, provided.droppableProps, { children: [stackedApps.map(function (app, index) { return (_jsx(DraggableApp, { app: app, index: index, isExpanded: expandedAppId === app.id, toggleExpand: toggleExpand, openVirtualDevice: openVirtualDevice, droppableId: "stacked" }, app.id)); }), provided.placeholder] }))); } })] })] }) }), _jsx(AnimatePresence, { children: virtualDeviceApp && (_jsx(VirtualDevice, { app: virtualDeviceApp, onClose: closeVirtualDevice })) })] }));
}
