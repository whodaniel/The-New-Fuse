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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
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
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
export default function NewAgentPage() {
    var _this = this;
    var navigate = useNavigate();
    var _a = useState({
        name: '',
        type: '',
        description: '',
        capabilities: [],
        instructions: '',
        model: 'gpt-4',
        temperature: 0.7
    }), formData = _a[0], setFormData = _a[1];
    var _b = useState(''), newCapability = _b[0], setNewCapability = _b[1];
    var _c = useState(false), isCreating = _c[0], setIsCreating = _c[1];
    var agentTypes = [
        'Analytics',
        'Support',
        'Development',
        'Marketing',
        'Sales',
        'Research',
        'Content Creation',
        'Data Processing',
        'Custom'
    ];
    var models = [
        'gpt-4',
        'gpt-3.5-turbo',
        'claude-3-opus',
        'claude-3-sonnet',
        'gemini-pro'
    ];
    var addCapability = function () {
        if (newCapability.trim() && !formData.capabilities.includes(newCapability.trim())) {
            setFormData(function (prev) { return (__assign(__assign({}, prev), { capabilities: __spreadArray(__spreadArray([], prev.capabilities, true), [newCapability.trim()], false) })); });
            setNewCapability('');
        }
    };
    var removeCapability = function (capability) {
        setFormData(function (prev) { return (__assign(__assign({}, prev), { capabilities: prev.capabilities.filter(function (c) { return c !== capability; }) })); });
    };
    var handleSubmit = function (e) { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            e.preventDefault();
            setIsCreating(true);
            // Simulate API call
            setTimeout(function () {
                // eslint-disable-next-line no-console
                console.log('Creating agent:', formData);
                setIsCreating(false);
                navigate('/agents');
            }, 2000);
            return [2 /*return*/];
        });
    }); };
    return (_jsx("div", { className: "min-h-screen bg-gray-50 p-6", children: _jsxs("div", { className: "max-w-4xl mx-auto", children: [_jsxs("div", { className: "mb-8", children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900", children: "\u2795 Create New Agent" }), _jsx("p", { className: "text-gray-600 mt-2", children: "Configure and deploy a new AI agent" })] }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-6", children: [_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "\uD83E\uDD16 Basic Information" }) }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx(Label, { htmlFor: "name", children: "Agent Name *" }), _jsx(Input, { id: "name", value: formData.name, onChange: function (e) { return setFormData(function (prev) { return (__assign(__assign({}, prev), { name: e.target.value })); }); }, placeholder: "e.g., Customer Support Agent", required: true })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "type", children: "Agent Type *" }), _jsxs(Select, { value: formData.type, onValueChange: function (value) { return setFormData(function (prev) { return (__assign(__assign({}, prev), { type: value })); }); }, children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Select agent type" }) }), _jsx(SelectContent, { children: agentTypes.map(function (type) { return (_jsx(SelectItem, { value: type, children: type }, type)); }) })] })] })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "description", children: "Description *" }), _jsx(Textarea, { id: "description", value: formData.description, onChange: function (e) { return setFormData(function (prev) { return (__assign(__assign({}, prev), { description: e.target.value })); }); }, placeholder: "Describe what this agent does and its purpose", rows: 3, required: true })] })] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "\u26A1 Capabilities" }) }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { className: "flex space-x-2", children: [_jsx(Input, { value: newCapability, onChange: function (e) { return setNewCapability(e.target.value); }, placeholder: "Add a capability", onKeyPress: function (e) { return e.key === 'Enter' && (e.preventDefault(), addCapability()); } }), _jsx(Button, { type: "button", onClick: addCapability, children: "Add" })] }), formData.capabilities.length > 0 && (_jsx("div", { className: "flex flex-wrap gap-2", children: formData.capabilities.map(function (capability, index) { return (_jsxs(Badge, { variant: "secondary", className: "cursor-pointer", onClick: function () { return removeCapability(capability); }, children: [capability, " \u2715"] }, index)); }) }))] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "\u2699\uFE0F Configuration" }) }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { children: [_jsx(Label, { htmlFor: "instructions", children: "System Instructions" }), _jsx(Textarea, { id: "instructions", value: formData.instructions, onChange: function (e) { return setFormData(function (prev) { return (__assign(__assign({}, prev), { instructions: e.target.value })); }); }, placeholder: "Provide detailed instructions for the agent's behavior and responses", rows: 5 })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx(Label, { htmlFor: "model", children: "Language Model" }), _jsxs(Select, { value: formData.model, onValueChange: function (value) { return setFormData(function (prev) { return (__assign(__assign({}, prev), { model: value })); }); }, children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }), _jsx(SelectContent, { children: models.map(function (model) { return (_jsx(SelectItem, { value: model, children: model }, model)); }) })] })] }), _jsxs("div", { children: [_jsxs(Label, { htmlFor: "temperature", children: ["Temperature: ", formData.temperature] }), _jsx("input", { id: "temperature", title: "Temperature", type: "range", min: "0", max: "1", step: "0.1", value: formData.temperature, onChange: function (e) { return setFormData(function (prev) { return (__assign(__assign({}, prev), { temperature: parseFloat(e.target.value) })); }); }, className: "w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" }), _jsxs("div", { className: "flex justify-between text-sm text-gray-500", children: [_jsx("span", { children: "Focused" }), _jsx("span", { children: "Creative" })] })] })] })] })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx(Button, { type: "button", variant: "outline", onClick: function () { return navigate('/agents'); }, children: "Cancel" }), _jsx(Button, { type: "submit", disabled: !formData.name || !formData.type || !formData.description || isCreating, className: "bg-blue-600 hover:bg-blue-700", children: isCreating ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" }), "Creating..."] })) : ('Create Agent') })] })] })] }) }));
}
