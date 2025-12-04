"use strict";
'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateAgent = CreateAgent;
import react_1 from 'react';
import button_1 from '@/components/ui/button';
import input_1 from '@/components/ui/input';
import label_1 from '@/components/ui/label';
import select_1 from '@/components/ui/select';
import card_1 from '@/components/ui/card';
function CreateAgent() {
    var _a = (0, react_1.useState)(''), name = _a[0], setName = _a[1];
    var _b = (0, react_1.useState)(''), type = _b[0], setType = _b[1];
    var handleSubmit = function (e) {
        e.preventDefault();
        setName('');
        setType('');
    };
    return (_jsxs(card_1.Card, { className: "w-full max-w-md", children: [_jsx(card_1.CardHeader, { children: _jsx(card_1.CardTitle, { children: "Create New Agent" }) }), _jsxs("form", { onSubmit: handleSubmit, children: [_jsxs(card_1.CardContent, { className: "space-y-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(label_1.Label, { htmlFor: "name", children: "Agent Name" }), _jsx(input_1.Input, { id: "name", value: name, onChange: function (e) { return setName(e.target.value); }, required: true })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(label_1.Label, { htmlFor: "type", children: "Agent Type" }), _jsxs(select_1.Select, { value: type, onValueChange: setType, required: true, children: [_jsx(select_1.SelectTrigger, { children: _jsx(select_1.SelectValue, { placeholder: "Select agent type" }) }), _jsxs(select_1.SelectContent, { children: [_jsx(select_1.SelectItem, { value: "processor", children: "Processor" }), _jsx(select_1.SelectItem, { value: "analyzer", children: "Analyzer" }), _jsx(select_1.SelectItem, { value: "communicator", children: "Communicator" })] })] })] })] }), _jsx(card_1.CardFooter, { children: _jsx(button_1.Button, { type: "submit", className: "w-full", children: "Create Agent" }) })] })] }));
}
