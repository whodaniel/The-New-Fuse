"use strict";
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
import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatRoom = ChatRoom;
import react_1 from 'react';
import card_1 from '@/components/ui/card';
import button_1 from '@/components/ui/button';
import input_1 from '@/components/ui/input';
import scroll_area_1 from '@/components/ui/scroll-area';
import avatar_1 from '@/components/ui/avatar';
import websocket_1 from '../services/websocket';
function ChatRoom(_a) {
    var roomId = _a.roomId, agents = _a.agents;
    var _b = (0, react_1.useState)([]), messages = _b[0], setMessages = _b[1];
    var _c = (0, react_1.useState)(''), input = _c[0], setInput = _c[1];
    (0, react_1.useEffect)(function () {
        websocket_1.webSocketService.on("chatRoom:".concat(roomId), function (data) {
            setMessages(function (prev) { return __spreadArray(__spreadArray([], prev, true), [data], false); });
        });
        return function () {
            websocket_1.webSocketService.off("chatRoom:".concat(roomId), function () { });
        };
    }, [roomId]);
    var handleSend = function () {
        if (input.trim()) {
            websocket_1.webSocketService.send('chatMessage', { roomId: roomId, message: input });
            setInput('');
        }
    };
    return (_jsxs(card_1.Card, { className: "w-full max-w-2xl h-[600px] flex flex-col", children: [_jsx(card_1.CardHeader, { children: _jsxs(card_1.CardTitle, { children: ["Chat Room: ", roomId] }) }), _jsxs(card_1.CardContent, { className: "flex-grow flex flex-col", children: [_jsx(scroll_area_1.ScrollArea, { className: "flex-grow mb-4", children: messages.map(function (msg, index) { return (_jsxs("div", { className: "flex items-start space-x-2 mb-4", children: [_jsxs(avatar_1.Avatar, { children: [_jsx(avatar_1.AvatarImage, { src: msg.agent.avatar, alt: msg.agent.name }), _jsx(avatar_1.AvatarFallback, { children: msg.agent.name[0] })] }), _jsxs("div", { children: [_jsx("p", { className: "font-semibold", children: msg.agent.name }), _jsx("p", { children: msg.content })] })] }, index)); }) }), _jsxs("div", { className: "flex space-x-2", children: [_jsx(input_1.Input, { value: input, onChange: function (e) { return setInput(e.target.value); }, placeholder: "Type a message...", onKeyPress: function (e) { return e.key === 'Enter' && handleSend(); } }), _jsx(button_1.Button, { onClick: handleSend, children: "Send" })] })] })] }));
}
