"use strict";
'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookManager = WebhookManager;
import react_1 from 'react';
import card_1 from '@/components/ui/card';
import button_1 from '@/components/ui/button';
import input_1 from '@/components/ui/input';
import label_1 from '@/components/ui/label';
import websocket_1 from '../services/websocket';
function WebhookManager() {
    var _a = (0, react_1.useState)(''), webhookUrl = _a[0], setWebhookUrl = _a[1];
    var handleAddWebhook = function () {
        if (webhookUrl) {
            websocket_1.webSocketService.send('addWebhook', { url: webhookUrl });
            setWebhookUrl('');
        }
    };
    return (_jsxs(card_1.Card, { className: "w-full max-w-md", children: [_jsx(card_1.CardHeader, { children: _jsx(card_1.CardTitle, { children: "Webhook Manager" }) }), _jsx(card_1.CardContent, { children: _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(label_1.Label, { htmlFor: "webhookUrl", children: "Webhook URL" }), _jsx(input_1.Input, { id: "webhookUrl", value: webhookUrl, onChange: function (e) { return setWebhookUrl(e.target.value); }, placeholder: "https://example.com/webhook" })] }), _jsx(button_1.Button, { onClick: handleAddWebhook, className: "w-full", children: "Add Webhook" })] }) })] }));
}
