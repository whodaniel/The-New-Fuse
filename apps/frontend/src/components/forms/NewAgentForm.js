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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage, } from "@/components/ui/form";
import { z } from "zod";
import { AgentType, ReasoningStrategy } from '@/types/api';
import { LLMSelector } from '@/components/LLMSelection/LLMSelector';
// Extend the agent form schema to include LLM provider
export var agentFormSchema = z.object({
    name: z.string().min(2, {
        message: "Name must be at least 2 characters.",
    }),
    type: z.nativeEnum(AgentType, {
        required_error: "Please select an agent type.",
    }),
    description: z.string().min(10, {
        message: "Description must be at least 10 characters.",
    }),
    llmProviderId: z.string().optional(), // New field for LLM provider
    capabilities: z.object({
        code_generation: z.boolean().optional(),
        code_review: z.boolean().optional(),
        code_optimization: z.boolean().optional(),
        architecture_review: z.boolean().optional(),
        dependency_analysis: z.boolean().optional(),
        security_audit: z.boolean().optional(),
        documentation: z.boolean().optional(),
        test_generation: z.boolean().optional(),
        bug_analysis: z.boolean().optional(),
        performance_analysis: z.boolean().optional(),
        data_analysis: z.boolean().optional(),
        natural_language_processing: z.boolean().optional(),
        virtual_browser: z.boolean().optional(),
        web_automation: z.boolean().optional(),
        project_analysis: z.boolean().optional(),
        knowledge_graph: z.boolean().optional(),
        taxonomy_system: z.boolean().optional(),
        learning_system: z.boolean().optional(),
        agent_collaboration: z.boolean().optional(),
        communication_bus: z.boolean().optional(),
        protocol_handler: z.boolean().optional(),
    }).optional(),
    metadata: z.object({
        personalityTraits: z.array(z.string()).optional(),
        communicationStyle: z.string().optional(),
        expertiseAreas: z.array(z.string()).optional(),
        reasoningStrategies: z.array(z.nativeEnum(ReasoningStrategy)).optional(),
        skillDevelopment: z.object({
            currentLevel: z.number().min(0).max(10).optional(),
            targetLevel: z.number().min(0).max(10).optional(),
            learningPath: z.array(z.string()).optional(),
        }).optional(),
    }).optional(),
    config: z.record(z.any()).optional(),
});
export var NewAgentForm = function (_b) {
    var _c;
    var form = _b.form, onSubmit = _b.onSubmit;
    return (_jsx(Form, __assign({}, form, { children: _jsxs("form", { onSubmit: form.handleSubmit(onSubmit), className: "space-y-8", children: [_jsx(FormField, { control: form.control, name: "name", render: function (_b) {
                        var field = _b.field;
                        return (_jsxs(FormItem, { children: [_jsx(FormLabel, { className: "text-foreground", children: "Name" }), _jsx(FormControl, { children: _jsx(Input, __assign({ placeholder: "e.g. Data Analysis Assistant" }, field)) }), _jsx(FormDescription, { children: "A unique name for your agent" }), _jsx(FormMessage, {})] }));
                    } }), _jsx(FormField, { control: form.control, name: "description", render: function (_b) {
                        var field = _b.field;
                        return (_jsxs(FormItem, { children: [_jsx(FormLabel, { className: "text-foreground", children: "Description" }), _jsx(FormControl, { children: _jsx(Textarea, __assign({ placeholder: "Describe what this agent does...", className: "resize-none" }, field)) }), _jsx(FormDescription, { children: "A detailed description of the agent's purpose and capabilities" }), _jsx(FormMessage, {})] }));
                    } }), _jsx(FormField, { control: form.control, name: "type", render: function (_b) {
                        var field = _b.field;
                        return (_jsxs(FormItem, { children: [_jsx(FormLabel, { className: "text-foreground", children: "Type" }), _jsxs(Select, { onValueChange: field.onChange, defaultValue: field.value, children: [_jsx(FormControl, { children: _jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Select agent type" }) }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: AgentType.BASE, children: "Base" }), _jsx(SelectItem, { value: AgentType.ENHANCED, children: "Enhanced" }), _jsx(SelectItem, { value: AgentType.RESEARCH, children: "Research" }), _jsx(SelectItem, { value: AgentType.CASCADE, children: "Cascade" }), _jsx(SelectItem, { value: AgentType.WORKFLOW, children: "Workflow" }), _jsx(SelectItem, { value: AgentType.MARKETING, children: "Marketing" }), _jsx(SelectItem, { value: AgentType.TECHNICAL_SUPPORT, children: "Technical Support" }), _jsx(SelectItem, { value: AgentType.CUSTOMER_SUPPORT, children: "Customer Support" })] })] }), _jsx(FormDescription, { children: "The type of agent determines its base capabilities and behavior" }), _jsx(FormMessage, {})] }));
                    } }), _jsx(FormField, { control: form.control, name: "llmProviderId", render: function (_b) {
                        var field = _b.field;
                        return (_jsxs(FormItem, { children: [_jsx(FormLabel, { className: "text-foreground", children: "LLM Provider" }), _jsx(FormControl, { children: _jsx(LLMSelector, { selectedProviderId: field.value, onChange: field.onChange, description: "Select the LLM provider to power this agent" }) }), _jsx(FormMessage, {})] }));
                    } }), _jsxs("div", { className: "space-y-6", children: [_jsx("h3", { className: "text-lg font-semibold", children: "Core Capabilities" }), _jsx("div", { className: "grid grid-cols-2 gap-4", children: Object.entries({
                                code_generation: "Code Generation",
                                code_review: "Code Review",
                                code_optimization: "Code Optimization",
                                architecture_review: "Architecture Review",
                                dependency_analysis: "Dependency Analysis",
                                security_audit: "Security Audit",
                                documentation: "Documentation",
                                test_generation: "Test Generation",
                                bug_analysis: "Bug Analysis",
                                performance_analysis: "Performance Analysis",
                                data_analysis: "Data Analysis",
                                natural_language_processing: "Natural Language Processing",
                            }).map(function (_b) {
                                var key = _b[0], label = _b[1];
                                return (_jsx(FormField, { control: form.control, name: "capabilities.".concat(key), render: function (_b) {
                                        var field = _b.field;
                                        return (_jsxs(FormItem, { className: "flex flex-row items-center space-x-3 space-y-0", children: [_jsx(FormControl, { children: _jsx(Checkbox, { checked: field.value, onCheckedChange: field.onChange }) }), _jsx(FormLabel, { className: "text-sm font-normal", children: label })] }));
                                    } }, key));
                            }) })] }), _jsxs("div", { className: "space-y-6", children: [_jsx("h3", { className: "text-lg font-semibold", children: "Advanced Capabilities" }), _jsx("div", { className: "grid grid-cols-2 gap-4", children: Object.entries({
                                virtual_browser: "Virtual Browser",
                                web_automation: "Web Automation",
                                project_analysis: "Project Analysis",
                                knowledge_graph: "Knowledge Graph",
                                taxonomy_system: "Taxonomy System",
                                learning_system: "Learning System",
                                agent_collaboration: "Agent Collaboration",
                                communication_bus: "Communication Bus",
                                protocol_handler: "Protocol Handler",
                            }).map(function (_b) {
                                var key = _b[0], label = _b[1];
                                return (_jsx(FormField, { control: form.control, name: "capabilities.".concat(key), render: function (_b) {
                                        var field = _b.field;
                                        return (_jsxs(FormItem, { className: "flex flex-row items-center space-x-3 space-y-0", children: [_jsx(FormControl, { children: _jsx(Checkbox, { checked: field.value, onCheckedChange: field.onChange }) }), _jsx(FormLabel, { className: "text-sm font-normal", children: label })] }));
                                    } }, key));
                            }) })] }), _jsxs("div", { className: "space-y-6", children: [_jsx("h3", { className: "text-lg font-semibold", children: "Reasoning Strategies" }), _jsx("div", { className: "grid grid-cols-2 gap-4", children: Object.entries((_c = {},
                                _c[ReasoningStrategy.DEDUCTIVE] = "Deductive Reasoning",
                                _c[ReasoningStrategy.INDUCTIVE] = "Inductive Reasoning",
                                _c[ReasoningStrategy.ABDUCTIVE] = "Abductive Reasoning",
                                _c[ReasoningStrategy.ANALOGICAL] = "Analogical Reasoning",
                                _c)).map(function (_b) {
                                var key = _b[0], label = _b[1];
                                return (_jsx(FormField, { control: form.control, name: "metadata.reasoningStrategies", render: function (_b) {
                                        var field = _b.field;
                                        var _a;
                                        return (_jsxs(FormItem, { className: "flex flex-row items-center space-x-3 space-y-0", children: [_jsx(FormControl, { children: _jsx(Checkbox, { checked: (_a = field.value) === null || _a === void 0 ? void 0 : _a.includes(key), onCheckedChange: function (checked) {
                                                            var current = field.value || [];
                                                            field.onChange(checked
                                                                ? __spreadArray(__spreadArray([], current, true), [key], false) : current.filter(function (value) { return value !== key; }));
                                                        } }) }), _jsx(FormLabel, { className: "text-sm font-normal", children: label })] }));
                                    } }, key));
                            }) })] }), _jsxs("div", { className: "space-y-6", children: [_jsx("h3", { className: "text-lg font-semibold", children: "Skill Development" }), _jsxs("div", { className: "space-y-4", children: [_jsx(FormField, { control: form.control, name: "metadata.skillDevelopment.currentLevel", render: function (_b) {
                                        var field = _b.field;
                                        return (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Current Skill Level (0-10)" }), _jsx(FormControl, { children: _jsx(Input, __assign({ type: "number", min: 0, max: 10 }, field, { onChange: function (e) { return field.onChange(parseInt(e.target.value)); } })) })] }));
                                    } }), _jsx(FormField, { control: form.control, name: "metadata.skillDevelopment.targetLevel", render: function (_b) {
                                        var field = _b.field;
                                        return (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Target Skill Level (0-10)" }), _jsx(FormControl, { children: _jsx(Input, __assign({ type: "number", min: 0, max: 10 }, field, { onChange: function (e) { return field.onChange(parseInt(e.target.value)); } })) })] }));
                                    } })] })] }), _jsx(FormField, { control: form.control, name: "metadata.communicationStyle", render: function (_b) {
                        var field = _b.field;
                        return (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Communication Style" }), _jsxs(Select, { onValueChange: field.onChange, defaultValue: field.value, children: [_jsx(FormControl, { children: _jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Select communication style" }) }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "formal", children: "Formal" }), _jsx(SelectItem, { value: "casual", children: "Casual" }), _jsx(SelectItem, { value: "technical", children: "Technical" }), _jsx(SelectItem, { value: "friendly", children: "Friendly" }), _jsx(SelectItem, { value: "professional", children: "Professional" })] })] })] }));
                    } }), _jsx(Button, { type: "submit", children: "Create Agent" })] }) })));
};
