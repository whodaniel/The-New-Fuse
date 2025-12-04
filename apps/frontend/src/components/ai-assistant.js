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
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIAssistant = AIAssistant;
import react_1 from 'react';
import lucide_react_1 from 'lucide-react';
import button_1 from '@/components/ui/button';
import card_1 from '@/components/ui/card';
import input_1 from '@/components/ui/input';
import websocket_1 from '../services/websocket';
function AIAssistant() {
    var _a = (0, react_1.useState)(false), isOpen = _a[0], setIsOpen = _a[1];
    var _b = (0, react_1.useState)([]), messages = _b[0], setMessages = _b[1];
    var _c = (0, react_1.useState)(''), input = _c[0], setInput = _c[1];
    (0, react_1.useEffect)(function () {
        websocket_1.webSocketService.on('aiInsight', function (insight) {
            setMessages(function (prev) { return __spreadArray(__spreadArray([], prev, true), [{ type: 'ai', content: insight }], false); });
        });
        return function () {
            websocket_1.webSocketService.off('aiInsight', function () { });
        };
    }, []);
    var handleSendMessage = function () {
        if (input.trim()) {
            setMessages(function (prev) { return __spreadArray(__spreadArray([], prev, true), [{ type: 'user', content: input }], false); });
            websocket_1.webSocketService.send('userMessage', { message: input });
            setInput('');
        }
    };
    return (_jsxs("div", { className: "fixed bottom-4 right-4", children: [!isOpen && (_jsx(button_1.Button, { onClick: function () { return setIsOpen(true); }, className: "rounded-full h-16 w-16", children: _jsx(lucide_react_1.Bot, { className: "h-8 w-8" }) })), isOpen && (_jsxs(card_1.Card, { className: "w-80 h-96 flex flex-col", children: [_jsxs(card_1.CardHeader, { className: "flex flex-row items-center justify-between", children: [_jsx(card_1.CardTitle, { children: "AI Assistant" }), _jsx(button_1.Button, { variant: "ghost", size: "icon", onClick: function () { return setIsOpen(false); }, children: _jsx(lucide_react_1.X, { className: "h-4 w-4" }) })] }), _jsx(card_1.CardContent, { className: "flex-grow overflow-auto", children: _jsx("div", { className: "space-y-4", children: messages.map(function (msg, index) { return (_jsx("div", { className: "p-2 rounded-lg ".concat(msg.type === 'user' ? 'bg-blue-500 text-white self-end' : 'bg-gray-200 text-black self-start'), children: msg.content }, index)); }) }) }), _jsxs("div", { className: "p-4 border-t flex", children: [_jsx(input_1.Input, { value: input, onChange: function (e) { return setInput(e.target.value); }, onKeyPress: function (e) { return e.key === 'Enter' && handleSendMessage(); }, placeholder: "Ask me anything...", className: "flex-grow" }), _jsx(button_1.Button, { onClick: handleSendMessage, className: "ml-2", children: "Send" })] })] }))] }));
}
