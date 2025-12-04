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
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bot, Code, Sliders, Shield, Save, X, ChevronLeft } from 'lucide-react';
/**
 * New Agent page component
 */
var NewAgent = function () {
    var navigate = useNavigate();
    var _a = useState('basic'), activeTab = _a[0], setActiveTab = _a[1];
    // Form state
    var _b = useState({
        name: '',
        description: '',
        type: 'development',
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 4096,
        capabilities: {
            codeGeneration: true,
            codeReview: true,
            bugFixing: true,
            documentation: true,
            refactoring: false
        },
        permissions: {
            readFiles: true,
            writeFiles: true,
            executeCommands: false,
            networkAccess: true,
            databaseAccess: false
        }
    }), formData = _b[0], setFormData = _b[1];
    // Handle input change
    var handleInputChange = function (e) {
        var _a = e.target, name = _a.name, value = _a.value;
        setFormData(function (prev) {
            var _a;
            return (__assign(__assign({}, prev), (_a = {}, _a[name] = value, _a)));
        });
    };
    // Handle checkbox change
    var handleCheckboxChange = function (category, name, checked) {
        setFormData(function (prev) {
            var _a, _b;
            return (__assign(__assign({}, prev), (_a = {}, _a[category] = __assign(__assign({}, prev[category]), (_b = {}, _b[name] = checked, _b)), _a)));
        });
    };
    // Handle form submission
    var handleSubmit = function (e) {
        e.preventDefault();
        console.log('Form submitted:', formData);
        // In a real app, we would send this data to the server
        // For now, just navigate back to the agents list
        navigate('/agents');
    };
    return (_jsxs("div", { className: "flex h-screen bg-background", children: [_jsx(Sidebar, {}), _jsx("main", { className: "flex-1 p-6 overflow-auto", children: _jsxs("div", { className: "max-w-4xl mx-auto", children: [_jsxs("div", { className: "flex items-center mb-6", children: [_jsxs(Button, { variant: "ghost", size: "sm", onClick: function () { return navigate('/agents'); }, className: "mr-4", children: [_jsx(ChevronLeft, { className: "h-4 w-4 mr-1" }), "Back"] }), _jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold", children: "Create New Agent" }), _jsx("p", { className: "text-muted-foreground", children: "Configure and deploy a new AI agent" })] })] }), _jsxs("form", { onSubmit: handleSubmit, children: [_jsxs(Tabs, { value: activeTab, onValueChange: setActiveTab, className: "mb-6", children: [_jsxs(TabsList, { className: "mb-4", children: [_jsxs(TabsTrigger, { value: "basic", children: [_jsx(Bot, { className: "h-4 w-4 mr-2" }), "Basic Information"] }), _jsxs(TabsTrigger, { value: "capabilities", children: [_jsx(Code, { className: "h-4 w-4 mr-2" }), "Capabilities"] }), _jsxs(TabsTrigger, { value: "configuration", children: [_jsx(Sliders, { className: "h-4 w-4 mr-2" }), "Configuration"] }), _jsxs(TabsTrigger, { value: "permissions", children: [_jsx(Shield, { className: "h-4 w-4 mr-2" }), "Permissions"] })] }), _jsx(TabsContent, { value: "basic", className: "space-y-6", children: _jsx(Card, { children: _jsxs("div", { className: "p-6", children: [_jsx("h3", { className: "text-lg font-semibold mb-4", children: "Basic Information" }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx(Label, { htmlFor: "name", children: "Agent Name" }), _jsx(Input, { id: "name", name: "name", value: formData.name, onChange: handleInputChange, placeholder: "e.g., CodeAssistant", required: true })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "description", children: "Description" }), _jsx(Textarea, { id: "description", name: "description", value: formData.description, onChange: handleInputChange, placeholder: "Describe what this agent does...", rows: 4, required: true })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "type", children: "Agent Type" }), _jsxs(Select, { id: "type", name: "type", value: formData.type, onChange: handleInputChange, required: true, children: [_jsx("option", { value: "development", children: "Development" }), _jsx("option", { value: "analytics", children: "Analytics" }), _jsx("option", { value: "content", children: "Content" }), _jsx("option", { value: "qa", children: "QA" }), _jsx("option", { value: "integration", children: "Integration" }), _jsx("option", { value: "custom", children: "Custom" })] })] })] })] }) }) }), _jsx(TabsContent, { value: "capabilities", className: "space-y-6", children: _jsx(Card, { children: _jsxs("div", { className: "p-6", children: [_jsx("h3", { className: "text-lg font-semibold mb-4", children: "Agent Capabilities" }), _jsx("p", { className: "text-muted-foreground mb-4", children: "Select the capabilities this agent should have. These determine what tasks the agent can perform." }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(Checkbox, { id: "codeGeneration", checked: formData.capabilities.codeGeneration, onCheckedChange: function (checked) {
                                                                                return handleCheckboxChange('capabilities', 'codeGeneration', checked);
                                                                            } }), _jsx(Label, { htmlFor: "codeGeneration", children: "Code Generation" })] }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(Checkbox, { id: "codeReview", checked: formData.capabilities.codeReview, onCheckedChange: function (checked) {
                                                                                return handleCheckboxChange('capabilities', 'codeReview', checked);
                                                                            } }), _jsx(Label, { htmlFor: "codeReview", children: "Code Review" })] }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(Checkbox, { id: "bugFixing", checked: formData.capabilities.bugFixing, onCheckedChange: function (checked) {
                                                                                return handleCheckboxChange('capabilities', 'bugFixing', checked);
                                                                            } }), _jsx(Label, { htmlFor: "bugFixing", children: "Bug Fixing" })] }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(Checkbox, { id: "documentation", checked: formData.capabilities.documentation, onCheckedChange: function (checked) {
                                                                                return handleCheckboxChange('capabilities', 'documentation', checked);
                                                                            } }), _jsx(Label, { htmlFor: "documentation", children: "Documentation" })] }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(Checkbox, { id: "refactoring", checked: formData.capabilities.refactoring, onCheckedChange: function (checked) {
                                                                                return handleCheckboxChange('capabilities', 'refactoring', checked);
                                                                            } }), _jsx(Label, { htmlFor: "refactoring", children: "Refactoring" })] })] })] }) }) }), _jsx(TabsContent, { value: "configuration", className: "space-y-6", children: _jsx(Card, { children: _jsxs("div", { className: "p-6", children: [_jsx("h3", { className: "text-lg font-semibold mb-4", children: "Model Configuration" }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx(Label, { htmlFor: "model", children: "AI Model" }), _jsxs(Select, { id: "model", name: "model", value: formData.model, onChange: handleInputChange, required: true, children: [_jsx("option", { value: "gpt-4", children: "GPT-4" }), _jsx("option", { value: "gpt-3.5-turbo", children: "GPT-3.5 Turbo" }), _jsx("option", { value: "claude-2", children: "Claude 2" }), _jsx("option", { value: "claude-instant", children: "Claude Instant" }), _jsx("option", { value: "llama-2", children: "Llama 2" }), _jsx("option", { value: "custom", children: "Custom Model" })] })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "temperature", children: "Temperature" }), _jsxs("div", { className: "flex items-center", children: [_jsx(Input, { id: "temperature", name: "temperature", type: "range", min: "0", max: "1", step: "0.1", value: formData.temperature, onChange: handleInputChange, className: "w-full mr-2" }), _jsx("span", { className: "w-12 text-center", children: formData.temperature })] }), _jsx("p", { className: "text-xs text-muted-foreground mt-1", children: "Controls randomness: Lower values are more deterministic, higher values are more creative." })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "maxTokens", children: "Max Tokens" }), _jsx(Input, { id: "maxTokens", name: "maxTokens", type: "number", min: "1", max: "8192", value: formData.maxTokens, onChange: handleInputChange, required: true }), _jsx("p", { className: "text-xs text-muted-foreground mt-1", children: "Maximum number of tokens the model can generate in a single response." })] })] })] }) }) }), _jsx(TabsContent, { value: "permissions", className: "space-y-6", children: _jsx(Card, { children: _jsxs("div", { className: "p-6", children: [_jsx("h3", { className: "text-lg font-semibold mb-4", children: "Agent Permissions" }), _jsx("p", { className: "text-muted-foreground mb-4", children: "Configure what resources and actions this agent has access to. Be careful with permissions that allow the agent to modify files or execute commands." }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(Checkbox, { id: "readFiles", checked: formData.permissions.readFiles, onCheckedChange: function (checked) {
                                                                                return handleCheckboxChange('permissions', 'readFiles', checked);
                                                                            } }), _jsx(Label, { htmlFor: "readFiles", children: "Read Files" })] }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(Checkbox, { id: "writeFiles", checked: formData.permissions.writeFiles, onCheckedChange: function (checked) {
                                                                                return handleCheckboxChange('permissions', 'writeFiles', checked);
                                                                            } }), _jsx(Label, { htmlFor: "writeFiles", children: "Write Files" })] }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(Checkbox, { id: "executeCommands", checked: formData.permissions.executeCommands, onCheckedChange: function (checked) {
                                                                                return handleCheckboxChange('permissions', 'executeCommands', checked);
                                                                            } }), _jsx(Label, { htmlFor: "executeCommands", children: "Execute Commands" })] }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(Checkbox, { id: "networkAccess", checked: formData.permissions.networkAccess, onCheckedChange: function (checked) {
                                                                                return handleCheckboxChange('permissions', 'networkAccess', checked);
                                                                            } }), _jsx(Label, { htmlFor: "networkAccess", children: "Network Access" })] }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(Checkbox, { id: "databaseAccess", checked: formData.permissions.databaseAccess, onCheckedChange: function (checked) {
                                                                                return handleCheckboxChange('permissions', 'databaseAccess', checked);
                                                                            } }), _jsx(Label, { htmlFor: "databaseAccess", children: "Database Access" })] })] })] }) }) })] }), _jsxs("div", { className: "flex justify-end space-x-2", children: [_jsxs(Button, { type: "button", variant: "outline", onClick: function () { return navigate('/agents'); }, children: [_jsx(X, { className: "h-4 w-4 mr-2" }), "Cancel"] }), _jsxs(Button, { type: "submit", children: [_jsx(Save, { className: "h-4 w-4 mr-2" }), "Create Agent"] })] })] })] }) })] }));
};
export default NewAgent;
