"use strict";
'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LLMSelector = LLMSelector;
import react_1 from 'react';
import select_1 from '@/components/ui/select';
import card_1 from '@/components/ui/card';
import button_1 from '@/components/ui/button';
import input_1 from '@/components/ui/input';
import websocket_1 from '../services/websocket';
var LLM_OPTIONS = [
    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
    { value: 'gpt-4', label: 'GPT-4' },
    { value: 'claude-v1', label: 'Claude v1' },
    { value: 'palm-2', label: 'PaLM 2' },
];
function LLMSelector(_a) {
    var agentId = _a.agentId;
    var _b = (0, react_1.useState)(''), selectedLLM = _b[0], setSelectedLLM = _b[1];
    var _c = (0, react_1.useState)(''), apiKey = _c[0], setApiKey = _c[1];
    var handleSave = function () {
        websocket_1.webSocketService.send('updateAgentLLM', { agentId: agentId, llm: selectedLLM, apiKey: apiKey });
    };
    return (_jsxs(card_1.Card, { className: "w-full max-w-md", children: [_jsx(card_1.CardHeader, { children: _jsx(card_1.CardTitle, { children: "Select LLM for Agent" }) }), _jsxs(card_1.CardContent, { className: "space-y-4", children: [_jsxs(select_1.Select, { value: selectedLLM, onValueChange: setSelectedLLM, children: [_jsx(select_1.SelectTrigger, { children: _jsx(select_1.SelectValue, { placeholder: "Select LLM" }) }), _jsx(select_1.SelectContent, { children: LLM_OPTIONS.map(function (option) { return (_jsx(select_1.SelectItem, { value: option.value, children: option.label }, option.value)); }) })] }), _jsx(input_1.Input, { type: "password", placeholder: "API Key", value: apiKey, onChange: function (e) { return setApiKey(e.target.value); } }), _jsx(button_1.Button, { onClick: handleSave, className: "w-full", children: "Save LLM Configuration" })] })] }));
}
