"use strict";
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
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
Object.defineProperty(exports, "__esModule", { value: true });
import React from 'react';
var AgentCreationForm = function () {
    var _a = React.useState({
        name: '',
        traits: [],
        abilities: [],
        tools: [],
        template_name: '',
        role: 'Generic',
        description: '',
        channel: '',
        personality: '',
        specialization: '',
        language_proficiency: { primary: 'English', secondary: '' },
        capabilities: [],
        learning_preferences: {
            autonomous_learning: true,
            feedback_integration: true,
            knowledge_sources: []
        },
        collaboration_settings: {
            team_integration: true,
            communication_protocols: ['http', 'websocket'],
            resource_sharing: true
        },
        learning_config: {
            learning_rate: 0.01,
            knowledge_sources: [],
            adaptation_threshold: 0.5,
            feedback_integration: true
        },
        collaboration_rules: {
            allowed_peers: [],
            resource_sharing: true,
            communication_protocols: ['http', 'websocket'],
            trust_levels: new Map()
        }
    }), formData = _a[0], setFormData = _a[1];
    var _b = React.useState(false), loading = _b[0], setLoading = _b[1];
    var _c = React.useState(null), error = _c[0], setError = _c[1];
    var _d = React.useState(false), success = _d[0], setSuccess = _d[1];
    var handleChange = function (e) {
        var _a = e.target, name = _a.name, value = _a.value;
        setError(null);
        setFormData(function (prevState) {
            var _a;
            return (Object.assign(Object.assign({}, prevState), (_a = {}, _a[name] = value, _a)));
        });
    };
    var handleArrayChange = function (e, field) {
        var value = e.target.value;
        var values = value.split(',').map(function (item) { return item.trim(); });
        setError(null);
        setFormData(function (prevState) {
            var _a;
            return (Object.assign(Object.assign({}, prevState), (_a = {}, _a[field] = values, _a)));
        });
    };
    var handleLanguageProficiencyChange = function (e, field) {
        var value = e.target.value;
        setError(null);
        setFormData(function (prevState) {
            var _a;
            return (Object.assign(Object.assign({}, prevState), { language_proficiency: Object.assign(Object.assign({}, prevState.language_proficiency), (_a = {}, _a[field] = value, _a)) }));
        });
    };
    var handleCapabilityToggle = function (capability) {
        setFormData(function (prev) { return (Object.assign(Object.assign({}, prev), { capabilities: prev.capabilities.includes(capability)
                ? prev.capabilities.filter(function (c) { return c !== capability; })
                : __spreadArray(__spreadArray([], prev.capabilities, true), [capability], false) })); });
    };
    var validateForm = function () {
        if (!formData.name.trim()) {
            setError('Name is required');
            return false;
        }
        if (formData.traits.length === 0) {
            setError('At least one trait is required');
            return false;
        }
        if (formData.abilities.length === 0) {
            setError('At least one ability is required');
            return false;
        }
        if (!formData.template_name.trim()) {
            setError('Template name is required');
            return false;
        }
        return true;
    };
    var validateEnhancedForm = function () {
        if (!validateForm())
            return false;
        if (formData.learning_config.learning_rate <= 0) {
            setError('Learning rate must be positive');
            return false;
        }
        if (formData.learning_config.knowledge_sources.length === 0) {
            setError('At least one knowledge source required');
            return false;
        }
        return true;
    };
    var handleSubmit = function (e) { return __awaiter(void 0, void 0, void 0, function () {
        var response, data, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    e.preventDefault();
                    setError(null);
                    setSuccess(false);
                    if (!validateEnhancedForm()) {
                        return [2 /*return*/];
                    }
                    setLoading(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, 5, 6]);
                    return [4 /*yield*/, fetch('/agents', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify(formData),
                        })];
                case 2:
                    response = _a.sent();
                    if (!response.ok) {
                        throw new Error('Failed to create agent');
                    }
                    return [4 /*yield*/, response.json()];
                case 3:
                    data = _a.sent();
                    setSuccess(true);
                    setFormData({
                        name: '',
                        traits: [],
                        abilities: [],
                        tools: [],
                        template_name: '',
                        role: 'Generic',
                        description: '',
                        channel: '',
                        personality: '',
                        specialization: '',
                        language_proficiency: { primary: 'English', secondary: '' },
                        capabilities: [],
                        learning_preferences: {
                            autonomous_learning: true,
                            feedback_integration: true,
                            knowledge_sources: []
                        },
                        collaboration_settings: {
                            team_integration: true,
                            communication_protocols: ['http', 'websocket'],
                            resource_sharing: true
                        },
                        learning_config: {
                            learning_rate: 0.01,
                            knowledge_sources: [],
                            adaptation_threshold: 0.5,
                            feedback_integration: true
                        },
                        collaboration_rules: {
                            allowed_peers: [],
                            resource_sharing: true,
                            communication_protocols: ['http', 'websocket'],
                            trust_levels: new Map()
                        }
                    });
                    return [3 /*break*/, 6];
                case 4:
                    error_1 = _a.sent();
                    console.error('Error creating agent:', error_1);
                    setError(error_1 instanceof Error ? error_1.message : 'Failed to create agent');
                    return [3 /*break*/, 6];
                case 5:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 6: return [2 /*return*/];
            }
        });
    }); };
    return (_jsxs("div", { className: "form-container ".concat(loading ? 'loading' : ''), children: [error && _jsx("div", { className: "error-message", children: error }), success && _jsx("div", { className: "success-message", children: "Agent created successfully!" }), _jsxs("form", { onSubmit: handleSubmit, children: [_jsxs("div", { children: [_jsx("label", { children: "Name:" }), _jsx("input", { type: "text", name: "name", value: formData.name, onChange: handleChange, required: true, placeholder: "Enter agent name", disabled: loading })] }), _jsxs("div", { children: [_jsx("label", { children: "Traits (comma-separated):" }), _jsx("input", { type: "text", name: "traits", value: formData.traits.join(', '), onChange: function (e) { return handleArrayChange(e, 'traits'); }, required: true, placeholder: "e.g., friendly, efficient, analytical", disabled: loading })] }), _jsxs("div", { children: [_jsx("label", { children: "Abilities (comma-separated):" }), _jsx("input", { type: "text", name: "abilities", value: formData.abilities.join(', '), onChange: function (e) { return handleArrayChange(e, 'abilities'); }, required: true, placeholder: "e.g., data analysis, customer support, coding", disabled: loading })] }), _jsxs("div", { children: [_jsx("label", { children: "Tools (comma-separated):" }), _jsx("input", { type: "text", name: "tools", value: formData.tools.join(', '), onChange: function (e) { return handleArrayChange(e, 'tools'); }, placeholder: "e.g., calculator, translator, code editor", disabled: loading })] }), _jsxs("div", { children: [_jsx("label", { children: "Template Name:" }), _jsx("input", { type: "text", name: "template_name", value: formData.template_name, onChange: handleChange, required: true, placeholder: "Enter template name", disabled: loading })] }), _jsxs("div", { children: [_jsx("label", { children: "Role:" }), _jsxs("select", { name: "role", value: formData.role, onChange: handleChange, disabled: loading, children: [_jsx("option", { value: "Generic", children: "Generic" }), _jsx("option", { value: "Customer Support", children: "Customer Support" }), _jsx("option", { value: "Technical Support", children: "Technical Support" }), _jsx("option", { value: "Sales", children: "Sales" }), _jsx("option", { value: "Marketing", children: "Marketing" })] })] }), _jsxs("div", { children: [_jsx("label", { children: "Description:" }), _jsx("textarea", { name: "description", value: formData.description, onChange: handleChange, placeholder: "Describe the agent's purpose and capabilities", disabled: loading })] }), _jsxs("div", { children: [_jsx("label", { children: "Channel:" }), _jsx("input", { type: "text", name: "channel", value: formData.channel, onChange: handleChange, placeholder: "Communication channel", disabled: loading })] }), _jsxs("div", { children: [_jsx("label", { children: "Personality:" }), _jsx("input", { type: "text", name: "personality", value: formData.personality, onChange: handleChange, placeholder: "Agent's personality traits", disabled: loading })] }), _jsxs("div", { children: [_jsx("label", { children: "Specialization:" }), _jsx("input", { type: "text", name: "specialization", value: formData.specialization, onChange: handleChange, placeholder: "Agent's area of expertise", disabled: loading })] }), _jsxs("div", { children: [_jsx("label", { children: "Primary Language:" }), _jsx("input", { type: "text", name: "language_proficiency_primary", value: formData.language_proficiency.primary, onChange: function (e) { return handleLanguageProficiencyChange(e, 'primary'); }, placeholder: "e.g., English", disabled: loading })] }), _jsxs("div", { children: [_jsx("label", { children: "Secondary Language:" }), _jsx("input", { type: "text", name: "language_proficiency_secondary", value: formData.language_proficiency.secondary, onChange: function (e) { return handleLanguageProficiencyChange(e, 'secondary'); }, placeholder: "e.g., Spanish (optional)", disabled: loading })] }), _jsx("button", { type: "submit", disabled: loading, children: loading ? 'Creating Agent...' : 'Create Agent' })] })] }));
};
exports.default = AgentCreationForm;
