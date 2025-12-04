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
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import AgentMessage from './agent-message';
import { webSocketService } from '../services/websocket';
export function TraeAugmentChatRoom() {
    var _a = useState([]), messages = _a[0], setMessages = _a[1];
    useEffect(function () {
        // Subscribe to Trae agent messages
        webSocketService.on('agent:trae', function (data) {
            var newMessage = {
                id: data.taskId || Date.now().toString(),
                type: data.type,
                content: data.message || JSON.stringify(data.details),
                timestamp: data.timestamp,
                metadata: data.metadata,
                agent: {
                    id: 'trae',
                    name: 'Trae',
                    avatar: '/trae-avatar.png'
                },
                taskId: data.taskId,
                status: data.status,
                details: data.details
            };
            setMessages(function (prev) { return __spreadArray(__spreadArray([], prev, true), [newMessage], false); });
        });
        // Subscribe to Augment agent messages
        webSocketService.on('agent:augment', function (data) {
            var newMessage = {
                id: data.taskId || Date.now().toString(),
                type: data.type,
                content: data.message || JSON.stringify(data.details),
                timestamp: data.timestamp,
                metadata: data.metadata,
                agent: {
                    id: 'augment',
                    name: 'Augment',
                    avatar: '/augment-avatar.png'
                },
                taskId: data.taskId,
                status: data.status,
                details: data.details
            };
            setMessages(function (prev) { return __spreadArray(__spreadArray([], prev, true), [newMessage], false); });
        });
        // Subscribe to broadcast messages
        webSocketService.on('agent:broadcast', function (data) {
            var newMessage = {
                id: data.taskId || Date.now().toString(),
                type: data.type,
                content: data.message || JSON.stringify(data.details),
                timestamp: data.timestamp,
                metadata: data.metadata,
                agent: {
                    id: data.metadata.source || 'system',
                    name: data.metadata.source || 'System',
                    avatar: "/avatars/".concat(data.metadata.source || 'system', ".png")
                },
                taskId: data.taskId,
                status: data.status,
                details: data.details
            };
            setMessages(function (prev) { return __spreadArray(__spreadArray([], prev, true), [newMessage], false); });
        });
        return function () {
            webSocketService.removeAllListeners('agent:trae');
            webSocketService.removeAllListeners('agent:augment');
            webSocketService.removeAllListeners('agent:broadcast');
        };
    }, []);
    return (_jsxs(Card, { className: "w-full max-w-4xl h-[600px] flex flex-col bg-white shadow-lg rounded-lg", children: [_jsx(CardHeader, { className: "border-b", children: _jsx(CardTitle, { className: "text-xl font-bold", children: "Trae-Augment Communication" }) }), _jsx(CardContent, { className: "flex-grow flex flex-col p-4 overflow-hidden", children: _jsx(ScrollArea, { className: "flex-grow pr-4", children: _jsx("div", { className: "space-y-4", children: messages.map(function (message) { return (_jsx(AgentMessage, { agent: message.agent, message: {
                                id: message.id,
                                content: message.content,
                                timestamp: message.timestamp,
                                type: 'text',
                                agent: message.agent,
                                metadata: __assign({ type: message.type, status: message.status, taskId: message.taskId }, message.metadata)
                            }, isCurrentUser: false }, message.id)); }) }) }) })] }));
}
