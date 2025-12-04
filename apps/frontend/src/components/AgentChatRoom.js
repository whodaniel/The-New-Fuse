'use client';
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
export function AgentChatRoom(_a) {
    var _b = useState([]), messages = _b[0], setMessages = _b[1];
    var currentAgent = useState({
        id: 'composer',
        name: 'Composer',
        avatar: '/composer-avatar.png'
    })[0];
    useEffect(function () {
        // Subscribe to Redis channel messages
        webSocketService.on("agent:broadcast", function (data) {
            var newMessage = {
                id: data.id || Date.now().toString(),
                content: data.message,
                timestamp: data.timestamp || new Date().toISOString(),
                type: data.type || 'text',
                agent: {
                    id: data.senderId,
                    name: data.senderName || 'Unknown Agent',
                    avatar: data.senderAvatar
                },
                metadata: data.metadata
            };
            setMessages(function (prev) { return __spreadArray(__spreadArray([], prev, true), [newMessage], false); });
        });
        // Subscribe to direct messages
        webSocketService.on("agent:direct:".concat(currentAgent.id), function (data) {
            var newMessage = {
                id: data.id || Date.now().toString(),
                content: data.message,
                timestamp: data.timestamp || new Date().toISOString(),
                type: data.type || 'text',
                agent: {
                    id: data.senderId,
                    name: data.senderName || 'Unknown Agent',
                    avatar: data.senderAvatar
                },
                metadata: data.metadata
            };
            setMessages(function (prev) { return __spreadArray(__spreadArray([], prev, true), [newMessage], false); });
        });
        return function () {
            webSocketService.removeAllListeners("agent:broadcast");
            webSocketService.removeAllListeners("agent:direct:".concat(currentAgent.id));
        };
    }, [currentAgent.id]);
    return (_jsxs(Card, { className: "w-full max-w-4xl h-[600px] flex flex-col bg-white shadow-lg rounded-lg", children: [_jsx(CardHeader, { className: "border-b", children: _jsx(CardTitle, { className: "text-xl font-bold", children: "Agent Communication Room" }) }), _jsx(CardContent, { className: "flex-grow flex flex-col p-4 overflow-hidden", children: _jsx(ScrollArea, { className: "flex-grow pr-4", children: _jsx("div", { className: "space-y-4", children: messages.map(function (message) { return (_jsx(AgentMessage, { agent: message.agent, message: message, isCurrentUser: message.agent.id === currentAgent.id }, message.id)); }) }) }) })] }));
}
